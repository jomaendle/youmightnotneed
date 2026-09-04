import { describe, expect, it } from "vitest";
import {
  BASELINE_DATA_DATE,
  baselineLabel,
  baselineRank,
  baselineShortLabel,
  combinedSupport,
  compareBaseline,
  resolveBaseline,
  resolveFeature,
  TRACKED_BROWSERS,
  WEB_FEATURES_VERSION,
} from "./baseline.ts";
import type { Rule } from "./schema.ts";

function ruleWith(overrides: Partial<Rule>): Rule {
  return {
    id: "fixture",
    title: "Fixture",
    replaces: ["some-package"],
    featureIds: ["dialog"],
    native: "<dialog>",
    human: { explainer: "Prose.", snippet: "x" },
    agent: {
      when: "a modal",
      unless: ["A condition long enough."],
      snippet: "x",
    },
    ...overrides,
  };
}

describe("resolveFeature", () => {
  it("maps high to widely, with the date it got there", () => {
    const feature = resolveFeature("dialog");
    expect(feature.status).toBe("widely");
    expect(feature.name).toBe("<dialog>");
    expect(feature.since).toBe("2024-09-14");
  });

  it("maps low to newly, dated from when it became newly available", () => {
    const feature = resolveFeature("popover");
    expect(feature.status).toBe("newly");
    expect(feature.since).toBe("2025-01-27");
  });

  it("maps false to limited, with no date", () => {
    const feature = resolveFeature("anchor-positioning");
    expect(feature.status).toBe("limited");
    expect(feature.since).toBeNull();
  });

  it("degrades to unknown for an ID the snapshot lacks", () => {
    // A crash here would take down every surface, so this stays soft. The
    // catalog tests and check:freshness are what actually catch it.
    const feature = resolveFeature("not-a-real-feature-id");
    expect(feature.status).toBe("unknown");
    expect(feature.name).toBe("not-a-real-feature-id");
    expect(feature.spec).toBeNull();
  });

  it("carries a spec link when web-features has one", () => {
    expect(resolveFeature("dialog").spec).toMatch(/^https:\/\//);
  });

  it("carries per-browser minimum versions for every tracked browser", () => {
    const feature = resolveFeature("dialog");
    for (const browser of TRACKED_BROWSERS) {
      expect(feature.support).toHaveProperty(browser);
    }
  });

  it("has no support data for an ID the snapshot lacks", () => {
    expect(resolveFeature("not-a-real-feature-id").support).toEqual({});
  });
});

describe("combinedSupport", () => {
  it("carries a single feature's own support through unchanged", () => {
    const feature = resolveFeature("dialog");
    expect(combinedSupport([feature])).toEqual(feature.support);
  });

  it("takes the highest per-browser minimum across several required features", () => {
    const older = resolveFeature("dialog");
    const newer = resolveFeature("popover");
    const combined = combinedSupport([older, newer]);
    for (const browser of TRACKED_BROWSERS) {
      const a = older.support[browser];
      const b = newer.support[browser];
      if (a === null || b === null) continue;
      const expected =
        Number.parseFloat(a as string) > Number.parseFloat(b as string) ? a : b;
      expect(combined[browser]).toBe(expected);
    }
  });

  it("reports no support for a browser missing from even one required feature", () => {
    // web-bluetooth never shipped in Firefox or Safari, so a rule needing it
    // alongside a universally-supported feature still can't run there.
    const bluetooth = resolveFeature("web-bluetooth");
    const dialog = resolveFeature("dialog");
    const combined = combinedSupport([bluetooth, dialog]);
    expect(combined.firefox).toBeNull();
    expect(combined.safari).toBeNull();
    expect(combined.chrome).not.toBeNull();
  });

  it("reports no support for every browser when there are no features", () => {
    const combined = combinedSupport([]);
    for (const browser of TRACKED_BROWSERS) {
      expect(combined[browser]).toBeNull();
    }
  });
});

describe("resolveBaseline", () => {
  it("reports the single feature's status", () => {
    const info = resolveBaseline(ruleWith({ featureIds: ["dialog"] }));
    expect(info.status).toBe("widely");
    expect(info.source).toBe("web-features");
    expect(info.limitedBy).toBeNull();
    expect(info.dataDate).toBe(BASELINE_DATA_DATE);
  });

  it("reports the weakest of several features and names it", () => {
    // Popover is newly available, anchor positioning is not there yet. A
    // tooltip needs both, so the rule can only be as good as the worse one.
    const info = resolveBaseline(
      ruleWith({ featureIds: ["popover", "anchor-positioning"] }),
    );
    expect(info.status).toBe("limited");
    expect(info.limitedBy?.id).toBe("anchor-positioning");
    expect(info.features).toHaveLength(2);
  });

  it("does not name a capping feature when they all agree", () => {
    const info = resolveBaseline(
      ruleWith({ featureIds: ["dialog", "aspect-ratio"] }),
    );
    expect(info.status).toBe("widely");
    expect(info.limitedBy).toBeNull();
  });

  it("orders features as written, not sorted by support", () => {
    const info = resolveBaseline(
      ruleWith({ featureIds: ["anchor-positioning", "popover"] }),
    );
    expect(info.features.map((f) => f.id)).toEqual([
      "anchor-positioning",
      "popover",
    ]);
  });

  it("uses a manualBaseline when there is no web-features ID", () => {
    const info = resolveBaseline(
      ruleWith({
        featureIds: [],
        manualBaseline: {
          status: "limited",
          verifiedOn: "2026-08-01",
          note: "No web-features ID yet. Checked against the spec draft.",
        },
      }),
    );
    expect(info.status).toBe("limited");
    expect(info.source).toBe("manual");
    // The manual date, not the snapshot date: that is what expires in CI.
    expect(info.dataDate).toBe("2026-08-01");
    expect(info.note).toContain("No web-features ID");
    expect(info.features).toEqual([]);
  });

  it("falls back to unknown for unvalidated data with neither source", () => {
    const info = resolveBaseline(ruleWith({ featureIds: [] }));
    expect(info.status).toBe("unknown");
    expect(info.note).toBeNull();
  });
});

describe("ranking and labels", () => {
  it("ranks better support higher", () => {
    expect(baselineRank("widely")).toBeGreaterThan(baselineRank("newly"));
    expect(baselineRank("newly")).toBeGreaterThan(baselineRank("limited"));
    expect(baselineRank("limited")).toBeGreaterThan(baselineRank("unknown"));
  });

  it("sorts best-supported first", () => {
    const order = ["limited", "widely", "unknown", "newly"] as const;
    expect([...order].sort(compareBaseline)).toEqual([
      "widely",
      "newly",
      "limited",
      "unknown",
    ]);
    expect(compareBaseline("widely", "widely")).toBe(0);
  });

  it("labels every tier without saying 'Baseline' for limited support", () => {
    // Calling limited availability "Baseline limited" would misread as an
    // endorsement, and Baseline does not use the word that way.
    expect(baselineLabel("widely")).toBe("Baseline widely available");
    expect(baselineLabel("newly")).toBe("Baseline newly available");
    expect(baselineLabel("limited")).toBe("Limited availability");
    expect(baselineLabel("unknown")).toBe("Support unverified");
    expect(baselineLabel("limited")).not.toContain("Baseline");
  });

  it("has a short label for every tier", () => {
    for (const status of ["widely", "newly", "limited", "unknown"] as const) {
      expect(baselineShortLabel(status).length).toBeGreaterThan(0);
    }
  });
});

describe("data provenance", () => {
  it("exposes the snapshot date and web-features version", () => {
    expect(BASELINE_DATA_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(WEB_FEATURES_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
