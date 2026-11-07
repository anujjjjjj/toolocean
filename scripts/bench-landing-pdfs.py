"""
Real-browser runs of the ToolOcean PDF tools behind the PDF landing pages.

Feeds src/data/landingBenchmarks.json. Drives the built site (dist/) through the
page's own file input and buttons, and records what the page hands to the
download. Benchmarks ToolOcean only.

  node scripts/build-landing-fixtures.mjs /tmp/landing-fixtures
  node scripts/serve-dist.mjs 4791 &
  python3 -P scripts/bench-landing-pdfs.py --fixtures /tmp/landing-fixtures \
      --qaguard /path/to/dir-containing-qaguard.py --out /tmp/landing-bench.json

The analytics guard (qaguard.py) is required: it maps every Umami/Google host to
NOTFOUND at the DNS layer and answers any request that slips through locally, so
a benchmark never reports to production analytics. window.umami is stubbed so the
tool-run payload can still be recorded.

Needs Python Playwright, pypdf and the Chromium Playwright ships with.
"""
import argparse
import asyncio
import hashlib
import json
import os
import platform
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

parser = argparse.ArgumentParser()
parser.add_argument("--fixtures", required=True)
parser.add_argument("--qaguard", required=True, help="directory containing qaguard.py")
parser.add_argument("--base", default="http://localhost:4791")
parser.add_argument("--repeats", type=int, default=5)
parser.add_argument("--out", required=True)
parser.add_argument("--keep", help="directory to keep output PDFs and page-1 renders in")
parser.add_argument("--dataset", help="also write the compact dataset the pages render (src/data/landingBenchmarks.json)")
parser.add_argument("--from-raw", help="skip the browser and rebuild --dataset from an earlier --out file")
args = parser.parse_args()

sys.path.insert(0, args.qaguard)
METHOD = (
    "Built site served locally from dist/. One fresh browser context per run, viewport 1280x900. "
    "The fixture is given to the page's own file input and the page's own button is pressed. "
    "Time runs from the button press to the moment the page hands the file to the download "
    "(or, when nothing is downloaded, until the refusal message appears); choosing the file is not timed. "
    "Output bytes are the downloaded file. Text selectability is pypdf text extraction on page 1. "
    "Analytics hosts were blocked at DNS and by request routing before the first navigation."
)
import qaguard  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
from pypdf import PdfReader  # noqa: E402

KB = 1024
manifest = json.load(open(os.path.join(args.fixtures, "manifest.json")))
FIX = {f["file"]: f for f in manifest["fixtures"]}

INIT = """
window.__runs = [];
window.umami = { track: (name, data) => window.__runs.push([name, data]) };
window.__blobs = [];
const realCreate = URL.createObjectURL.bind(URL);
URL.createObjectURL = (obj) => {
  if (obj instanceof Blob) window.__blobs.push({ size: obj.size, at: performance.now() });
  return realCreate(obj);
};
"""


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def inspect_pdf(path):
    reader = PdfReader(path)
    text = (reader.pages[0].extract_text() or "").strip()
    widths = []
    for page in reader.pages[:1]:
        xo = page["/Resources"].get("/XObject") or {}
        for key in xo:
            obj = xo[key].get_object()
            if obj.get("/Subtype") == "/Image":
                widths.append(int(obj["/Width"]))
    page_w_in = float(reader.pages[0].mediabox.width) / 72
    return {
        "pages": len(reader.pages),
        "textSelectable": len(text) > 0,
        "page1ImagePx": max(widths) if widths else None,
        "page1Ppi": round(max(widths) / page_w_in) if widths else None,
    }


def environment(browser_version):
    cpu = next((l.split(":", 1)[1].strip() for l in open("/proc/cpuinfo") if l.startswith("model name")), platform.processor())
    mem_kb = int(next(l.split()[1] for l in open("/proc/meminfo") if l.startswith("MemTotal")))
    os_name = next((l.split("=", 1)[1].strip().strip('"') for l in open("/etc/os-release") if l.startswith("PRETTY_NAME")), platform.system())
    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=repo, capture_output=True, text=True).stdout.strip()
    return {
        "browser": f"Chromium {browser_version} headless (Playwright)",
        "os": f"{os_name}, Linux {platform.release()}",
        "cpu": f"{cpu}, {os.cpu_count()} logical cores",
        "ramGiB": round(mem_kb / 1024 / 1024, 1),
        "commit": commit,
    }


