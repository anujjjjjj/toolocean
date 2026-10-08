/**
 * Build-time guard for the tool catalog.
 *
 * Every tool is served from a flat, root-level slug (/json-formatter), so slugs
 * must be globally unique. A collision would silently make one of the two tools
 * unreachable, which is exactly the class of bug that is invisible in review and
 * obvious in production. Runs before every build.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/*
 * Every file the build text-parses must exist AND be tracked by git.
 *
 * src/data/landingPages.ts was once untracked while generate-sitemap.mjs read it
 * with a bare readFileSync and prerenderRoutes.ts imported it. The working copy
 * built fine; a clean checkout died with ENOENT before Vite ever ran, so three
 * weeks of commits could not be deployed and nobody noticed, because the only
 * machine anyone built on was the one holding the untracked file.
 */
const BUILD_INPUTS = [
  "src/data/toolCatalog.ts",
  "src/data/tools.json",
  "src/data/toolSeo.ts",
  "src/data/staticPageSeo.ts",
  "src/data/landingPages.ts",
];

const untracked = [];
for (const rel of BUILD_INPUTS) {
  if (!existsSync(resolve(ROOT, rel))) {
    untracked.push(`  ${rel}  (missing)`);
    continue;
  }
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", rel], { cwd: ROOT, stdio: "ignore" });
  } catch {
    untracked.push(`  ${rel}  (exists but untracked)`);
  }
}

if (untracked.length > 0) {
  console.error(
    `\n✗ ${untracked.length} build input(s) would not survive a clean checkout:\n${untracked.join("\n")}\n\n` +
      `The build reads these directly. Commit them, or a fresh clone fails before Vite starts.\n`,
  );
  process.exit(1);
}

const catalogSource = readFileSync(resolve(ROOT, "src/data/toolCatalog.ts"), "utf-8");
const categoryTools = [...catalogSource.matchAll(/\{ id: "([^"]+)", category: "([^"]+)"/g)].map(
  ([, id, category]) => ({ id, category }),
);

const devTools = JSON.parse(readFileSync(resolve(ROOT, "src/data/tools.json"), "utf-8")).tools.map(
  (tool) => ({ id: tool.id, category: "dev" }),
);

const all = [...devTools, ...categoryTools];

const seen = new Map();
const collisions = [];
for (const tool of all) {
  if (seen.has(tool.id)) {
    collisions.push(`  ${tool.id}  (${seen.get(tool.id)} + ${tool.category})`);
  } else {
    seen.set(tool.id, tool.category);
  }
}

if (collisions.length > 0) {
  console.error(
    `\n✗ Tool slug collision. These ids resolve to the same root URL:\n${collisions.join("\n")}\n\n` +
      `Give one of each pair a distinct id, or cross-list it via CROSS_LISTED in src/data/toolCatalog.ts.\n`,
  );
  process.exit(1);
}

// Guard against a tool existing in the catalog but having no page content source.
const seoSource = readFileSync(resolve(ROOT, "src/data/toolSeo.ts"), "utf-8");
const seoBody = seoSource.slice(seoSource.indexOf("export const toolSeoData"));
const seoKeys = new Set([...seoBody.matchAll(/^ {2}"([^"]+)":\s*\{/gm)].map(([, key]) => key));

const missingSeo = all.filter(
  (tool) => !seoKeys.has(tool.id) && ![...seoKeys].some((key) => key.endsWith(`/${tool.id}`)),
);

if (missingSeo.length > 0) {
  console.error(
    `\n✗ ${missingSeo.length} tool(s) have no entry in src/data/toolSeo.ts, so their page would fall back to a bare name:\n` +
      missingSeo.map((tool) => `  ${tool.id}`).join("\n") +
      "\n",
  );
  process.exit(1);
}

/*
 * Icon names in authored content must exist in the tool-page icon map.
 *
 * resolveIcon falls back to a wrench for anything it does not recognise, which
 * is the right runtime behaviour and a terrible authoring experience: a typo
 * ships a wrench beside a feature card and nothing anywhere reports it. With
 * content being written for 114 tools, that fails quietly at scale.
 */
const iconSource = readFileSync(resolve(ROOT, "src/components/tool-page/icons.ts"), "utf-8");
const iconMap = iconSource.slice(iconSource.indexOf("const ICONS"));
/*
 * Matches both `Wrench,` shorthand and `Infinity: InfinityIcon,` aliases. The
 * first version of this only caught the shorthand, so it reported a correctly
 * registered icon as missing.
 */
const knownIcons = new Set(
  [...iconMap.matchAll(/^\s{2}([A-Z][A-Za-z0-9]*)\s*(?:,|:)/gm)].map(([, name]) => name),
);

const contentDir = resolve(ROOT, "src/data/toolContent");
const unknownIcons = [];
if (existsSync(contentDir)) {
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ts")) {
        const body = readFileSync(full, "utf-8");
        for (const [, name] of body.matchAll(/\bicon:\s*"([^"]+)"/g)) {
          if (!knownIcons.has(name)) unknownIcons.push(`  ${name}  (${entry.name})`);
        }
      }
    }
  };
  walk(contentDir);
}

if (unknownIcons.length > 0) {
  console.error(
    `\n✗ ${unknownIcons.length} icon name(s) are not in src/components/tool-page/icons.ts, ` +
      `so they would silently render a wrench:\n${[...new Set(unknownIcons)].join("\n")}\n`,
  );
  process.exit(1);
}

console.log(
  `✓ catalog: ${all.length} tools, unique slugs, all have SEO content, ${BUILD_INPUTS.length} build inputs tracked, icons resolve`,
);

/*
 * Title length is a warning, not a failure. Google truncates around 60 characters,
 * and the brand suffix is only appended when the result still fits (see titleWithBrand).
 */
const BRAND = " | ToolOcean";
const MAX_TITLE = 60;
function visibleTitle(title) {
  if (title.includes("ToolOcean")) return title;
  const branded = `${title}${BRAND}`;
  return branded.length <= MAX_TITLE ? branded : title;
}
const longTitles = [];
const collect = (source, label) => {
  for (const match of source.matchAll(/title:\s*(?:"([^"]+)"|`([^`]+)`)/g)) {
    const raw = match[1] ?? match[2];
    if (!raw || raw.includes("${")) continue;
    const visible = visibleTitle(raw);
    if (visible.length > MAX_TITLE) longTitles.push(`  ${visible.length}  ${label}  ${visible}`);
  }
};
collect(seoSource, "toolSeo");
collect(readFileSync(resolve(ROOT, "src/data/staticPageSeo.ts"), "utf8"), "static");
const contentDirForTitles = resolve(ROOT, "src/data/toolContent");
if (existsSync(contentDirForTitles)) {
  for (const entry of readdirSync(contentDirForTitles)) {
    if (!entry.endsWith(".ts")) continue;
    const body = readFileSync(resolve(contentDirForTitles, entry), "utf8");
    const seoBlock = body.match(/seo:\s*\{[\s\S]*?\n  \},/);
    if (seoBlock) collect(seoBlock[0], entry);
  }
}
if (longTitles.length > 0) {
  console.warn(
    `\n! ${longTitles.length} title(s) are over ${MAX_TITLE} characters in the SERP. Not a build failure.\n` +
      longTitles.slice(0, 40).join("\n") +
      (longTitles.length > 40 ? `\n  … ${longTitles.length - 40} more` : "") +
      "\n",
  );
}
