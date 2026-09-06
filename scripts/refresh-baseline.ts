/**
 * Snapshots Baseline support for every web-features ID the catalog references.
 *
 * Baseline status is never written by hand. This script reads the
 * `web-features` package, the same data source behind Baseline itself, and
 * writes a small committed snapshot covering only the features the rules
 * actually use. The catalog then ships with no runtime dependency on
 * web-features, and the snapshot is reviewable in a diff when support moves.
 *
 * Run: pnpm refresh:baseline
 */
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NATIVE_FEATURE_IDS } from "../apps/web/lib/native-usage.ts";
import { baselineHistory } from "../packages/catalog/src/generated/baseline-history.ts";
import { rules } from "../packages/catalog/src/rules/index.ts";
import type { BaselineStatus, Rule } from "../packages/catalog/src/schema.ts";

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
    "refresh-baseline.ts writes files and must be run, not imported. Export a function instead.",
  );
}

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outFile = join(repoRoot, "packages/catalog/src/generated/baseline.ts");
const historyOutFile = join(
  repoRoot,
  "packages/catalog/src/generated/baseline-history.ts",
);

/**
 * The browsers shown in the per-feature support row, in display order.
 * Desktop engines only: mobile variants (chrome_android, firefox_android,
 * safari_ios) track their desktop counterpart closely enough that showing
 * both would double the row's width for little new information.
 */
const TRACKED_BROWSERS = ["chrome", "edge", "firefox", "safari"] as const;

interface WebFeature {
  name?: string;
  status?: {
    baseline?: "high" | "low" | false;
    baseline_low_date?: string;
    baseline_high_date?: string;
    support?: Record<string, string>;
    /** Per-BCD-key status, which a feature carries even when the aggregate does not. */
    by_compat_key?: Record<
      string,
      { baseline?: "high" | "low" | false; support?: Record<string, string> }
    >;
  };
  spec?: string | string[];
}

const { features } = require("web-features") as {
  features: Record<string, WebFeature>;
};
/** web-features does not export ./package.json, so read it off disk. */
function readWebFeaturesVersion(): string {
  let dir = dirname(require.resolve("web-features"));
  for (let depth = 0; depth < 5; depth += 1) {
    try {
      const pkg = JSON.parse(
        readFileSync(join(dir, "package.json"), "utf8"),
      ) as { name?: string; version?: string };
      if (pkg.name === "web-features" && pkg.version) return pkg.version;
    } catch {
      // Keep walking up.
    }
    dir = dirname(dir);
  }
  throw new Error("could not determine the installed web-features version");
}

const webFeaturesVersion = readWebFeaturesVersion();

/*
 * Rules are the main source, but the site also uses features no rule
 * references (:has(), invoker commands, light-dark()). Those need to be in the
 * snapshot too, or /native renders them as "Unverified" with a raw ID.
 */
const referenced = [
  ...new Set([
    ...rules.flatMap((rule) => rule.featureIds),
    ...NATIVE_FEATURE_IDS,
  ]),
].sort();

const missing = referenced.filter((id) => !features[id]);
if (missing.length > 0) {
  console.error(
    `These featureIds are not in web-features@${webFeaturesVersion}:\n  ${missing.join("\n  ")}\n\nFix the rule, or give it an explicit manualBaseline.`,
  );
  process.exit(1);
}

/** Dates arrive as YYYY-MM-DD, sometimes prefixed with a range marker. */
function cleanDate(value: string | undefined): string | null {
  if (!value) return null;
  const match = /\d{4}-\d{2}-\d{2}/.exec(value);
  return match ? match[0] : null;
}

function firstSpec(spec: string | string[] | undefined): string | null {
  if (!spec) return null;
  return Array.isArray(spec) ? (spec[0] ?? null) : spec;
}

/** Picks only the browsers this catalog displays, dropping the rest (Android/iOS variants, etc.). */
function trackedSupport(
  support: Record<string, string> | undefined,
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const browser of TRACKED_BROWSERS) {
    result[browser] = support?.[browser] ?? null;
  }
  return result;
}