async def open_page(browser, path, dsf=1):
    ctx = await browser.new_context(viewport={"width": 1280, "height": 900}, device_scale_factor=dsf, accept_downloads=True)
    await qaguard.install(ctx)
    requests = []
    ctx.on("request", lambda r: requests.append((r.method, r.url, r.post_data_buffer)))
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.add_init_script(INIT)
    await page.goto(args.base + path, wait_until="networkidle")
    return ctx, page, requests, errors


def uploads_after(requests, start, fixture_bytes):
    """Requests made after the file was chosen, minus blocked analytics. Any body is checked for PDF bytes."""
    later = requests[start:]
    non_analytics = [(m, u, b) for (m, u, b) in later if not qaguard.is_analytics(u)]
    bodies = [b for (_, _, b) in later if b]
    carried_pdf = any(b"%PDF" in b or any(chunk in b for chunk in fixture_bytes) for b in bodies)
    return {
        "nonAnalyticsRequests": len(non_analytics),
        "nonAnalyticsPaths": sorted({f"{m} {urlparse(u).path}" for (m, u, _) in non_analytics}),
        "requestsWithBody": len(bodies),
        "anyBodyCarriedPdf": carried_pdf,
    }


async def compress_run(browser, fixture, target, dsf=1, keep_as=None):
    ctx, page, requests, errors = await open_page(browser, "/compress-pdf-to-100kb", dsf)
    path = os.path.join(args.fixtures, fixture)
    raw = open(path, "rb").read()
    probes = [raw[len(raw) // 3: len(raw) // 3 + 64], raw[-200:-136]]
    embed = page.locator("[data-lean-embed='pdf-compress']")
    start = len(requests)
    await embed.locator("input[type=file]").last.set_input_files(path)
    await page.get_by_role("button", name="Fit to size & Download").wait_for(timeout=30000)
    if target != 100 * KB:
        await page.get_by_label("Custom PDF size").fill(str(target))
        await page.get_by_role("button", name="Use", exact=True).click()
    blobs_before = await page.evaluate("window.__blobs.length")
    download = None
    async def grab():
        nonlocal download
        download = await page.wait_for_event("download", timeout=600000)
    waiter = asyncio.create_task(grab())
    await page.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-lean-embed] button')].find(x => x.textContent.includes('Fit to size'));
      window.__t0 = performance.now(); b.click();
    }""")
    # A refused run (output not smaller than the input) toasts and downloads nothing.
    await page.wait_for_function(
        "n => window.__blobs.length > n || /would make this bigger|nothing to strip/i.test(document.body.textContent)",
        arg=blobs_before, timeout=600000)
    outcome_ms = round(await page.evaluate("performance.now() - window.__t0"))
    blobs = await page.evaluate("window.__blobs.map(b => ({size: b.size, ms: b.at - window.__t0}))")
    note = await page.evaluate("""() => [...document.querySelectorAll('[data-lean-embed] p')]
      .map(p => p.textContent.trim()).find(t => /Lossless rewrite fit|rasterised to fit|smallest raster copy/.test(t)) ?? null""")
    runs = [r for r in await page.evaluate("window.__runs") if r[0] == "tool-run"]
    result = {"fixture": fixture, "targetBytes": target, "dsf": dsf, "note": note, "toolRun": runs, "errors": errors}
    fresh = [b for b in blobs if b["ms"] >= 0]
    if fresh:
        await waiter
        out = os.path.join(args.keep or "/tmp", f"{keep_as or 'out'}.pdf")
        await download.save_as(out)
        size = os.path.getsize(out)
        result.update({"downloaded": True, "outputBytes": size, "ms": round(fresh[-1]["ms"]), **inspect_pdf(out)})
        result["withinTarget"] = size <= target
        if args.keep:
            subprocess.run(["pdftoppm", "-r", "72", "-png", "-f", "1", "-l", "1", "-singlefile", out, out[:-4]], check=False)
    else:
        waiter.cancel()
        refusal = await page.evaluate("""() => [...document.querySelectorAll('li, [role=status]')]
          .map(t => t.textContent.trim()).find(t => /would make this bigger|nothing to strip/i.test(t)) ?? null""")
        # No blob to time, so this is when the refusal appeared (polled, so within a frame or so).
        result.update({"downloaded": False, "refusal": refusal, "ms": outcome_ms})
    result["network"] = uploads_after(requests, start, probes)
    await ctx.close()
    return result


async def merge_run(browser, files, offline=False, keep_as=None):
    ctx, page, requests, errors = await open_page(browser, "/pdf-merge")
    paths = [os.path.join(args.fixtures, f) for f in files]
    probes = []
    for p in paths:
        raw = open(p, "rb").read()
        probes.append(raw[len(raw) // 2: len(raw) // 2 + 64])
    start = len(requests)
    await page.locator("#tool-workbench input[type=file][multiple]").first.set_input_files(paths)
    await page.wait_for_function("n => document.body.textContent.includes(`Files to Merge (${n})`)", arg=len(files), timeout=60000)
    if offline:
        await ctx.set_offline(True)
    async with page.expect_download(timeout=600000) as info:
        await page.evaluate("""() => {
          const b = [...document.querySelectorAll('#tool-workbench button')].find(x => x.textContent.includes('Merge & Download'));
          window.__t0 = performance.now(); b.click();
        }""")
    download = await info.value
    blobs = await page.evaluate("window.__blobs.map(b => ({size: b.size, ms: b.at - window.__t0}))")
    out = os.path.join(args.keep or "/tmp", f"{keep_as or 'merged'}.pdf")
    await download.save_as(out)
    runs = [r for r in await page.evaluate("window.__runs") if r[0] == "tool-run"]
    info_pdf = inspect_pdf(out)
    result = {
        "files": files, "offline": offline, "outputBytes": os.path.getsize(out),
        "ms": round([b for b in blobs if b["ms"] >= 0][-1]["ms"]), "pages": info_pdf["pages"],
        "textSelectable": info_pdf["textSelectable"], "toolRun": runs, "errors": errors,
        "network": uploads_after(requests, start, probes),
    }
    await ctx.close()
    return result


def summarise(runs):
    ok = [r for r in runs if r.get("downloaded", True)]
    ms = [r["ms"] for r in runs if r.get("ms") is not None]
    sizes = sorted({r["outputBytes"] for r in ok})
    return {
        "runs": len(runs),
        "downloads": len(ok),
        "outputBytes": sizes,
        "msMedian": round(statistics.median(ms)) if ms else None,
        "msMin": min(ms) if ms else None,
        "msMax": max(ms) if ms else None,
    }


COMPRESS = [
    ("seed-letter-1p.pdf", 102400),
    ("seed-letter-1p.pdf", 100000),
    ("seed-report-36p.pdf", 102400),
    ("seed-report-36p.pdf", 100000),
    ("seed-photo-1p.pdf", 102400),
    ("seed-noise-24p.pdf", 102400),
]
MERGE = ["seed-letter-1p.pdf", "seed-report-36p.pdf", "seed-photo-1p.pdf"]


def outcome(summary, raw):
    first = raw[0]
    if not first.get("downloaded"):
        return "cannot-fit-refused"
    if not first["withinTarget"]:
        return "cannot-fit-over-target"
    return "fit-lossless" if first["textSelectable"] and first.get("page1Ppi") is None else "fit-raster"


def build_dataset(raw):
    env = raw["environment"]
    compress = []
    for row in raw["compress"]:
        first = row["raw"][0]
        failures = sum(1 for r in row["raw"] if r["errors"] or r["note"] != first["note"])
        compress.append({
            "fixture": row["fixture"],
            "targetBytes": row["targetBytes"],
            "outcome": outcome(row["summary"], row["raw"]),
            "runs": row["summary"]["runs"],
            "inconsistentRuns": failures,
            "outputBytes": row["summary"]["outputBytes"],
            "note": first["note"],
            "refusal": first.get("refusal"),
            "textSelectable": first.get("textSelectable"),
            "page1Ppi": first.get("page1Ppi"),
            "msMedian": row["summary"]["msMedian"],
            "msMin": row["summary"]["msMin"],
            "msMax": row["summary"]["msMax"],
            "toolRunEvent": first["toolRun"][0][1] if first["toolRun"] else None,
            "requestsWithBodyAfterChoosing": max(r["network"]["requestsWithBody"] for r in row["raw"]),
        })
    merge_raw = raw["merge"]["raw"]
    merge = {
        "files": raw["merge"]["files"],
        **{k: raw["merge"]["summary"][k] for k in ("runs", "downloads", "outputBytes", "msMedian", "msMin", "msMax")},
        "pages": merge_raw[0]["pages"],
        "textSelectable": merge_raw[0]["textSelectable"],
        "requestsWithBodyAfterChoosing": max(r["network"]["requestsWithBody"] for r in merge_raw),
        "nonAnalyticsRequestsAfterChoosing": max(r["network"]["nonAnalyticsRequests"] for r in merge_raw),
        "anyBodyCarriedPdf": any(r["network"]["anyBodyCarriedPdf"] for r in merge_raw),
        "toolRunEvent": merge_raw[0]["toolRun"][0][1] if merge_raw[0]["toolRun"] else None,
        "offline": {
            "outputBytes": raw["merge"]["offline"]["outputBytes"],
            "pages": raw["merge"]["offline"]["pages"],
        },
    }
    return {
        "kb": KB,
        "measuredOn": raw["startedAt"][:10],
        "timeZone": "UTC",
        "environment": {**env, "viewport": "1280x900", "deviceScaleFactor": 1},
        "method": METHOD,
        "fixtureRecipe": {
            "command": "node scripts/build-landing-fixtures.mjs <dir>",
            "prng": raw["fixtures"]["prng"],
            "seed": raw["fixtures"]["seed"],
        },
        "fixtures": raw["fixtures"]["fixtures"],
        "compress": compress,
        "merge": merge,
        "pixelRatioCheck": [
            {"fixture": r["fixture"], "targetBytes": r["targetBytes"], "deviceScaleFactor": r["dsf"],
             "outputBytes": r.get("outputBytes"), "note": r["note"]}
            for r in raw["dsf2"]
        ],
    }


def write_dataset(raw):
    if args.dataset:
        with open(args.dataset, "w") as fh:
            json.dump(build_dataset(raw), fh, indent=2)
            fh.write("\n")
        print("wrote", args.dataset)


async def main():
    started = datetime.now(timezone.utc)
    if args.keep:
        os.makedirs(args.keep, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=qaguard.launch_args())
        env = environment(browser.version)
        compress = []
        for fixture, target in COMPRESS:
            runs = []
            for i in range(args.repeats):
                t = time.time()
                r = await compress_run(browser, fixture, target, keep_as=f"{fixture[:-4]}-{target}-r{i}")
                print(f"compress {fixture} @{target} r{i}: {r.get('outputBytes')} B {r.get('ms')} ms {r.get('note')!r} ({time.time() - t:.1f}s)", flush=True)
                runs.append(r)
            compress.append({"fixture": fixture, "targetBytes": target, "summary": summarise(runs), "raw": runs})
        dpr = []
        for fixture, target in [("seed-report-36p.pdf", 100000), ("seed-photo-1p.pdf", 102400)]:
            r = await compress_run(browser, fixture, target, dsf=2, keep_as=f"{fixture[:-4]}-{target}-dsf2")
            print(f"dsf2 {fixture} @{target}: {r.get('outputBytes')} B", flush=True)
            dpr.append(r)
        merge = []
        for i in range(args.repeats):
            r = await merge_run(browser, MERGE, keep_as=f"merged-r{i}")
            print(f"merge r{i}: {r['outputBytes']} B {r['ms']} ms", flush=True)
            merge.append(r)
        offline = await merge_run(browser, MERGE, offline=True, keep_as="merged-offline")
        print(f"merge offline: {offline['outputBytes']} B", flush=True)
        await browser.close()
    finished = datetime.now(timezone.utc)
    json.dump({
        "startedAt": started.isoformat(), "finishedAt": finished.isoformat(), "environment": env,
        "fixtures": manifest, "compress": compress, "dsf2": dpr,
        "merge": {"files": MERGE, "summary": summarise(merge), "raw": merge, "offline": offline},
        "blockedAnalytics": len(qaguard.BLOCKED),
    }, open(args.out, "w"), indent=2, default=lambda o: None)
    print("wrote", args.out)
    write_dataset(json.load(open(args.out)))


if args.from_raw:
    write_dataset(json.load(open(args.from_raw)))
else:
    asyncio.run(main())
