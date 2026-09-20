/**
 * Snapshots minified-and-gzipped bundle sizes for every package the catalog
 * claims it can replace.
 *
 * Sizes are never fetched at request time. This writes a committed snapshot
 * with the date it was taken, so a report can say where its numbers came from
 * and how old they are.
 *
 * Existing entries survive a failed fetch, so one flaky request cannot quietly
 * erase the data. Packages that fail are reported at the end.
 *
 * Run: pnpm refresh:sizes
 */
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { rules } from "../packages/catalog/src/rules/index.ts";

/**
 * This script writes committed snapshots at module scope. Importing it would
 * regenerate them as a side effect, which is exactly how a gate that imports a
 * refresh script would end up repairing the drift it exists to detect. Fail
 * loudly instead: a caller that needs the data should export a function from
 * here, the way build-skill.ts and refresh-support.ts do.
 */
if (
  import.meta.url !== pathToFileURL(realpathSync(process.argv[1] ?? "")).href
) {
  throw new Error(
    "refresh-sizes.ts writes files and must be run, not imported. Export a function instead.",
  );
}

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, "../packages/catalog/src/generated/sizes.ts");

const API = "https://bundlephobia.com/api/size";
const USER_AGENT =
  "youmightnotneed/refresh-sizes (+https://github.com/jomaendle/youmightnotneed)";
const CONCURRENCY = 3;
const DELAY_MS = 350;

interface SizeEntry {
  gzip: number;
  raw: number;
  version: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Reads the previous snapshot so a failed fetch keeps its old value. */
function readExisting(): Record<string, SizeEntry> {
  if (!existsSync(outFile)) return {};
  const source = readFileSync(outFile, "utf8");
  const start = source.indexOf("{", source.indexOf("packageSizes"));
  if (start === -1) return {};
  const end = source.lastIndexOf("}");
  try {
    const parsed = JSON.parse(source.slice(start, end + 1)) as {
      sizes?: Record<string, SizeEntry>;
    };
    return parsed.sizes ?? {};
  } catch {
    return {};
  }
}

async function fetchSize(pkg: string): Promise<SizeEntry | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(`${API}?package=${encodeURIComponent(pkg)}`, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (res.status === 429) {
        await sleep(2000 * 2 ** attempt);
        continue;
      }
      if (!res.ok) return null;
      const json = (await res.json()) as {
        gzip?: number;
        size?: number;
        version?: string;
      };
      if (typeof json.gzip !== "number") return null;
      return {
        gzip: json.gzip,
        raw: json.size ?? json.gzip,
        version: json.version ?? "unknown",
      };
    } catch {
      await sleep(1000 * 2 ** attempt);
    }
  }
  return null;
}

const packages = [...new Set(rules.flatMap((r) => r.replaces))].sort();
const existing = readExisting();
const sizes: Record<string, SizeEntry> = {};
const failed: string[] = [];
/**
 * Claimed packages that had a size and could not fetch one now, so their old
 * value was carried forward. This, not the shape of `sizes`, is the signal a
 * run should not be committed: every one of these is already written into
 * `sizes` from `existing`, which is exactly why looking at `sizes` cannot
 * find them.
 */
const fellBack: string[] = [];

console.info(`Fetching sizes for ${packages.length} packages...`);

for (let i = 0; i < packages.length; i += CONCURRENCY) {
  const batch = packages.slice(i, i + CONCURRENCY);
  const results = await Promise.all(
    batch.map(async (pkg) => [pkg, await fetchSize(pkg)] as const),
  );
  for (const [pkg, entry] of results) {
    const previous = existing[pkg];
    if (entry) {
      sizes[pkg] = entry;
    } else if (previous) {
      sizes[pkg] = previous;
      fellBack.push(pkg);
      failed.push(`${pkg} (kept previous value)`);
    } else {
      failed.push(pkg);
    }
  }
  process.stdout.write(
    `\r  ${Math.min(i + CONCURRENCY, packages.length)}/${packages.length}`,
  );
  await sleep(DELAY_MS);
}
process.stdout.write("\n");

// A run where every fetch failed is indistinguishable from a clean no-change
// run once the file is rewritten: the old values are copied forward and
// fetchedOn is stamped today, which clears the staleness warning that should
// have fired. Bail instead, so the committed snapshot keeps its real date.
const fetched = packages.length - failed.length;
if (fetched === 0 && packages.length > 0) {
  console.error(
    `\nEvery one of the ${packages.length} fetches failed. Leaving the committed snapshot alone.`,
  );
  process.exit(1);
}

// Bailing only on 0-of-N missed the shape a rate-limited bundlephobia actually
// produces: 1-of-N succeeds, the other 122 fall back to their old values, and
// the file is stamped fresh anyway. A package that had a size and no longer
// fetches one is the signal that this run should not be committed.
// This used to read `Object.keys(existing).filter((pkg) => !sizes[pkg])`,
// which had two problems. It counted packages dropped from a rule's
// `replaces`, so removing a rule blocked every later refresh. And narrowing
// it to still-claimed packages made it match nothing at all: a claimed
// package that fails to fetch has its old value copied into `sizes` four
// lines above, so `!sizes[pkg]` can never be true for one. `fellBack` is the
// same question asked where the answer survives.
if (fellBack.length > 0) {
  console.error(
    `\n${fellBack.length} package(s) had a size and no longer fetch one: ${fellBack.slice(0, 5).join(", ")}. Leaving the committed snapshot alone.`,
  );
  process.exit(1);
}

// Belt and braces: never write an empty map. If the previous file failed to
// parse and the network is also down, this is the path that would erase it.
if (Object.keys(sizes).length === 0) {
  console.error("\nNo sizes to write. Leaving the committed snapshot alone.");
  process.exit(1);
}

const ordered: Record<string, SizeEntry> = {};
for (const key of Object.keys(sizes).sort()) {
  const value = sizes[key];
  if (value) ordered[key] = value;
}

const fetchedOn = new Date().toISOString().slice(0, 10);

writeFileSync(
  outFile,
  `// Generated by scripts/refresh-sizes.ts. Do not edit by hand.
// Run \`pnpm refresh:sizes\` to update.

/** Minified and gzipped size of a package's main entry point. */
export interface PackageSize {
  /** Bytes, minified and gzipped. */
  gzip: number;
  /** Bytes, minified only. */
  raw: number;
  /** The version measured. */
  version: string;
}

export interface SizeSnapshot {
  /** Date these sizes were fetched, YYYY-MM-DD. */
  fetchedOn: string;
  /** Where the numbers came from, shown in the UI for provenance. */
  source: string;
  sizes: Record<string, PackageSize>;
}

export const packageSizes: SizeSnapshot = ${JSON.stringify(
    { fetchedOn, source: "bundlephobia.com", sizes: ordered },
    null,
    2,
  )};
`,
  "utf8",
);

console.info(`Wrote ${Object.keys(ordered).length} package sizes.`);
if (failed.length > 0) {
  console.warn(`\nNo size for ${failed.length} package(s):`);
  for (const name of failed) console.warn(`  ${name}`);
  console.warn(
    "\nCheck these names exist on npm. A typo in `replaces` means the rule can never match.",
  );
}
