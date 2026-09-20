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

/** web-features' own shape, named so callers need no positional cast. */
export type LiveFeatures = Readonly<
  Record<string, { status?: { baseline?: "high" | "low" | false } }>
>;

export type TierDirection = "promotion" | "regression" | "missing";

interface TierChangeBase {
  ruleId: string;
  featureId: string;
  from: BaselineStatus;
}

/**
 * A discriminated union rather than a nullable `to`, because "gone from the
 * live data" has no destination tier and a shared shape forces every consumer
 * to write a null branch it can never reach. Narrowing on `direction` hands
 * the report builder a `to` it can print without checking.
 */
export type TierChange =
  | (TierChangeBase & {
      direction: "promotion" | "regression";
      to: BaselineStatus;
    })
  | (TierChangeBase & { direction: "missing" });

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
  live: LiveFeatures,
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
  live: LiveFeatures,
): TierChange | null {
  // One lookup each, rather than a presence check plus a cast undoing what
  // the check established. Neither the generated snapshot nor web-features
  // sets a key to an explicit undefined, so the two read the same.
  const entry = committed[featureId];
  if (entry === undefined) return null;
  const from = tierOf(entry.baseline);

  const liveEntry = live[featureId];
  if (liveEntry === undefined) {
    return { ruleId, featureId, direction: "missing", from };
  }

  const to = tierOf(liveEntry.status?.baseline);
  if (to === from) return null;

  return {
    ruleId,
    featureId,
    direction: RANK[to] > RANK[from] ? "promotion" : "regression",
    from,
    to,
  };
}
