import { build } from "esbuild";
import { spawnSync } from "node:child_process";

await build({
  entryPoints: ["scripts/verify-pdf-tools.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "tmp/verify-pdf-tools.mjs",
  external: ["pdf-lib", "@cantoo/pdf-lib", "pdfjs-dist/legacy/build/pdf.mjs"],
});

const run = spawnSync("node", ["tmp/verify-pdf-tools.mjs"], { stdio: "inherit" });
if (run.status !== 0) process.exit(run.status ?? 1);

const python = spawnSync("python3", ["-"], {
  stdio: ["pipe", "inherit", "inherit"],
  input: `
from pypdf import PdfReader

locked = PdfReader("/tmp/toolocean-locked.pdf")
assert locked.is_encrypted, "encrypted file did not ask for a password"
assert locked.decrypt("") == 0
assert locked.decrypt("open-me") == 1
assert "Hello fixture" in (locked.pages[0].extract_text() or "")

fresh = PdfReader("/tmp/toolocean-locked.pdf")
try:
    fresh.pages[0].extract_text()
    raised = False
except Exception:
    raised = True
assert raised, "reader extracted text from a locked file without a password"

unlocked = PdfReader("/tmp/toolocean-unlocked.pdf")
assert not unlocked.is_encrypted
assert "Hello fixture" in (unlocked.pages[0].extract_text() or "")
assert unlocked.metadata is not None
assert unlocked.metadata.get("/Author") == "Ada Lovelace"
assert unlocked.metadata.get("/Title") == "Probe Title"

restricted = PdfReader("/tmp/toolocean-restricted.pdf")
assert restricted.is_encrypted
assert restricted.decrypt("") == 1

plain = PdfReader("/tmp/toolocean-unrestricted.pdf")
assert not plain.is_encrypted
assert "Hello fixture" in (plain.pages[0].extract_text() or "")

signed = PdfReader("/tmp/toolocean-signed.pdf")
images = signed.pages[0].images
assert len(images) >= 1, "signature image missing"
assert "Hello fixture" in (signed.pages[0].extract_text() or "")

stripped = PdfReader("/tmp/toolocean-stripped.pdf")
meta = stripped.metadata or {}
for key in ("/Author", "/Title", "/Subject", "/Keywords", "/Creator", "/Producer"):
    assert not meta.get(key), f"stripped file still has {key}"

filled = PdfReader("/tmp/toolocean-filled.pdf")
text = filled.pages[0].extract_text() or ""
assert "Grace Hopper" in text, text
print("pypdf reader checks passed")
`,
});
if (python.status !== 0) process.exit(python.status ?? 1);
