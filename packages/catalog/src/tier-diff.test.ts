import { describe, expect, it } from "vitest";
import { diffTiers, tierOf } from "./tier-diff.ts";

const rules = [{ id: "r1", featureIds: ["f1", "f2"] }];

describe("tierOf", () => {
  it.each([
    ["high", "widely"],
    ["low", "newly"],
    [false, "limited"],
    [undefined, "unknown"],
  ] as const)("%s reads as %s", (baseline, expected) => {
    expect(tierOf(baseline)).toBe(expected);
  });
});

describe("diffTiers", () => {
  it("says nothing when both sides agree", () => {
    const changes = diffTiers(
      rules,
      { f1: { baseline: "low" }, f2: { baseline: "high" } },
      {
        f1: { status: { baseline: "low" } },
        f2: { status: { baseline: "high" } },
      },
    );

    expect(changes).toEqual([]);
  });

  it("calls a rise a promotion and names both ends", () => {
    const changes = diffTiers(
      rules,
      { f1: { baseline: false }, f2: { baseline: "high" } },
      {
        f1: { status: { baseline: "low" } },
        f2: { status: { baseline: "high" } },
      },
    );

    expect(changes).toEqual([
      {
        ruleId: "r1",
        featureId: "f1",
        direction: "promotion",
        from: "limited",
        to: "newly",
      },
    ]);
  });

  // The direction comparison is a rank lookup that would ship silently
  // reversed, so both directions are pinned rather than just the common one.
  it("calls a fall a regression", () => {
    const changes = diffTiers(
      rules,
      { f1: { baseline: "high" }, f2: { baseline: "high" } },
      {
        f1: { status: { baseline: "low" } },
        f2: { status: { baseline: "high" } },
      },
    );

    expect(changes[0]?.direction).toBe("regression");
  });

  // An upstream rename looks exactly like this, and it is the case most
  // likely to need a person, so it must never be silently skipped.
  it("reports a feature that is gone from the live data", () => {
    const changes = diffTiers(
      rules,
      { f1: { baseline: "low" }, f2: { baseline: "high" } },
      { f2: { status: { baseline: "high" } } },
    );

    expect(changes).toEqual([
      {
        ruleId: "r1",
        featureId: "f1",
        direction: "missing",
        from: "newly",
        to: null,
      },
    ]);
  });

  // Missing status means missing data rather than a downgrade. It still gets
  // surfaced, because swallowing it would hide a broken upstream entry.
  it("treats a live entry with no status as unverified", () => {
    const changes = diffTiers(
      rules,
      { f1: { baseline: "high" }, f2: { baseline: "high" } },
      { f1: {}, f2: { status: { baseline: "high" } } },
    );

    expect(changes[0]).toMatchObject({
      to: "unknown",
      direction: "regression",
    });
  });

  it("ignores a feature no rule requires", () => {
    const changes = diffTiers(
      rules,
      {
        f1: { baseline: "low" },
        f2: { baseline: "high" },
        other: { baseline: false },
      },
      {
        f1: { status: { baseline: "low" } },
        f2: { status: { baseline: "high" } },
        other: { status: { baseline: "high" } },
      },
    );

    expect(changes).toEqual([]);
  });

  it("ignores a feature the committed snapshot never had", () => {
    const changes = diffTiers(
      [{ id: "r1", featureIds: ["brand-new"] }],
      {},
      { "brand-new": { status: { baseline: "low" } } },
    );

    expect(changes).toEqual([]);
  });
});