/**
 * A feature that is not Baseline as a whole gets no aggregate `support` from
 * web-features, even when almost all of its parts have shipped everywhere.
 * Anchor positioning is the case that exposed this: 319 of its 325 compat keys
 * are Baseline since 2026-01-13, six are not, and the feature therefore
 * publishes `support: {}`. Rendered as four dashes, that reads as "no engine
 * has this", which is the opposite of the truth.
 *
 * So a feature with no aggregate names one compat key that stands in for it,
 * and the versions come from web-features' own `by_compat_key`. Nothing is
 * computed across keys and nothing is typed by hand: the stand-in is a
 * pointer, and if a feature loses its aggregate without one being named here,
 * the refresh fails rather than shipping a row of dashes.
 *
 * Pick the key a reader would look up: the property or interface the rules
 * actually write, not the widest or the narrowest part of the feature.
 */
const SUPPORT_STANDINS: Record<string, string> = {
  // The property that establishes an anchor. Chrome's own docs badge the API
  // with these versions. position-anchor is deliberately not the stand-in: it
  // shipped with a non-standard initial value and BCD only counts it from
  // Chrome 151.
  "anchor-positioning": "css.properties.anchor-name",
  // The pseudo-element itself. Its `next` and `prev` arguments have no data
  // anywhere, which is what empties the aggregate.
  "scroll-buttons": "css.selectors.scroll-button",
};

/**
 * Features with no aggregate support and no per-key data either, so there is
 * nothing to stand in. Masonry is the whole set today: web-features tracks it
 * with zero compat features because the syntax is not settled.
 */
const NO_SUPPORT_DATA = new Set(["masonry"]);

function hasNoTrackedVersion(support: Record<string, string | null>): boolean {
  return TRACKED_BROWSERS.every((browser) => support[browser] === null);
}

/**
 * Resolves the stand-in row for a feature whose aggregate is empty. Returns
 * null when the aggregate is fine, and exits when a feature needs a stand-in
 * that nobody declared.
 */
function partialSupport(
  id: string,
  feature: WebFeature,
  aggregate: Record<string, string | null>,
): { key: string; support: Record<string, string | null> } | null {
  if (!hasNoTrackedVersion(aggregate)) return null;
  if (NO_SUPPORT_DATA.has(id)) return null;

  const key = SUPPORT_STANDINS[id];
  const byKey = feature.status?.by_compat_key;
  if (!(key && byKey)) {
    console.error(
      `web-features publishes no aggregate support for "${id}", so its row would render as dashes in every browser. Name a compat key for it in SUPPORT_STANDINS in this script, or add it to NO_SUPPORT_DATA if it genuinely has no data. Its keys with data:\n  ${suggestKeys(byKey).join("\n  ")}`,
    );
    process.exit(1);
  }

  const entry = byKey[key];
  if (!entry?.support) {
    console.error(
      `SUPPORT_STANDINS points "${id}" at "${key}", which web-features@${webFeaturesVersion} does not carry support data for. Pick another key.`,
    );
    process.exit(1);
  }

  return { key, support: trackedSupport(entry.support) };
}

/** The first few compat keys that do have versions, to make the error actionable. */
function suggestKeys(
  byKey: Record<string, { support?: Record<string, string> }> | undefined,
): string[] {
  if (!byKey) return ["(none: the feature has no compat keys at all)"];
  return Object.entries(byKey)
    .filter(([, v]) => v.support && Object.keys(v.support).length > 0)
    .slice(0, 8)
    .map(([k, v]) => `${k} ${JSON.stringify(v.support)}`);
}

const snapshot: Record<string, unknown> = {};
for (const id of referenced) {
  const feature = features[id];
  if (!feature) continue;
  const support = trackedSupport(feature.status?.support);
  snapshot[id] = {
    name: feature.name ?? id,
    baseline: feature.status?.baseline ?? false,
    lowDate: cleanDate(feature.status?.baseline_low_date),
    highDate: cleanDate(feature.status?.baseline_high_date),
    spec: firstSpec(feature.spec),
    support,
    partialSupport: partialSupport(id, feature, support),
  };
}

const generatedOn = new Date().toISOString().slice(0, 10);

