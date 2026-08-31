import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveBaseline, resolveFeature } from "./baseline.ts";
import { baselineSnapshot } from "./generated/baseline.ts";
import { rules, rulesByPackage } from "./rules/index.ts";
import { catalogSchema } from "./schema.ts";

const srcDir = dirname(fileURLToPath(import.meta.url));

/** Every user-visible prose string on a rule. Snippets are excluded. */
function proseOf(rule: (typeof rules)[number]): string[] {
  return [
    rule.title,
    rule.native,
    rule.human.explainer,
    rule.agent.when,
    ...rule.agent.unless,
  ];
}

describe("the catalog", () => {
  it("validates against the schema", () => {
    expect(() => catalogSchema.parse(rules)).not.toThrow();
  });

  it("is not empty", () => {
    expect(rules.length).toBeGreaterThan(0);
  });

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s resolves to a known support status",
    (_id, rule) => {
      // An "unknown" status means a featureId is missing from the snapshot.
      // Run `pnpm refresh:baseline` and check the rule's IDs.
      expect(resolveBaseline(rule).status).not.toBe("unknown");
    },
  );

  it.each(rules.flatMap((r) => r.featureIds.map((f) => [r.id, f] as const)))(
    "%s references the real web-features ID %s",
    (_id, featureId) => {
      expect(baselineSnapshot.features[featureId]).toBeDefined();
      expect(resolveFeature(featureId).status).not.toBe("unknown");
    },
  );

  it("claims each package exactly once", () => {
    const counts = new Map<string, number>();
    for (const rule of rules) {
      for (const pkg of rule.replaces) {
        counts.set(pkg, (counts.get(pkg) ?? 0) + 1);
      }
    }
    expect([...counts].filter(([, n]) => n > 1)).toEqual([]);
  });

  it("exposes every claimed package in the lookup map", () => {
    const total = rules.reduce((n, r) => n + r.replaces.length, 0);
    expect(rulesByPackage.size).toBe(total);
  });
});

describe("honesty rules", () => {
  // Section 5 of the handover: a dependency in package.json is not proof of
  // what it is used for, so no surface may phrase a finding as an instruction.
  const imperatives = [
    /\bdelete\s+(this|your|the)\b/i,
    /\bremove\s+(this|your)\s+depend/i,
    /\byou will save\b/i,
    /\byou'll save\b/i,
    /\bjust replace\b/i,
    /\bsimply replace\b/i,
  ];

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s does not tell the reader to delete anything",
    (_id, rule) => {
      for (const text of proseOf(rule)) {
        for (const pattern of imperatives) {
          expect(text).not.toMatch(pattern);
        }
      }
    },
  );

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s states at least one condition where the dependency still wins",
    (_id, rule) => {
      expect(rule.agent.unless.length).toBeGreaterThan(0);
      for (const condition of rule.agent.unless) {
        // A bare "no Safari support" is not actionable. Ask for a sentence.
        expect(condition.length).toBeGreaterThan(20);
      }
    },
  );

  it.each(
    rules
      .filter((r) => resolveBaseline(r).status === "limited")
      .map((r) => [r.id, r] as const),
  )("%s is limited, so it flags support in its unless list", (_id, rule) => {
    const joined = rule.agent.unless.join(" ").toLowerCase();
    expect(joined).toMatch(
      /safari|firefox|chromium|chrome|limited availability|support|@supports|fallback/,
    );
  });

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s has an explainer of a few real sentences",
    (_id, rule) => {
      const sentences = rule.human.explainer
        .split(/[.!?]\s/)
        .filter((s) => s.trim().length > 0);
      expect(sentences.length).toBeGreaterThanOrEqual(2);
      expect(rule.human.explainer.length).toBeGreaterThan(120);
    },
  );

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s keeps its agent projection terse",
    (_id, rule) => {
      // Budget is roughly 200 tokens. Four characters per token is the usual
      // rough proxy, so allow about 1200 characters for when + unless.
      const size = rule.agent.when.length + rule.agent.unless.join(" ").length;
      expect(size).toBeLessThan(1400);
    },
  );

  it.each(
    rules
      .filter((r) => r.human.demoUrl)
      .map((r) => [r.id, r.human.demoUrl] as const),
  )("%s links its demo over https", (_id, url) => {
    expect(url).toMatch(/^https:\/\//);
  });
});

describe("writing voice", () => {
  // Rule 1 of the owner's writing-voice skill: no em dashes in user-visible
  // copy, anywhere. The fix is to restructure the sentence.
  it.each(rules.map((r) => [r.id, r] as const))(
    "%s contains no em dash",
    (_id, rule) => {
      for (const text of proseOf(rule)) {
        expect(text).not.toContain("—");
      }
    },
  );

  const banned = [
    "supercharge",
    "unlock",
    "elevate",
    "empower",
    "seamless",
    "robust",
    "delve",
    "showcase",
    "harness",
    "fast-paced",
    "it's worth noting",
  ];

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s avoids inflated vocabulary",
    (_id, rule) => {
      const prose = proseOf(rule).join(" ").toLowerCase();
      for (const word of banned) {
        expect(prose).not.toContain(word);
      }
    },
  );
});

describe("detect stays pure", () => {
  // The handover locks detect() as a pure function: no filesystem, no network,
  // no process. A static check is cheap and catches the mistake at review time
  // rather than when a surface breaks.
  const pureModules = [
    "detect.ts",
    "baseline.ts",
    "schema.ts",
    "format.ts",
    "rules/index.ts",
  ];

  it.each(pureModules)("%s imports nothing impure", (file) => {
    const source = readFileSync(join(srcDir, file), "utf8");
    expect(source).not.toMatch(/from\s+["']node:/);
    expect(source).not.toMatch(/require\(/);
    expect(source).not.toMatch(/\bfetch\(/);
    expect(source).not.toMatch(/\bprocess\./);
    expect(source).not.toMatch(/\bDate\.now\(/);
    expect(source).not.toMatch(/new Date\(/);
  });
});
