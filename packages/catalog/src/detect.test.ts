import { describe, expect, it } from "vitest";
import {
  analyze,
  detect,
  type Finding,
  sortFindings,
  splitSince,
  summarize,
} from "./detect.ts";
import type { Rule } from "./schema.ts";

const testRules: Rule[] = [
  {
    id: "test-dialog",
    title: "Dialogs",
    category: "forms",
    replaces: ["react-modal", "a11y-dialog"],
    featureIds: ["dialog"],
    native: "<dialog>",
    human: { explainer: "Prose.", snippet: "<dialog></dialog>" },
    agent: { when: "a modal", unless: ["Click outside."], snippet: "x" },
  },
  {
    id: "test-carousel",
    title: "Carousels",
    category: "scrolling",
    replaces: ["swiper"],
    featureIds: ["scroll-buttons"],
    native: "::scroll-button()",
    human: { explainer: "Prose.", snippet: ".c {}" },
    agent: { when: "a gallery", unless: ["Autoplay."], snippet: "x" },
  },
];

const opts = { rules: testRules };

describe("detect", () => {
  it("returns nothing for an empty package.json", () => {
    expect(detect({}, opts)).toEqual([]);
  });

  it("returns nothing when no dependency is covered", () => {
    expect(detect({ dependencies: { lodash: "^4.0.0" } }, opts)).toEqual([]);
  });

  it("matches a dependency", () => {
    const findings = detect(
      { dependencies: { "react-modal": "^3.0.0" } },
      opts,
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.rule.id).toBe("test-dialog");
    expect(findings[0]?.matched.map((m) => m.name)).toEqual(["react-modal"]);
  });

  it("ignores the version range entirely", () => {
    const a = detect({ dependencies: { "react-modal": "^3.0.0" } }, opts);
    const b = detect(
      { dependencies: { "react-modal": "1.0.0-alpha.1" } },
      opts,
    );
    const c = detect({ dependencies: { "react-modal": "*" } }, opts);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("reads devDependencies and peerDependencies", () => {
    expect(
      detect({ devDependencies: { "react-modal": "^3.0.0" } }, opts),
    ).toHaveLength(1);
    expect(
      detect({ peerDependencies: { "react-modal": "^3.0.0" } }, opts),
    ).toHaveLength(1);
  });

  it("records every field a package appears in", () => {
    const findings = detect(
      {
        dependencies: { "react-modal": "^3.0.0" },
        devDependencies: { "react-modal": "^3.0.0" },
      },
      opts,
    );
    expect(findings[0]?.matched[0]?.fields).toEqual([
      "dependencies",
      "devDependencies",
    ]);
  });

  it("reports a rule once even when several of its packages match", () => {
    const findings = detect(
      { dependencies: { "react-modal": "^3.0.0", "a11y-dialog": "^8.0.0" } },
      opts,
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.matched).toHaveLength(2);
  });

  it("matches package names case-insensitively", () => {
    // npm names are lowercase, but a hand-edited package.json may not be.
    expect(
      detect({ dependencies: { "React-Modal": "^3.0.0" } }, opts),
    ).toHaveLength(1);
  });

  it("derives baseline status rather than reading it from the rule", () => {
    const findings = detect(
      { dependencies: { "react-modal": "^1.0.0", swiper: "^11.0.0" } },
      opts,
    );
    const byId = new Map(findings.map((f) => [f.rule.id, f]));
    expect(byId.get("test-dialog")?.baseline.status).toBe("widely");
    expect(byId.get("test-carousel")?.baseline.status).toBe("limited");
  });

  it("sorts heaviest first", () => {
    const findings = detect(
      { dependencies: { "react-modal": "^3.0.0", swiper: "^11.0.0" } },
      opts,
    );
    const bytes = findings.map((f) => f.replaceableBytes ?? 0);
    expect(bytes).toEqual([...bytes].sort((a, b) => b - a));
  });

  it("tolerates a malformed dependency block", () => {
    const pkg = { dependencies: null, devDependencies: "nope" };
    expect(() =>
      detect(pkg as unknown as Parameters<typeof detect>[0], opts),
    ).not.toThrow();
  });

  it("does not mutate its input", () => {
    const pkg = { dependencies: { "react-modal": "^3.0.0" } };
    const snapshot = structuredClone(pkg);
    detect(pkg, opts);
    expect(pkg).toEqual(snapshot);
  });

  it("is deterministic across calls", () => {
    const pkg = {
      dependencies: { "react-modal": "^3.0.0", swiper: "^11.0.0" },
    };
    expect(detect(pkg, opts)).toEqual(detect(pkg, opts));
  });

  it("reports null bytes rather than zero when no size is known", () => {
    const unsized: Rule[] = [
      {
        ...(testRules[0] as Rule),
        replaces: ["definitely-not-a-real-package-xyz"],
      },
    ];
    const findings = detect(
      { dependencies: { "definitely-not-a-real-package-xyz": "^1.0.0" } },
      { rules: unsized },
    );
    expect(findings[0]?.replaceableBytes).toBeNull();
    expect(findings[0]?.hasUnknownSizes).toBe(true);
  });
});

describe("summarize", () => {
  it("returns zeroes for no findings", () => {
    const summary = summarize([]);
    expect(summary.replaceableBytes).toBe(0);
    expect(summary.findingCount).toBe(0);
    expect(summary.packageCount).toBe(0);
  });

  it("counts packages, not just findings", () => {
    const { summary } = analyze(
      { dependencies: { "react-modal": "^3.0.0", "a11y-dialog": "^8.0.0" } },
      opts,
    );
    expect(summary.findingCount).toBe(1);
    expect(summary.packageCount).toBe(2);
  });

  it("tallies findings by support tier", () => {
    const { summary } = analyze(
      { dependencies: { "react-modal": "^3.0.0", swiper: "^11.0.0" } },
      opts,
    );
    expect(summary.byStatus.widely).toBe(1);
    expect(summary.byStatus.limited).toBe(1);
  });
});

describe("sortFindings tie-breaking", () => {
  function finding(
    title: string,
    replaceableBytes: number | null,
    status: "widely" | "newly" | "limited",
  ): Finding {
    return {
      rule: { ...(testRules[0] as Rule), id: title.toLowerCase(), title },
      baseline: {
        status,
        features: [],
        limitedBy: null,
        source: "manual",
        dataDate: "2026-08-31",
        note: null,
      },
      matched: [],
      replaceableBytes,
      hasUnknownSizes: false,
    };
  }

  it("puts the heaviest first", () => {
    const sorted = sortFindings([
      finding("Small", 100, "widely"),
      finding("Large", 900, "widely"),
    ]);
    expect(sorted.map((f) => f.rule.title)).toEqual(["Large", "Small"]);
  });

  it("breaks a size tie on support, best first", () => {
    const sorted = sortFindings([
      finding("Risky", 500, "limited"),
      finding("Safe", 500, "widely"),
    ]);
    expect(sorted.map((f) => f.rule.title)).toEqual(["Safe", "Risky"]);
  });

  it("breaks a full tie alphabetically, so the order is stable", () => {
    const sorted = sortFindings([
      finding("Zebra", 500, "widely"),
      finding("Alpha", 500, "widely"),
    ]);
    expect(sorted.map((f) => f.rule.title)).toEqual(["Alpha", "Zebra"]);
  });

  it("treats an unknown size as the lightest", () => {
    const sorted = sortFindings([
      finding("Unknown", null, "widely"),
      finding("Known", 10, "widely"),
    ]);
    expect(sorted.map((f) => f.rule.title)).toEqual(["Known", "Unknown"]);
  });

  it("does not mutate the array it was given", () => {
    const input = [finding("B", 1, "widely"), finding("A", 9, "widely")];
    const before = input.map((f) => f.rule.title);
    sortFindings(input);
    expect(input.map((f) => f.rule.title)).toEqual(before);
  });
});

describe("dependency fields", () => {
  it("reads optionalDependencies, which are installed like any other", () => {
    const findings = detect({ optionalDependencies: { swiper: "^11.0.0" } });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.matched[0]?.fields).toEqual(["optionalDependencies"]);
  });

  // packageSizes.sizes is a plain object, so a bare index would find Object
  // and report a confident 0 bytes instead of an unknown size.
  it("does not read a size off the prototype chain", () => {
    const rule: Rule = {
      id: "proto",
      title: "Proto",
      category: "async-data",
      replaces: ["constructor"],
      featureIds: ["dialog"],
      native: "n",
      human: { explainer: "e", snippet: "s" },
      agent: { when: "w", unless: ["u"], snippet: "s" },
    };

    const findings = detect(
      { dependencies: { constructor: "^1.0.0" } },
      { rules: [rule] },
    );
    expect(findings[0]?.matched[0]?.gzip).toBeNull();
    expect(findings[0]?.replaceableBytes).toBeNull();
    expect(findings[0]?.hasUnknownSizes).toBe(true);
  });
});

describe("sortFindings tie-breaking", () => {
  // Two rules can weigh the same and sit in the same tier. The order then has
  // to be stable and identical on every surface, so it compares codepoints
  // rather than using the runtime's locale.
  const finding = (title: string): Finding =>
    ({
      rule: { title },
      baseline: { status: "widely" },
      matched: [],
      replaceableBytes: 100,
      hasUnknownSizes: false,
    }) as unknown as Finding;

  it("orders equal-weight, equal-tier findings by title", () => {
    const sorted = sortFindings([finding("Zebra"), finding("Apple")]);
    expect(sorted.map((f) => f.rule.title)).toEqual(["Apple", "Zebra"]);
  });

  it("keeps identical titles adjacent rather than throwing", () => {
    const sorted = sortFindings([finding("Same"), finding("Same")]);
    expect(sorted).toHaveLength(2);
  });
});

describe("splitSince", () => {
  function dated(
    id: string,
    since: Array<string | null>,
    status: "widely" | "newly" | "limited" = "widely",
  ): Finding {
    return {
      rule: { ...(testRules[0] as Rule), id, title: id },
      baseline: {
        status,
        features: since.map((date, index) => ({
          id: `${id}-${index}`,
          name: id,
          status,
          since: date,
          // baselineSince reads the tier's own date, so these have to agree
          // with `status` or the helper would describe an impossible feature.
          lowDate: status === "widely" ? "2000-01-01" : date,
          highDate: status === "widely" ? date : null,
          spec: null,
          support: {},
          partialSupport: null,
        })),
        limitedBy: null,
        source: "web-features",
        dataDate: "2026-09-12",
        note: null,
      },
      matched: [],
      replaceableBytes: 0,
      hasUnknownSizes: false,
    };
  }

  it("puts a rule that crossed after the date in since", () => {
    const split = splitSince([dated("late", ["2026-03-02"])], "2026-03-01");
    expect(split.since.map((f) => f.rule.id)).toEqual(["late"]);
    expect(split.earlier).toHaveLength(0);
  });

  it("puts a rule that crossed before the date in earlier", () => {
    const split = splitSince([dated("old", ["2019-01-01"])], "2026-03-01");
    expect(split.earlier.map((f) => f.rule.id)).toEqual(["old"]);
    expect(split.since).toHaveLength(0);
  });

  // A reader asking what changed since March 1 means that day included.
  it("treats the boundary date itself as inside the window", () => {
    const split = splitSince([dated("exact", ["2026-03-01"])], "2026-03-01");
    expect(split.since.map((f) => f.rule.id)).toEqual(["exact"]);
  });

  // The rule is gated by its weakest feature, so the rule crossed when the
  // last of them did, not when the first did.
  it("dates a multi-feature rule by its latest feature", () => {
    const split = splitSince(
      [dated("multi", ["2019-01-01", "2026-06-01"])],
      "2026-03-01",
    );
    expect(split.since.map((f) => f.rule.id)).toEqual(["multi"]);
  });

  it("calls a rule undated when any one of its features has no date", () => {
    const split = splitSince(
      [dated("partial", ["2026-06-01", null])],
      "2026-03-01",
    );
    expect(split.undated.map((f) => f.rule.id)).toEqual(["partial"]);
    expect(split.since).toHaveLength(0);
  });

  // A manualBaseline rule resolves to no features at all. Its verifiedOn
  // records a person checking, not a feature landing, so it has no crossing.
  it("calls a rule with no features undated rather than current", () => {
    const split = splitSince([dated("manual", [])], "2026-03-01");
    expect(split.undated.map((f) => f.rule.id)).toEqual(["manual"]);
  });

  it("loses no finding across the three buckets", () => {
    const split = splitSince(
      [dated("a", ["2026-06-01"]), dated("b", ["2019-01-01"]), dated("c", [])],
      "2026-03-01",
    );
    const total =
      split.since.length + split.earlier.length + split.undated.length;
    expect(total).toBe(3);
  });

  // The property that makes this view safe to act on: only widely and newly
  // available statuses carry a crossing date, so a since view can never
  // surface something that still needs a fallback written first.
  it("never puts a limited finding in the since bucket", () => {
    const split = splitSince(
      [dated("limited", [null], "limited")],
      "1970-01-01",
    );
    expect(split.since).toHaveLength(0);
    expect(split.undated.map((f) => f.rule.id)).toEqual(["limited"]);
  });

  it("returns everything as earlier for a date past the whole catalog", () => {
    const split = splitSince([dated("any", ["2026-06-01"])], "2099-01-01");
    expect(split.earlier.map((f) => f.rule.id)).toEqual(["any"]);
  });
});