const body = `// Generated by scripts/refresh-baseline.ts. Do not edit by hand.
// Run \`pnpm refresh:baseline\` to update.

/** Raw Baseline state for one feature, as web-features reports it. */
export interface BaselineSnapshotEntry {
  /** Human-readable feature name, e.g. "Scroll snap". */
  name: string;
  /** "high" is widely available, "low" is newly available, false is limited. */
  baseline: "high" | "low" | false;
  /** Date the feature became newly available. */
  lowDate: string | null;
  /** Date the feature became widely available. */
  highDate: string | null;
  /** Canonical specification URL, when web-features records one. */
  spec: string | null;
  /**
   * Minimum version each tracked browser needs, keyed by ${TRACKED_BROWSERS.join(", ")}.
   * Null means web-features has no support data for that browser (commonly
   * because the feature never shipped there).
   */
  support: Record<string, string | null>;
  /**
   * Set only when web-features publishes no aggregate support for the feature.
   * \`key\` names one of its BCD compat keys and \`support\` is that key's own
   * versions, straight from web-features. It describes a part of the feature,
   * never the whole, so it is shown with the part named next to it.
   */
  partialSupport: {
    key: string;
    support: Record<string, string | null>;
  } | null;
}

export interface BaselineSnapshot {
  /** Date this snapshot was generated, YYYY-MM-DD. */
  generatedOn: string;
  /** The web-features release the data came from. */
  webFeaturesVersion: string;
  features: Record<string, BaselineSnapshotEntry>;
}

export const baselineSnapshot: BaselineSnapshot = ${JSON.stringify(
  { generatedOn, webFeaturesVersion, features: snapshot },
  null,
  2,
)};
`;

writeFileSync(outFile, body, "utf8");

/*
 * Per-rule tier tally, computed from this run's in-memory `snapshot`, not
 * from resolveBaseline()/generated/baseline.ts: that module is a static ES
 * import of the file this script is currently overwriting, so it would still
 * reflect the *previous* run when read here.
 */
const RANK: Record<BaselineStatus, number> = {
  widely: 3,
  newly: 2,
  limited: 1,
  unknown: 0,
};

function featureStatus(id: string): BaselineStatus {
  const entry = snapshot[id] as
    | { baseline: "high" | "low" | false }
    | undefined;
  if (!entry) return "unknown";
  if (entry.baseline === "high") return "widely";
  if (entry.baseline === "low") return "newly";
  return "limited";
}

function ruleStatus(rule: Rule): BaselineStatus {
  if (rule.featureIds.length === 0) {
    // Mirrors resolveBaseline: no features and no hand-verified claim is a
    // data error, and it reports as unknown rather than defaulting to the
    // best tier. The schema forbids it, but this tally is written into a
    // permanent committed file, so it should not quietly overstate support.
    return rule.manualBaseline?.status ?? "unknown";
  }
  let worst: BaselineStatus = "widely";
  for (const id of rule.featureIds) {
    const status = featureStatus(id);
    if (RANK[status] < RANK[worst]) worst = status;
  }
  return worst;
}

const ruleTally = { widely: 0, newly: 0, limited: 0, unknown: 0 };
for (const rule of rules) ruleTally[ruleStatus(rule)] += 1;

function historyFileBody(entries: (typeof baselineHistory)["entries"]): string {
  return `// Generated by scripts/refresh-baseline.ts. Do not edit by hand.
// Run \`pnpm refresh:baseline\` to update. Entries only append; the first
// entry is whenever this feature first shipped, there is no backfill.

export interface BaselineHistoryEntry {
  /** Calendar month this entry represents, YYYY-MM. Re-running the refresh
   * within the same month updates this entry in place, never duplicates. */
  month: string;
  generatedOn: string;
  webFeaturesVersion: string;
  /** Rule count at this point, so a chart can tell catalog growth apart
   * from an actual change in browser support. */
  ruleCount: number;
  tally: { widely: number; newly: number; limited: number; unknown: number };
}

export interface BaselineHistory {
  entries: BaselineHistoryEntry[];
}

export const baselineHistory: BaselineHistory = ${JSON.stringify({ entries }, null, 2)};
`;
}

const month = generatedOn.slice(0, 7);
const newEntry = {
  month,
  generatedOn,
  webFeaturesVersion,
  ruleCount: rules.length,
  tally: ruleTally,
};
const historyEntries = [...baselineHistory.entries];
if (historyEntries.at(-1)?.month === month) {
  historyEntries[historyEntries.length - 1] = newEntry;
} else {
  historyEntries.push(newEntry);
}
writeFileSync(historyOutFile, historyFileBody(historyEntries), "utf8");

const tally = { high: 0, low: 0, limited: 0 };
for (const entry of Object.values(snapshot) as { baseline: unknown }[]) {
  if (entry.baseline === "high") tally.high += 1;
  else if (entry.baseline === "low") tally.low += 1;
  else tally.limited += 1;
}

console.info(
  `Wrote ${referenced.length} features from web-features@${webFeaturesVersion} (${tally.high} widely, ${tally.low} newly, ${tally.limited} limited)`,
);
