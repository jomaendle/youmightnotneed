import { describe, expect, it } from "vitest";
import { catalogSchema, ruleSchema } from "./schema.ts";

/** A rule that passes, used as the base for each failure case. */
function validRule() {
  return {
    id: "example-rule",
    title: "Example",
    replaces: ["some-package"],
    featureIds: ["dialog"],
    native: "<dialog>",
    human: { explainer: "Prose.", snippet: "<dialog></dialog>" },
    agent: {
      when: "building a modal",
      unless: ["You need click-outside-to-close."],
      snippet: "<dialog></dialog>",
    },
  };
}

describe("ruleSchema", () => {
  it("accepts a well-formed rule", () => {
    expect(ruleSchema.parse(validRule()).id).toBe("example-rule");
  });

  it("rejects an empty unless array", () => {
    const rule = validRule();
    rule.agent.unless = [];
    const result = ruleSchema.safeParse(rule);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("still correct");
  });

  it("rejects a rule with neither featureIds nor manualBaseline", () => {
    const rule = validRule();
    rule.featureIds = [];
    const result = ruleSchema.safeParse(rule);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("manualBaseline");
  });

  it("accepts an empty featureIds when a manualBaseline is supplied", () => {
    const rule = {
      ...validRule(),
      featureIds: [],
      manualBaseline: {
        status: "limited" as const,
        verifiedOn: "2026-08-31",
        note: "No web-features ID yet. Checked against the spec.",
      },
    };
    expect(ruleSchema.safeParse(rule).success).toBe(true);
  });

  it("rejects a non-kebab-case id", () => {
    expect(
      ruleSchema.safeParse({ ...validRule(), id: "Example_Rule" }).success,
    ).toBe(false);
  });

  it("rejects an uppercase package name", () => {
    expect(
      ruleSchema.safeParse({ ...validRule(), replaces: ["React-Modal"] })
        .success,
    ).toBe(false);
  });

  it("accepts a scoped package name", () => {
    expect(
      ruleSchema.safeParse({
        ...validRule(),
        replaces: ["@floating-ui/react"],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty replaces array", () => {
    expect(ruleSchema.safeParse({ ...validRule(), replaces: [] }).success).toBe(
      false,
    );
  });

  it("rejects a malformed manualBaseline date", () => {
    const rule = {
      ...validRule(),
      featureIds: [],
      manualBaseline: {
        status: "newly" as const,
        verifiedOn: "31-08-2026",
        note: "Checked.",
      },
    };
    expect(ruleSchema.safeParse(rule).success).toBe(false);
  });

  it("rejects a manualBaseline claiming unknown support", () => {
    const rule = {
      ...validRule(),
      featureIds: [],
      manualBaseline: {
        status: "unknown",
        verifiedOn: "2026-08-31",
        note: "Checked.",
      },
    };
    expect(ruleSchema.safeParse(rule).success).toBe(false);
  });
});

describe("catalogSchema", () => {
  it("rejects two rules sharing an id", () => {
    const result = catalogSchema.safeParse([validRule(), validRule()]);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("duplicate rule id");
  });

  it("rejects two rules claiming the same package", () => {
    const second = { ...validRule(), id: "other-rule" };
    const result = catalogSchema.safeParse([validRule(), second]);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("already claimed");
  });
});
