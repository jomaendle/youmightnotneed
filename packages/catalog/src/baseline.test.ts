import { describe, expect, it } from "vitest";
import {
  BASELINE_DATA_DATE,
  type BaselineInfo,
  baselineLabel,
  baselineRank,
  baselineShortLabel,
  baselineSince,
  combinedSupport,
  compareBaseline,
  featureSince,
  hasNoVersions,
  resolveBaseline,
  resolveFeature,
  TRACKED_BROWSERS,
  unpublishedSupport,
  WEB_FEATURES_VERSION,
} from "./baseline.ts";
import { rules } from "./rules/index.ts";
import type { Rule } from "./schema.ts";

function ruleWith(overrides: Partial<Rule>): Rule {
  return {
    id: "fixture",
    title: "Fixture",
    category: "forms",
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
    expect(featureSince(feature)).toBe("2024-09-14");
  });

  it("maps low to newly, dated from when it became newly available", () => {
    const feature = resolveFeature("popover");
    expect(feature.status).toBe("newly");
    expect(featureSince(feature)).toBe("2025-01-27");
  });

  it("maps false to limited, with no date", () => {
    const feature = resolveFeature("anchor-positioning");
    expect(feature.status).toBe("limited");
    expect(featureSince(feature)).toBeNull();
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

describe("prototype keys are not features", () => {
  // baselineSnapshot.features is a plain object, so a bare index resolved
  // "constructor" to Object and badged the rule "limited availability" with a
  // fabricated feature name, passing the catalog test that looks for
  // "unknown".
  it.each(["constructor", "toString", "hasOwnProperty", "valueOf"])(
    "%s resolves to unknown, not to something off Object.prototype",
    (id) => {
      const feature = resolveFeature(id);
      expect(feature.status).toBe("unknown");
      expect(feature.name).toBe(id);
    },
  );
});

describe("features web-features publishes no aggregate for", () => {
  // Anchor positioning is the case this exists for: 319 of its 325 compat
  // keys are Baseline, six are not, so the feature reports support: {} and a
  // version row would render as four dashes meaning "no engine has this".
  const anchor = resolveFeature("anchor-positioning");

  it("has no aggregate versions", () => {
    expect(hasNoVersions(anchor.support)).toBe(true);
  });

  it("carries the stand-in part instead, named", () => {
    expect(anchor.partialSupport?.key).toBe("css.properties.anchor-name");
    // Not asserted as literals: the point is that the numbers exist and come
    // from the snapshot, not that they are any particular version today.
    for (const browser of TRACKED_BROWSERS) {
      expect(anchor.partialSupport?.support[browser], browser).not.toBeNull();
    }
  });

  it("is reported by unpublishedSupport so a caller can explain the gap", () => {
    const dialog = resolveFeature("dialog");
    expect(unpublishedSupport([dialog, anchor]).map((f) => f.id)).toEqual([
      "anchor-positioning",
    ]);
  });

  it("leaves a feature with a real support row alone", () => {
    const dialog = resolveFeature("dialog");
    expect(hasNoVersions(dialog.support)).toBe(false);
    expect(unpublishedSupport([dialog])).toEqual([]);
  });

  it("does not claim a stand-in for a feature that has no data at all", () => {
    // web-features tracks masonry with zero compat keys, so there is no part
    // to stand in and nothing to show. Saying "no engine has this" would be a
    // claim the source does not make.
    const masonry = resolveFeature("masonry");
    expect(hasNoVersions(masonry.support)).toBe(true);
    expect(masonry.partialSupport).toBeNull();
    expect(unpublishedSupport([masonry])).toEqual([]);
  });

  it("treats an unknown feature as having no versions", () => {
    expect(hasNoVersions(resolveFeature("not-a-real-feature-id").support)).toBe(
      true,
    );
  });
});

describe("baselineSince dates a rule against the rule's own tier", () => {
  function info(
    status: "widely" | "newly" | "limited",
    features: Array<{
      status: "widely" | "newly" | "limited";
      lowDate: string | null;
      highDate: string | null;
    }>,
  ): BaselineInfo {
    return {
      status,
      features: features.map((f, i) => ({
        id: `f${i}`,
        name: `f${i}`,
        status: f.status,
        lowDate: f.lowDate,
        highDate: f.highDate,
        spec: null,
        support: {},
        partialSupport: null,
      })),
      limitedBy: null,
      source: "web-features",
      dataDate: "2026-09-20",
      note: null,
    };
  }

  // The bug this exists for. A newly available rule that also requires an
  // already-widely feature was dated by when that feature reached WIDELY,
  // a later date and an entirely different threshold. light-dark read four
  // months late, so a --since window in between listed it wrongly.
  it("dates a newly rule by low dates, even where a feature went on to widely", () => {
    const since = baselineSince(
      info("newly", [
        { status: "newly", lowDate: "2024-05-13", highDate: null },
        { status: "widely", lowDate: "2022-02-03", highDate: "2024-08-03" },
      ]),
    );

    expect(since).toBe("2024-05-13");
  });

  it("dates a widely rule by the latest high date", () => {
    const since = baselineSince(
      info("widely", [
        { status: "widely", lowDate: "2019-01-01", highDate: "2021-06-01" },
        { status: "widely", lowDate: "2020-01-01", highDate: "2022-09-01" },
      ]),
    );

    expect(since).toBe("2022-09-01");
  });

  it("gives a limited rule no date even when its features carry dates", () => {
    const since = baselineSince(
      info("limited", [
        { status: "widely", lowDate: "2019-01-01", highDate: "2021-06-01" },
        { status: "limited", lowDate: null, highDate: null },
      ]),
    );

    expect(since).toBe(null);
  });

  it("returns null when a feature has no date at the rule's tier", () => {
    const since = baselineSince(
      info("newly", [
        { status: "newly", lowDate: "2024-05-13", highDate: null },
        { status: "newly", lowDate: null, highDate: null },
      ]),
    );

    expect(since).toBe(null);
  });
});

describe("the real catalog keeps tier and crossing date in step", () => {
  it.each(rules.map((rule) => [rule.id, rule] as const))(
    "%s reports a date if and only if it has reached a tier",
    (_id, rule) => {
      const info = resolveBaseline(rule);
      const since = baselineSince(info);

      if (info.status === "limited" || info.status === "unknown") {
        expect(since).toBe(null);
        return;
      }
      // A derived rule that has crossed must be able to say when. A
      // manualBaseline has no features, so it legitimately cannot.
      if (info.source === "web-features" && info.features.length > 0) {
        expect(since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    },
  );

  // Guards the shape the --since filter depends on. Equality, not >=: the
  // bug this replaced produced a date that was too LATE, and a one-sided
  // check passes anything later than every feature. Reintroducing the bug
  // left this green while only the synthetic case above went red, which is
  // the wrong way round, because this is the one that runs on real data.
  it.each(rules.map((rule) => [rule.id, rule] as const))(
    "%s is dated exactly when its slowest feature reached the rule's tier",
    (_id, rule) => {
      const info = resolveBaseline(rule);
      const since = baselineSince(info);
      if (since === null) return;

      const tierDates = info.features.map((f) =>
        info.status === "widely" ? f.highDate : f.lowDate,
      );
      // A null here means the rule should have had no date at all.
      expect(tierDates.every((d) => d !== null)).toBe(true);

      const slowest = (tierDates as string[]).reduce((a, b) => (a > b ? a : b));
      expect(since).toBe(slowest);
    },
  );
});
