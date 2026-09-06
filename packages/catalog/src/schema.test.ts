import { describe, expect, it } from "vitest";
import { catalogSchema, parseCatalog, ruleSchema } from "./schema.ts";

/** A rule that passes, used as the base for each failure case. */
function validRule() {
  return {
    id: "example-rule",
    title: "Example",
    category: "forms",
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

describe("parseCatalog", () => {
  it("returns the parsed rules when they are valid", () => {
    const parsed = parseCatalog([validRule()]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.id).toBe("example-rule");
  });

  it("throws with a readable message when a rule is malformed", () => {
    const broken = validRule();
    broken.agent.unless = [];
    expect(() => parseCatalog([broken])).toThrow();
  });
});

describe("the schema rejects data it documents as invalid", () => {
  const base = {
    id: "x",
    title: "T",
    category: "async-data",
    replaces: ["swiper"],
    featureIds: ["dialog"],
    native: "n",
    human: { explainer: "e", snippet: "s" },
    agent: { when: "w", unless: ["u"], snippet: "s" },
  };
  const manual = { status: "widely", verifiedOn: "2026-02-28", note: "n" };

  // resolveBaseline() only reads manualBaseline when featureIds is empty, so
  // carrying both silently discards the hand-verified override.
  it("refuses a manualBaseline next to featureIds", () => {
    const result = ruleSchema.safeParse({ ...base, manualBaseline: manual });
    expect(result.success).toBe(false);
  });

  it("accepts a manualBaseline when featureIds is empty", () => {
    expect(
      ruleSchema.safeParse({ ...base, featureIds: [], manualBaseline: manual })
        .success,
    ).toBe(true);
  });

  it.each([
    "2026-99-99",
    "2026-02-30",
    "2026-13-01",
    "2026-00-10",
    "2026-04-31",
  ])("refuses the impossible date %s", (verifiedOn) => {
    expect(
      ruleSchema.safeParse({
        ...base,
        featureIds: [],
        manualBaseline: { ...manual, verifiedOn },
      }).success,
    ).toBe(false);
  });

  it("accepts a leap day in a leap year and refuses one otherwise", () => {
    const parse = (verifiedOn: string) =>
      ruleSchema.safeParse({
        ...base,
        featureIds: [],
        manualBaseline: { ...manual, verifiedOn },
      }).success;
    expect(parse("2024-02-29")).toBe(true);
    expect(parse("2026-02-29")).toBe(false);
  });

  it.each(["javascript:alert(1)", "http://x.test", "data:text/html,x"])(
    "refuses %s as a link",
    (mdnUrl) => {
      expect(
        ruleSchema.safeParse({
          ...base,
          human: { ...base.human, mdnUrl },
        }).success,
      ).toBe(false);
    },
  );

  it("refuses a duplicated or malformed feature id", () => {
    expect(
      ruleSchema.safeParse({ ...base, featureIds: ["dialog", "dialog"] })
        .success,
    ).toBe(false);
    expect(
      ruleSchema.safeParse({ ...base, featureIds: ["  NOT an ID!! "] }).success,
    ).toBe(false);
  });
});
