import type { BaselineHistoryEntry } from "./generated/baseline-history.ts";

export interface TierShare {
  widely: number;
  newly: number;
  limited: number;
  unknown: number;
}

/** Each tier's percentage share of the catalog at that point. Computed, not
 * stored, so the chart isn't fooled by the catalog simply growing. */
export function tierShareOf(entry: BaselineHistoryEntry): TierShare {
  const { ruleCount, tally } = entry;
  if (ruleCount === 0) return { widely: 0, newly: 0, limited: 0, unknown: 0 };
  return {
    widely: (tally.widely / ruleCount) * 100,
    newly: (tally.newly / ruleCount) * 100,
    limited: (tally.limited / ruleCount) * 100,
    unknown: (tally.unknown / ruleCount) * 100,
  };
}
