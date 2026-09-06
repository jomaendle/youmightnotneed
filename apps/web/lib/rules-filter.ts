/**
 * The arithmetic behind the CSS-only filters on /rules.
 *
 * Three filters now narrow the same list: support tier, category, and whether
 * a rule has a long-form guide. They compose as an AND, and none of them runs
 * any JavaScript, which puts two jobs here that a script would otherwise do at
 * runtime.
 *
 * The first is counting. A sidebar count that ignores the other filters is a
 * lie the reader can check, so every row carries one count per combination of
 * the *other two* filters and CSS reveals the one that matches.
 *
 * The second is knowing which combinations select nothing. CSS cannot ask "is
 * anything still visible", so the combinations that come up empty are worked
 * out here and named in a selector that reveals the empty state. Both are
 * derived from the rules, so they stay right as the catalog grows.
 */

export interface FilterEntry {
  tier: string;
  category: string;
  hasGuide: boolean;
}

export interface Combination {
  tier: string;
  category: string;
  guide: string;
}

/** "all" is every rule; "has" is the ones carrying a guide. */
export const GUIDE_STATES = ["all", "has"] as const;

function matches(entry: FilterEntry, combination: Combination): boolean {
  return (
    (combination.tier === "all" || entry.tier === combination.tier) &&
    (combination.category === "all" ||
      entry.category === combination.category) &&
    (combination.guide === "all" || entry.hasGuide)
  );
}

export function countMatching(
  entries: readonly FilterEntry[],
  combination: Combination,
): number {
  return entries.filter((entry) => matches(entry, combination)).length;
}

/** Every state of all three filters, "all" included. */
export function allCombinations(
  tierStates: readonly string[],
  categoryStates: readonly string[],
): Combination[] {
  return tierStates.flatMap((tier) =>
    categoryStates.flatMap((category) =>
      GUIDE_STATES.map((guide) => ({ tier, category, guide })),
    ),
  );
}

/**
 * The combinations that select no rule at all. Computed over the full cross
 * product rather than over the concrete states only: adding the guide filter
 * made "all tiers, this category, has a guide" reachable and empty, which the
 * old pairwise version would have missed.
 */
export function emptyCombinations(
  entries: readonly FilterEntry[],
  tierStates: readonly string[],
  categoryStates: readonly string[],
): Combination[] {
  return allCombinations(tierStates, categoryStates).filter(
    (combination) => countMatching(entries, combination) === 0,
  );
}
