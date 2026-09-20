import type { BaselineStatus } from "./schema.ts";

/**
 * Compares two Baseline snapshots and says which rules changed tier.
 *
 * Pure, and deliberately takes plain maps rather than reaching for
 * `web-features` itself: the caller holds the committed snapshot and the live
 * package, and this only has to know how to subtract one from the other. That
 * keeps it inside the same purity walk as the rest of the catalog and makes
 * it testable without a network or a filesystem.
 */

/** The shape both the committed snapshot and web-features agree on. */
export interface TierEntry {
  baseline: "high" | "low" | false;
}

export type TierDirection = "promotion" | "regression" | "missing";

export interface TierChange {
  ruleId: string;
  featureId: string;
  direction: TierDirection;
  /** Null when the feature is gone from the live data entirely. */
  from: BaselineStatus;
  to: BaselineStatus | null;
}

/** Higher is better supported, so a rise in rank is a promotion. */
const RANK: Record<BaselineStatus, number> = {
  unknown: 0,
  limited: 1,
  newly: 2,
  widely: 3,
};

export function tierOf(
  baseline: "high" | "low" | false | undefined,
): BaselineStatus {
  if (baseline === "high") return "widely";
  if (baseline === "low") return "newly";
  if (baseline === false) return "limited";
  return "unknown";
}

/**
 * Every tier move among the features some rule actually requires.
 *
 * A feature present in the committed snapshot and absent from the live data
 * is reported as `missing` rather than skipped. That is what an upstream
 * rename looks like, and skipping it would drop the one case most likely to
 * need a person: the rule keeps rendering a tier from a feature ID that no
 * longer exists, and `check:freshness` only fails once the snapshot is
 * regenerated without it.
 */
export function diffTiers(
  rules: readonly { id: string; featureIds: readonly string[] }[],
  committed: Readonly<Record<string, TierEntry>>,
  live: Readonly<
    Record<string, { status?: { baseline?: "high" | "low" | false } }>
  >,
): TierChange[] {
  return rules.flatMap((rule) =>
    rule.featureIds
      .map((featureId) => compare(rule.id, featureId, committed, live))
      .filter((change): change is TierChange => change !== null),
  );
}

/** One feature of one rule, or null when there is nothing to report. */
function compare(
  ruleId: string,
  featureId: string,
  committed: Readonly<Record<string, TierEntry>>,
  live: Readonly<
    Record<string, { status?: { baseline?: "high" | "low" | false } }>
  >,
): TierChange | null {
  if (!Object.hasOwn(committed, featureId)) return null;
  const from = tierOf((committed[featureId] as TierEntry).baseline);

  if (!Object.hasOwn(live, featureId)) {
    return { ruleId, featureId, direction: "missing", from, to: null };
  }

  const to = tierOf(live[featureId]?.status?.baseline);
  if (to === from) return null;

  return {
    ruleId,
    featureId,
    direction: RANK[to] > RANK[from] ? "promotion" : "regression",
    from,
    to,
  };
}
