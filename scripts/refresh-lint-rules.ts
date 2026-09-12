/**
 * Snapshots the rule names published by the linters this catalog defers to.
 *
 * Some of what the catalog describes is already checked by a linter. Where it
 * is, the rule stores that linter rule's name instead of this project growing
 * its own AST pattern for the same shape, which is the `guides` philosophy
 * applied to tooling: references, never copies.
 *
 * A name stored as a bare string is the thing this repo refuses everywhere
 * else, so the names are snapshotted here and `check:freshness` fails when a
 * rule is renamed or dropped upstream, rather than the site publishing a dead
 * link to a lint rule that no longer exists.
 *
 * The source is the published npm tarball rather than a docs page: it is the
 * artifact people actually install, it needs no token, and it pins the version
 * the snapshot was taken from.
 *
 * Run: pnpm refresh:lint-rules
 */
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

/**
 * Writes a committed snapshot at module scope, so importing it would
 * regenerate the very drift the freshness gate exists to detect. Same guard as
 * refresh-guides.ts.
 */
if (
  import.meta.url !== pathToFileURL(realpathSync(process.argv[1] ?? "")).href
) {
  throw new Error(
    "refresh-lint-rules.ts writes files and must be run, not imported. Export a function instead.",
  );
}

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, "../packages/catalog/src/generated/lint-rules.ts");

const REGISTRY = "https://registry.npmjs.org";
const USER_AGENT =
  "youmightnotneed/refresh-lint-rules (+https://github.com/jomaendle/youmightnotneed)";

/**
 * The linters a rule may name, by the prefix used in an eslint config. Adding
 * one here is all it takes for `lintRule` to accept `<prefix>/<name>`.
 */
const SOURCES = [
  {
    prefix: "unicorn",
    pkg: "eslint-plugin-unicorn",
    /** Rules are published one file per rule at rules/<name>.js. */
    path: /^package\/rules\/([a-z0-9-]+)\.js$/,
    docs: "https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/{rule}.md",
    /** Shared helpers live alongside the rules and are not rules themselves. */
    skip: new Set(["index", "utils", "shared"]),
  },
] as const;

interface Source {
  prefix: string;
  package: string;
  version: string;
  docs: string;
  rules: string[];
}

/** Lists file paths in a gzipped tarball, headers only. Same walk as refresh-guides.ts. */
function listTarballPaths(gzipped: Buffer): string[] {
  const buf = gunzipSync(gzipped);
  const paths: string[] = [];
  let offset = 0;

  while (offset + 512 <= buf.length) {
    const name = buf
      .toString("utf8", offset, offset + 100)
      .replace(/\0.*/s, "");
    if (name === "") {
      offset += 512;
      continue;
    }
    const rawSize = buf
      .toString("ascii", offset + 124, offset + 136)
      .replace(/\0.*/s, "")
      .trim();
    const size = Number.parseInt(rawSize, 8) || 0;
    const prefix = buf
      .toString("utf8", offset + 345, offset + 500)
      .replace(/\0.*/s, "");
    paths.push(prefix === "" ? name : `${prefix}/${name}`);
    offset += 512 + Math.ceil(size / 512) * 512;
  }

  return paths;
}

/** Reads the previous snapshot so a failed fetch keeps the committed data. */
function readExisting(): Source[] {
  if (!existsSync(outFile)) return [];
  const source = readFileSync(outFile, "utf8");
  const start = source.indexOf("{", source.indexOf("lintRuleSnapshot"));
  if (start === -1) return [];
  try {
    const parsed = JSON.parse(
      source.slice(start, source.lastIndexOf("}") + 1),
    ) as { sources?: Source[] };
    return parsed.sources ?? [];
  } catch {
    return [];
  }
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function fetchSource(spec: (typeof SOURCES)[number]): Promise<Source> {
  const meta = (await getJson(`${REGISTRY}/${spec.pkg}`)) as {
    "dist-tags"?: { latest?: string };
    versions?: Record<string, { dist?: { tarball?: string } }>;
  };
  const latest = meta["dist-tags"]?.latest;
  const tarball = latest ? meta.versions?.[latest]?.dist?.tarball : undefined;
  if (!(latest && tarball)) {
    throw new Error(`${spec.pkg} has no resolvable latest tarball`);
  }

  const res = await fetch(tarball, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${tarball} returned ${res.status}`);

  const rules: string[] = [];
  for (const path of listTarballPaths(Buffer.from(await res.arrayBuffer()))) {
    const match = spec.path.exec(path);
    const name = match?.[1];
    if (name && !spec.skip.has(name)) rules.push(name);
  }

  if (rules.length === 0) {
    throw new Error(
      `${spec.pkg} yielded no rules, the published layout may have moved`,
    );
  }

  return {
    prefix: spec.prefix,
    package: spec.pkg,
    version: latest,
    docs: spec.docs,
    rules: [...new Set(rules)].sort(),
  };
}

console.info("Fetching lint rule names...");

let sources: Source[];

try {
  sources = await Promise.all(SOURCES.map(fetchSource));

  // A partial read is the dangerous case: writing 2 of 339 rules succeeds
  // silently and then every lintRule fails the freshness check, pointing the
  // maintainer back at this command. A linter dropping a fifth of its rules in
  // one release is not plausible; a broken parse is.
  const previous = readExisting();
  for (const source of sources) {
    const before = previous.find((p) => p.prefix === source.prefix);
    if (before && source.rules.length < before.rules.length * 0.8) {
      throw new Error(
        `${source.package} yielded ${source.rules.length} rules but the committed snapshot has ${before.rules.length}. That is a bigger drop than an upstream release explains, so this looks like a parse failure`,
      );
    }
  }
} catch (error) {
  const existing = readExisting();
  if (existing.length === 0) throw error;
  console.error(`${(error as Error).message}. Keeping the committed snapshot.`);
  process.exit(1);
}

const fetchedOn = new Date().toISOString().slice(0, 10);

writeFileSync(
  outFile,
  `// Generated by scripts/refresh-lint-rules.ts. Do not edit by hand.
// Run \`pnpm refresh:lint-rules\` to update.

export interface LintRuleSource {
  /** Config prefix, e.g. "unicorn" in "unicorn/prefer-structured-clone". */
  prefix: string;
  /** The npm package the rules ship in. */
  package: string;
  /** The version the names were read from. */
  version: string;
  /** Docs URL template, with {rule} standing in for the rule name. */
  docs: string;
  /** Every rule name the package publishes, sorted. */
  rules: string[];
}

export interface LintRuleSnapshot {
  /** Date the names were taken, YYYY-MM-DD. */
  fetchedOn: string;
  sources: LintRuleSource[];
}

/**
 * The linters this catalog defers to, and every rule name they publish.
 *
 * A rule's \`lintRule\` is resolved against this, so a rule renamed upstream
 * fails the freshness check instead of shipping as a dead reference. None of
 * their implementations are vendored here, only the names.
 */
export const lintRuleSnapshot: LintRuleSnapshot = ${JSON.stringify(
    { fetchedOn, sources },
    null,
    2,
  )};
`,
);

const total = sources.reduce((n, s) => n + s.rules.length, 0);
console.info(
  `Wrote ${total} lint rule names from ${sources
    .map((s) => `${s.package}@${s.version}`)
    .join(", ")}.`,
);
