/**
 * Snapshots every browser version a rule cites in its prose.
 *
 * "Baseline status is derived, never hardcoded" covered the support TIER but
 * not the version numbers inside `agent.unless`, which were typed by hand and
 * went wrong: a review found seven rules naming a browser version the source
 * data contradicts, in the direction that gets someone shipping broken code.
 *
 * So a rule no longer writes a number. It writes a token, `{{browser:key}}`,
 * where key is either a web-features ID or a BCD path, and this resolves it:
 *
 *   "...below Safari {{safari:api.Crypto.randomUUID}}"  ->  "...below Safari 15.4"
 *
 * A token that cannot be resolved fails here rather than shipping a guess, and
 * `check-freshness` byte-compares the committed snapshot against a fresh
 * resolution so a hand-edited number cannot survive either.
 *
 * Run: pnpm refresh:support
 */
import {
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const rulesDir = join(repoRoot, "packages/catalog/src/rules");
const outFile = join(
  repoRoot,
  "packages/catalog/src/generated/support-claims.ts",
);

/** `{{safari:api.Crypto.randomUUID}}` or `{{chrome:content-visibility}}`. */
export const CLAIM_TOKEN = /\{\{([a-z_]+):([A-Za-z0-9_.-]+)\}\}/g;

interface WebFeature {
  status?: { support?: Record<string, string> };
}
interface BcdSupport {
  version_added?: string | boolean | null;
  flags?: unknown[];
}
interface BcdNode {
  __compat?: { support?: Record<string, BcdSupport | BcdSupport[]> };
  [key: string]: unknown;
}

const { features } = require("web-features") as {
  features: Record<string, WebFeature>;
};
const bcd = require("@mdn/browser-compat-data") as BcdNode;

/**
 * Neither package exports ./package.json, so walk up from the resolved entry
 * point the way refresh-baseline.ts does.
 */
function readVersion(pkg: string): string {
  let dir = dirname(require.resolve(pkg));
  for (let depth = 0; depth < 6; depth += 1) {
    try {
      const meta = JSON.parse(
        readFileSync(join(dir, "package.json"), "utf8"),
      ) as { name?: string; version?: string };
      if (meta.name === pkg && meta.version) return meta.version;
    } catch {
      // Keep walking up.
    }
    dir = dirname(dir);
  }
  throw new Error(`could not determine the installed ${pkg} version`);
}

/** Walks a dotted BCD path, e.g. api.Crypto.randomUUID. */
function bcdNode(path: string): BcdNode | undefined {
  let node: BcdNode | undefined = bcd;
  for (const segment of path.split(".")) {
    node = node?.[segment] as BcdNode | undefined;
    if (!node) return undefined;
  }
  return node;
}

/**
 * The first unflagged version a browser shipped something in. A `true` means
 * BCD knows it is supported but not since when, which is not a number we can
 * put in front of a reader, so it fails alongside `false` and null.
 */
function bcdVersion(path: string, browser: string): string | null {
  const support = bcdNode(path)?.__compat?.support?.[browser];
  if (!support) return null;
  const entries = Array.isArray(support) ? support : [support];
  for (const entry of entries) {
    if (entry.flags && entry.flags.length > 0) continue;
    if (typeof entry.version_added === "string") return entry.version_added;
  }
  return null;
}

function featureVersion(id: string, browser: string): string | null {
  return features[id]?.status?.support?.[browser] ?? null;
}

/** A dot means a BCD path. Everything else is a web-features ID. */
function resolve(browser: string, key: string): string | null {
  return key.includes(".")
    ? bcdVersion(key, browser)
    : featureVersion(key, browser);
}

export interface Resolution {
  claims: Record<string, string>;
  failures: string[];
}

/**
 * Re-derives every claim from the rule sources. Exported so check-freshness
 * can compare the committed snapshot against the source data rather than
 * trusting it, which is the whole point: a hand-edited version must fail.
 */
/** Why a token could not be resolved, phrased for whoever has to fix it. */
function explainFailure(file: string, browser: string, key: string): string {
  const reason = key.includes(".")
    ? `BCD has no unflagged ${browser} version for "${key}".`
    : `web-features has no ${browser} version for "${key}"; if this needs member-level detail, use a BCD path instead.`;
  return `${file}: {{${browser}:${key}}} does not resolve. ${reason}`;
}

/** Every distinct token one rule file cites, in source order. */
function tokensIn(file: string): { browser: string; key: string }[] {
  const source = readFileSync(join(rulesDir, file), "utf8");
  const found: { browser: string; key: string }[] = [];
  for (const [, browser, key] of source.matchAll(CLAIM_TOKEN)) {
    if (browser && key) found.push({ browser, key });
  }
  return found;
}

export function resolveAllClaims(): Resolution {
  const claims: Record<string, string> = {};
  const failures: string[] = [];
  const ruleFiles = readdirSync(rulesDir)
    .sort()
    .filter((file) => file.endsWith(".ts") && file !== "index.ts");

  for (const file of ruleFiles) {
    for (const { browser, key } of tokensIn(file)) {
      const token = `${browser}:${key}`;
      if (claims[token]) continue;

      const version = resolve(browser, key);
      if (version === null) {
        failures.push(explainFailure(file, browser, key));
        continue;
      }
      claims[token] = version;
    }
  }

  const ordered: Record<string, string> = {};
  for (const token of Object.keys(claims).sort()) {
    ordered[token] = claims[token] as string;
  }

  return { claims: ordered, failures };
}

/** Source versions the snapshot records, so drift can be detected. */
export function sourceVersions(): {
  webFeaturesVersion: string;
  bcdVersion: string;
} {
  return {
    webFeaturesVersion: readVersion("web-features"),
    bcdVersion: readVersion("@mdn/browser-compat-data"),
  };
}

function main(): void {
  const { claims: ordered, failures } = resolveAllClaims();

  if (failures.length > 0) {
    console.error("Unresolvable support claims:\n");
    for (const failure of failures) console.error(`  ${failure}`);
    console.error(
      "\nA rule may not state a browser version the source data cannot confirm. Reword the condition, or point the token at a key that exists.",
    );
    process.exit(1);
  }

  writeFileSync(
    outFile,
    `// Generated by scripts/refresh-support.ts. Do not edit by hand.
// Run \`pnpm refresh:support\` to update.

export interface SupportClaims {
  /** Date these versions were resolved, YYYY-MM-DD. */
  generatedOn: string;
  /** Versions of the two sources they came from. */
  webFeaturesVersion: string;
  bcdVersion: string;
  /** "<browser>:<web-features id or BCD path>" to the version that shipped it. */
  claims: Record<string, string>;
}

/**
 * Every browser version the catalog's prose cites, resolved from web-features
 * and MDN's browser-compat-data. No rule writes a version number by hand.
 */
export const supportClaims: SupportClaims = ${JSON.stringify(
      {
        generatedOn: new Date().toISOString().slice(0, 10),
        ...sourceVersions(),
        claims: ordered,
      },
      null,
      2,
    )};
`,
    "utf8",
  );

  const { webFeaturesVersion, bcdVersion } = sourceVersions();
  console.info(
    `Resolved ${Object.keys(ordered).length} support claims from web-features@${webFeaturesVersion} and bcd@${bcdVersion}.`,
  );
}

/** Only write when run directly, so importing this cannot repair drift. */
function isEntryPoint(): boolean {
  const argv1 = process.argv[1];
  if (argv1 === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(argv1)).href;
  } catch {
    return false;
  }
}

if (isEntryPoint()) main();
