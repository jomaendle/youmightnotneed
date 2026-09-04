import { baselineSnapshot } from "./generated/baseline.ts";
import type { BaselineStatus, Rule } from "./schema.ts";

/**
 * One web-features entry, mapped into the catalog's vocabulary.
 */
export interface ResolvedFeature {
  /** The web-features ID. */
  id: string;
  /** Human-readable name, e.g. "Scroll snap". */
  name: string;
  status: BaselineStatus;
  /** Date the feature reached its current status, when known. */
  since: string | null;
  spec: string | null;
  /** Minimum version each tracked browser needs. Null means no data (commonly: never shipped there). */
  support: Record<string, string | null>;
}

export interface BaselineInfo {
  /** The rule's overall status: the least-supported required feature. */
  status: BaselineStatus;
  features: ResolvedFeature[];
  /**
   * The feature that caps the rule's status. Null when a rule has a single
   * feature, or when the status came from a manualBaseline.
   */
  limitedBy: ResolvedFeature | null;
  source: "web-features" | "manual";
  /** Date the underlying data was captured, YYYY-MM-DD. */
  dataDate: string;
  /** Why a manual entry exists. Only set when source is "manual". */
  note: string | null;
}

/** Higher is better supported. Used to pick the weakest feature in a rule. */
const RANK: Record<BaselineStatus, number> = {
  widely: 3,
  newly: 2,
  limited: 1,
  unknown: 0,
};

export function baselineRank(status: BaselineStatus): number {
  return RANK[status];
}

/** Sorts best-supported first. */
export function compareBaseline(a: BaselineStatus, b: BaselineStatus): number {
  return RANK[b] - RANK[a];
}

const LABELS: Record<BaselineStatus, string> = {
  widely: "Baseline widely available",
  newly: "Baseline newly available",
  limited: "Limited availability",
  unknown: "Support unverified",
};

export function baselineLabel(status: BaselineStatus): string {
  return LABELS[status];
}

const SHORT_LABELS: Record<BaselineStatus, string> = {
  widely: "widely available",
  newly: "newly available",
  limited: "limited",
  unknown: "unverified",
};

export function baselineShortLabel(status: BaselineStatus): string {
  return SHORT_LABELS[status];
}

/** The date this catalog's Baseline data was captured. */
export const BASELINE_DATA_DATE = baselineSnapshot.generatedOn;
export const WEB_FEATURES_VERSION = baselineSnapshot.webFeaturesVersion;

function toStatus(baseline: "high" | "low" | false): BaselineStatus {
  if (baseline === "high") return "widely";
  if (baseline === "low") return "newly";
  return "limited";
}

/**
 * The date a feature reached its current tier. Widely available features report
 * when they crossed into widely; newly available ones when they crossed into
 * newly. A limited feature has not reached either, so it has no date.
 */
function sinceDate(
  status: BaselineStatus,
  entry: { lowDate: string | null; highDate: string | null },
): string | null {
  if (status === "widely") return entry.highDate;
  if (status === "newly") return entry.lowDate;
  return null;
}

/**
 * Resolves one web-features ID against the snapshot. An unknown ID resolves to
 * `unknown` rather than throwing, so a stale snapshot degrades into a visible
 * "unverified" badge instead of a crash. The catalog tests fail on any
 * `unknown`, which is where this is meant to be caught.
 */
export function resolveFeature(id: string): ResolvedFeature {
  const entry = baselineSnapshot.features[id];
  if (!entry) {
    return {
      id,
      name: id,
      status: "unknown",
      since: null,
      spec: null,
      support: {},
    };
  }
  const status = toStatus(entry.baseline);
  return {
    id,
    name: entry.name,
    status,
    since: sinceDate(status, entry),
    spec: entry.spec,
    support: entry.support,
  };
}

/** Browsers the catalog tracks support for, in display order. */
export const TRACKED_BROWSERS = [
  "chrome",
  "edge",
  "firefox",
  "safari",
] as const;
export type TrackedBrowser = (typeof TRACKED_BROWSERS)[number];

/**
 * The highest of several minimum versions for one browser, or null if any
 * feature has no support data there (a rule needing all of them then has no
 * known support in that browser either). A non-numeric version string is
 * ignored rather than treated as the max: the snapshot should never contain
 * one, but silently winning a comparison it can't meaningfully make would be
 * worse than being skipped.
 */
function highestVersion(versions: readonly (string | null)[]): string | null {
  if (versions.some((v) => v === null)) return null;

  let max: number | null = null;
  let raw: string | null = null;
  for (const version of versions as readonly string[]) {
    const parsed = Number.parseFloat(version);
    if (!Number.isNaN(parsed) && (max === null || parsed > max)) {
      max = parsed;
      raw = version;
    }
  }
  return raw;
}

/**
 * Combines support across every feature a rule needs. A rule only works in a
 * browser once every required feature does, so each browser's version is the
 * highest (latest) minimum any single feature demands.
 */
export function combinedSupport(
  features: readonly ResolvedFeature[],
): Record<TrackedBrowser, string | null> {
  const result = {} as Record<TrackedBrowser, string | null>;
  for (const browser of TRACKED_BROWSERS) {
    result[browser] = highestVersion(
      features.map((feature) => feature.support[browser] ?? null),
    );
  }
  return result;
}

/**
 * Derives a rule's support status. A rule is only as available as its
 * least-supported required feature, so the weakest one wins. This is the only
 * place a status is decided, and nothing in the catalog hardcodes one.
 */
export function resolveBaseline(rule: Rule): BaselineInfo {
  if (rule.featureIds.length === 0) {
    const manual = rule.manualBaseline;
    if (!manual) {
      // The schema forbids this, so it can only happen with unvalidated data.
      return {
        status: "unknown",
        features: [],
        limitedBy: null,
        source: "manual",
        dataDate: BASELINE_DATA_DATE,
        note: null,
      };
    }
    return {
      status: manual.status,
      features: [],
      limitedBy: null,
      source: "manual",
      dataDate: manual.verifiedOn,
      note: manual.note,
    };
  }

  const features = rule.featureIds.map(resolveFeature);
  let weakest = features[0] as ResolvedFeature;
  for (const feature of features) {
    if (RANK[feature.status] < RANK[weakest.status]) weakest = feature;
  }

  // Only name a capping feature when one actually caps the rule. Pointing at
  // a feature that matches every other one would read as a warning where
  // there is nothing to warn about.
  const isCapped = features.some((f) => f.status !== weakest.status);

  return {
    status: weakest.status,
    features,
    limitedBy: isCapped ? weakest : null,
    source: "web-features",
    dataDate: BASELINE_DATA_DATE,
    note: null,
  };
}
