import {
  CATEGORIES,
  resolveBaseline,
  resolveGuides,
  rules,
} from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import {
  allCombinations,
  countMatching,
  emptyCombinations,
  type FilterEntry,
  GUIDE_STATES,
} from "./rules-filter";

const entries: FilterEntry[] = [
  { tier: "widely", category: "layout", hasGuide: true },
  { tier: "widely", category: "layout", hasGuide: false },
  { tier: "newly", category: "forms", hasGuide: true },
  { tier: "limited", category: "forms", hasGuide: false },
];

const tierStates = ["all", "widely", "newly", "limited"];
const categoryStates = ["all", "layout", "forms"];

describe("countMatching", () => {
  it("counts everything when nothing is narrowed", () => {
    expect(
      countMatching(entries, { tier: "all", category: "all", guide: "all" }),
    ).toBe(4);
  });

  it("narrows on one filter at a time", () => {
    expect(
      countMatching(entries, { tier: "widely", category: "all", guide: "all" }),
    ).toBe(2);
    expect(
      countMatching(entries, { tier: "all", category: "forms", guide: "all" }),
    ).toBe(2);
    expect(
      countMatching(entries, { tier: "all", category: "all", guide: "has" }),
    ).toBe(2);
  });

  it("composes the three as an AND", () => {
    expect(
      countMatching(entries, {
        tier: "widely",
        category: "layout",
        guide: "has",
      }),
    ).toBe(1);
    expect(
      countMatching(entries, {
        tier: "limited",
        category: "forms",
        guide: "has",
      }),
    ).toBe(0);
  });
});

describe("emptyCombinations", () => {
  it("finds a combination that only the guide filter empties", () => {
    // limited + forms has a rule; add "has a guide" and it does not.
    const empties = emptyCombinations(entries, tierStates, categoryStates);
    expect(empties).toContainEqual({
      tier: "limited",
      category: "forms",
      guide: "has",
    });
    expect(empties).not.toContainEqual({
      tier: "limited",
      category: "forms",
      guide: "all",
    });
  });

  it("agrees with countMatching on every combination", () => {
    const empties = new Set(
      emptyCombinations(entries, tierStates, categoryStates).map(
        (c) => `${c.tier}|${c.category}|${c.guide}`,
      ),
    );

    for (const combination of allCombinations(tierStates, categoryStates)) {
      const key = `${combination.tier}|${combination.category}|${combination.guide}`;
      expect(empties.has(key)).toBe(countMatching(entries, combination) === 0);
    }
  });
});

describe("against the real catalog", () => {
  const real: FilterEntry[] = rules.map((rule) => ({
    tier: resolveBaseline(rule).status,
    category: rule.category,
    hasGuide: resolveGuides(rule).some((guide) => guide.url !== null),
  }));
  const realTiers = ["all", "widely", "newly", "limited"];
  const realCategories = ["all", ...CATEGORIES.map((c) => c.id)];

  it("counts every rule when nothing is narrowed", () => {
    expect(
      countMatching(real, { tier: "all", category: "all", guide: "all" }),
    ).toBe(rules.length);
  });

  it("has rules carrying a guide, or the filter would be pointless", () => {
    const withGuide = countMatching(real, {
      tier: "all",
      category: "all",
      guide: "has",
    });
    expect(withGuide).toBeGreaterThan(0);
    expect(withGuide).toBeLessThan(rules.length);
  });

  /*
   * The empty state is revealed by naming combinations, so a combination that
   * selects nothing and is not named renders a blank page with no
   * explanation. This is the assertion that catches that.
   */
  it("names every combination that selects nothing", () => {
    const empties = emptyCombinations(real, realTiers, realCategories);
    for (const combination of allCombinations(realTiers, realCategories)) {
      if (countMatching(real, combination) > 0) continue;
      expect(empties, JSON.stringify(combination)).toContainEqual(combination);
    }
  });

  it("covers both guide states for every tier and category pair", () => {
    const combinations = allCombinations(realTiers, realCategories);
    expect(combinations).toHaveLength(
      realTiers.length * realCategories.length * GUIDE_STATES.length,
    );
  });
});
