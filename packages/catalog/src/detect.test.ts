import { describe, expect, it } from "vitest";
import { analyze, detect, summarize } from "./detect.ts";
import type { Rule } from "./schema.ts";

const testRules: Rule[] = [
  {
    id: "test-dialog",
    title: "Dialogs",
    replaces: ["react-modal", "a11y-dialog"],
    featureIds: ["dialog"],
    native: "<dialog>",
    human: { explainer: "Prose.", snippet: "<dialog></dialog>" },
    agent: { when: "a modal", unless: ["Click outside."], snippet: "x" },
  },
  {
    id: "test-carousel",
    title: "Carousels",
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
