import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze, DEPENDENCY_FIELDS } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { analyzeDependencies, getRule, listRules } from "./tools.ts";

const srcDir = dirname(fileURLToPath(import.meta.url));

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

describe("tools.ts stays pure", () => {
  // Mirrors packages/catalog's detect() purity test: tools.ts is a thin
  // wrapper over @jomae/catalog and must stay free of I/O, so server.ts
  // (not tools.ts) stays the only place doing filesystem or process work.
  it("imports nothing impure", () => {
    const source = readFileSync(join(srcDir, "tools.ts"), "utf8");
    expect(source).not.toMatch(/from\s+["']node:/);
    expect(source).not.toMatch(/require\(/);
    expect(source).not.toMatch(/\bfetch\(/);
    expect(source).not.toMatch(/\bprocess\./);
    expect(source).not.toMatch(/\bDate\.now\(/);
    expect(source).not.toMatch(/new Date\(/);
  });
});

describe("guide hand-off", () => {
  it("resolves a rule's guides to fetchable URLs", () => {
    const result = getRule({ id: "carousel-scroll-markers" });
    if (!result.found) throw new Error("expected the carousel rule");
    expect(result.guides.length).toBeGreaterThan(0);
    expect(result.guides[0]?.url).toMatch(/^https:\/\//);
    expect(result.guides[0]?.command).toContain("modern-web-guidance");
  });

  it("attaches guides and their provenance to an analysis", () => {
    const result = analyzeDependencies({ dependencies: { swiper: "^11.0.0" } });
    expect(result.findings[0]?.guides.length).toBeGreaterThan(0);
    expect(result.provenance.guidesVersion).not.toBe("");
    expect(result.guideSource.licence).toBe("Apache-2.0");
  });
});

describe("the MCP surface matches the catalog", () => {
  // The tool schema listed three dependency fields by hand while detect()
  // read four, and zod strips undeclared keys, so the MCP server quietly
  // returned fewer findings than the CLI for the same manifest.
  it("analyses every dependency field detect() reads", () => {
    for (const field of DEPENDENCY_FIELDS) {
      const result = analyzeDependencies({ [field]: { swiper: "^11.0.0" } });
      expect(result.summary.findingCount, field).toBe(1);
      expect(result.findings[0]?.matched[0]?.fields, field).toEqual([field]);
    }
  });

  it("agrees with a direct catalog analysis, field for field", () => {
    const pkg = {
      dependencies: { swiper: "^11.0.0" },
      devDependencies: { "react-modal": "^3.0.0" },
      peerDependencies: { axios: "^1.0.0" },
      optionalDependencies: { uuid: "^9.0.0" },
    };
    const direct = analyze(pkg);
    const viaMcp = analyzeDependencies(pkg);
    expect(viaMcp.findings.map((f) => f.rule.id)).toEqual(
      direct.findings.map((f) => f.rule.id),
    );
    expect(viaMcp.summary).toEqual(direct.summary);
    expect(viaMcp.summary.packageCount).toBe(4);
  });
});
