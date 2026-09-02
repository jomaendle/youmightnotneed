import { describe, expect, it } from "vitest";
import { analyzeDependencies, getRule, listRules } from "./tools.ts";

describe("analyzeDependencies", () => {
  it("matches a known dependency and returns provenance", () => {
    const result = analyzeDependencies({
      dependencies: { "react-masonry-css": "^1.0.0" },
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.rule.id).toBe("css-masonry");
    expect(result.summary.findingCount).toBe(1);
    expect(result.provenance.baselineOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.provenance.webFeaturesVersion).toBeTruthy();
    expect(result.provenance.sizesOn).toBeTruthy();
  });

  it("returns no findings for an unmatched dependency", () => {
    const result = analyzeDependencies({
      dependencies: { "totally-unrelated-package": "^1.0.0" },
    });

    expect(result.findings).toHaveLength(0);
    expect(result.summary.findingCount).toBe(0);
  });

  it("treats a missing dependency field as empty", () => {
    const result = analyzeDependencies({});
    expect(result.findings).toHaveLength(0);
  });
});

describe("listRules", () => {
  it("lists every rule with id, title, replaces, and native", () => {
    const { rules } = listRules();

    expect(rules.length).toBeGreaterThan(0);
    const masonryEntry = rules.find((rule) => rule.id === "css-masonry");
    expect(masonryEntry).toEqual({
      id: "css-masonry",
      title: "Masonry layouts",
      replaces: expect.arrayContaining(["react-masonry-css"]),
      native: "CSS masonry item placement",
    });
  });
});

describe("getRule", () => {
  it("finds a rule by id", () => {
    const result = getRule({ id: "css-masonry" });

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.rule.id).toBe("css-masonry");
      expect(result.baseline.status).toBeDefined();
    }
  });

  it("finds a rule by package name", () => {
    const result = getRule({ package: "react-masonry-css" });

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.rule.id).toBe("css-masonry");
    }
  });

  it("returns found: false for an unknown id", () => {
    expect(getRule({ id: "does-not-exist" })).toEqual({ found: false });
  });

  it("returns found: false for an unknown package", () => {
    expect(getRule({ package: "left-pad" })).toEqual({ found: false });
  });
});
