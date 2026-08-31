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
 * Resolves one web-features ID against the snapshot. An unknown ID resolves to
 * `unknown` rather than throwing, so a stale snapshot degrades into a visible
 * "unverified" badge instead of a crash. The catalog tests fail on any
 * `unknown`, which is where this is meant to be caught.
 */
export function resolveFeature(id: string): ResolvedFeature {
  const entry = baselineSnapshot.features[id];
  if (!entry) {
    return { id, name: id, status: "unknown", since: null, spec: null };
  }
  const status = toStatus(entry.baseline);
  const since =
    status === "widely"
      ? entry.highDate
      : status === "newly"
        ? entry.lowDate
        : null;
  return { id, name: entry.name, status, since, spec: entry.spec };
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

  return {
    status: weakest.status,
    features,
    limitedBy: features.length > 1 ? weakest : null,
    source: "web-features",
    dataDate: BASELINE_DATA_DATE,
    note: null,
  };
}
