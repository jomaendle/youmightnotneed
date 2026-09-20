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
  /**
   * When this feature crossed each threshold, as published. Null means it has
   * not crossed that one.
   *
   * Deliberately raw. A single collapsed "since" used to live here too, dated
   * against the feature's own tier, and `baselineSince` reading it instead of
   * these is the bug that had light-dark four months late. One derivation, in
   * `featureSince` and `baselineSince`, and nothing to disagree with.
   */
  lowDate: string | null;
  highDate: string | null;
  spec: string | null;
  /** Minimum version each tracked browser needs. Null means no data (commonly: never shipped there). */
  support: Record<string, string | null>;
  /**
   * Set only when web-features publishes no aggregate support for the feature,
   * which happens when one small part of it has not shipped anywhere. `key` is
   * the compat key standing in for the feature and `support` is that key's own
   * versions. It describes a part, so never show it without naming the part:
   * an empty `support` above plus this filled in means "the feature as a whole
   * has no published versions, but this piece of it has these".
   */
  partialSupport: {
    key: string;
    support: Record<string, string | null>;
  } | null;
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
 * The date a feature reached its own current tier. Widely available features
 * report when they crossed into widely; newly available ones when they crossed
 * into newly. A limited feature has reached neither, so it has no date.
 *
 * For a RULE, use `baselineSince`. A rule is only as available as its weakest
 * feature, so it has to ask every feature when it reached the rule's tier,
 * which is a different question from this one whenever the two differ.
 */
export function featureSince(feature: {
  status: BaselineStatus;
  lowDate: string | null;
  highDate: string | null;
}): string | null {
  if (feature.status === "widely") return feature.highDate;
  if (feature.status === "newly") return feature.lowDate;
  return null;
}

/**
 * Resolves one web-features ID against the snapshot. An unknown ID resolves to
 * `unknown` rather than throwing, so a stale snapshot degrades into a visible
 * "unverified" badge instead of a crash. The catalog tests fail on any
 * `unknown`, which is where this is meant to be caught.
 */
export function resolveFeature(id: string): ResolvedFeature {
  // Object.hasOwn, not a bare index: the snapshot is a plain object, so an ID
  // of "constructor" would otherwise resolve to Object and badge the rule
  // "limited availability" with a fabricated feature name.
  const entry = Object.hasOwn(baselineSnapshot.features, id)
    ? baselineSnapshot.features[id]
    : undefined;
  if (!entry) {
    return {
      id,
      name: id,
      status: "unknown",
      lowDate: null,
      highDate: null,
      spec: null,
      support: {},
      partialSupport: null,
    };
  }
  const status = toStatus(entry.baseline);
  return {
    id,
    name: entry.name,
    status,
    lowDate: entry.lowDate,
    highDate: entry.highDate,
    spec: entry.spec,
    support: entry.support,
    partialSupport: entry.partialSupport,
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
 * When a rule as a whole reached its current Baseline status, or null when the
 * catalog cannot say.
 *
 * A rule is only as available as its weakest required feature, so the rule
 * crossed on the date the *last* of its features crossed. Dates are
 * YYYY-MM-DD, so the latest one is the largest string and no clock is needed
 * to compare them, which is what keeps this callable from a pure module.
 *
 * Null covers two cases that both mean "no crossing to report": a feature that
 * has not crossed at all (limited or unverified), and a manualBaseline rule,
 * whose `verifiedOn` records a human checking rather than a feature landing.
 * A caller that filters on a date has to name those separately instead of
 * dropping them silently.
 */
export function baselineSince(info: BaselineInfo): string | null {
  if (info.status === "limited" || info.status === "unknown") return null;
  if (info.features.length === 0) return null;

  let latest: string | null = null;
  for (const feature of info.features) {
    // Against the RULE's tier, never the feature's own: a newly available
    // rule that also needs an already-widely feature must be dated by when
    // that feature reached NEWLY, not widely.
    const crossed =
      info.status === "widely" ? feature.highDate : feature.lowDate;

    // One undated feature means the rule has no date: the rule is gated by
    // that feature, so a date drawn from its siblings would claim the rule
    // crossed on a day it demonstrably had not.
    if (crossed === null) return null;
    if (latest === null || crossed > latest) latest = crossed;
  }
  return latest;
}

/**
 * True when a support map names no version for any tracked browser. That is
 * two different situations wearing the same face: the feature shipped nowhere,
 * or web-features publishes no aggregate for it. A caller that renders one row
 * per browser has to tell them apart, or a dash reads as "nobody has this".
 */
export function hasNoVersions(support: Record<string, string | null>): boolean {
  return TRACKED_BROWSERS.every(
    (browser) => (support[browser] ?? null) === null,
  );
}

/**
 * The features whose versions are missing because web-features publishes no
 * aggregate, each with the part standing in for it. Empty for the usual case
 * where every feature has a real support row.
 */
export function unpublishedSupport(
  features: readonly ResolvedFeature[],
): ResolvedFeature[] {
  return features.filter(
    (feature) => hasNoVersions(feature.support) && feature.partialSupport,
  );
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
