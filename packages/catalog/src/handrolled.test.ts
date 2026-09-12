import { describe, expect, it } from "vitest";
import { rules } from "./rules/index.ts";

/**
 * Gates on `agent.handRolled`, the field that tells an agent a rule applies to
 * code with no package behind it.
 *
 * The failure these exist for, found by review after the field shipped: a
 * shape that describes work the rule's own `unless` says the native feature
 * does NOT do. `inert` listed "storing document.activeElement so focus can be
 * put back", while its `unless` says inert does not track that and the code
 * stays yours to write. A shape like that tells an agent to delete code the
 * rule cannot replace, which is the most damaging thing this field can do,
 * because the finding reads as confident and is exactly backwards.
 *
 * Five of those shipped before anyone noticed. None was catchable by reading
 * the shape alone: every one of them needs the rule's conditions next to it.
 * So the check is lexical and deliberately over-eager, and anything it flags
 * has to be fixed or waived in writing.
 */

/** Phrases an `unless` uses to say the native feature does not cover something. */
const DISCLAIMS =
  /does not|doesn't|cannot|can't|is yours|stays your|you still|remains your|only covers|expects you to|needs javascript|still needs/i;

/** Words long enough to carry meaning, so "the" and "with" do not score. */
function contentWords(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z]{5,}/g) ?? []);
}

function overlap(a: string, b: string): string[] {
  const words = contentWords(b);
  return [...contentWords(a)].filter((word) => words.has(word));
}

/** Stable key for the waiver list: rule id and the start of the shape. */
function pairKey(ruleId: string, shape: string): string {
  return `${ruleId} :: ${shape.slice(0, 60)}`;
}

/**
 * Flagged pairs a maintainer has read and kept, with the reason.
 *
 * A waiver is a claim that the shape describes what the rule DOES replace,
 * and that the `unless` line it collides with is about a different case. Write
 * the distinction out: if it cannot be written in a sentence, the shape is
 * probably wrong.
 */
const REVIEWED: Record<string, string> = {
  "inert :: a keydown handler watching for Tab and calling preventDefaul":
    "The shape is containment, which inert does do: focus cannot reach the rest of the page. The condition is about wrapping from the last element back to the first, which inert does not do, because the browser moves on to the URL bar instead. Two halves of the same Tab handler, and only one of them is replaced.",
};

describe("hand-rolled shapes do not contradict their own rule", () => {
  const pairs = rules.flatMap((rule) =>
    (rule.agent.handRolled ?? []).flatMap((shape) =>
      rule.agent.unless
        .filter((condition) => DISCLAIMS.test(condition))
        .map((condition) => ({ rule, shape, condition }))
        .filter(({ shape: s, condition: c }) => overlap(s, c).length >= 3),
    ),
  );

  it.each(pairs.map((p) => [pairKey(p.rule.id, p.shape), p] as const))(
    "%s is either not a contradiction or is waived with a reason",
    (key, pair) => {
      const reason = REVIEWED[key];

      expect(
        reason,
        "This shape overlaps a condition that says the native feature does not cover it:\n\n" +
          `  rule:      ${pair.rule.id} (${pair.rule.native})\n` +
          `  shape:     ${pair.shape}\n` +
          `  condition: ${pair.condition}\n` +
          `  shared:    ${overlap(pair.shape, pair.condition).join(", ")}\n\n` +
          "If the shape describes code the rule cannot replace, delete or reword it.\n" +
          "If the two are about different cases, add the key above to REVIEWED in\n" +
          "this file with a sentence saying how they differ.",
      ).toBeDefined();

      expect(reason?.length ?? 0).toBeGreaterThan(40);
    },
  );

  it("has no stale waivers", () => {
    const live = new Set(pairs.map((p) => pairKey(p.rule.id, p.shape)));
    expect(Object.keys(REVIEWED).filter((key) => !live.has(key))).toEqual([]);
  });
});

describe("hand-rolled shapes are usable as a lookup table", () => {
  const withShapes = rules.filter(
    (rule) => (rule.agent.handRolled ?? []).length > 0,
  );

  // The table is scanned by matching prose against code. Two rules claiming
  // the same sentence gives an agent no way to choose, and the reader cannot
  // tell which rule the row belongs to.
  it("never gives the same shape to two rules", () => {
    const owners = new Map<string, string>();
    const clashes: string[] = [];

    for (const rule of rules) {
      for (const shape of rule.agent.handRolled ?? []) {
        const owner = owners.get(shape);
        if (owner)
          clashes.push(`"${shape}" claimed by ${owner} and ${rule.id}`);
        else owners.set(shape, rule.id);
      }
    }

    expect(clashes).toEqual([]);
  });

  // A shape is matched against code someone is reading, so it has to describe
  // the code. "a focus trap" is a label, not something to match against.
  it.each(withShapes.map((rule) => [rule.id, rule] as const))(
    "%s describes each shape concretely enough to match against",
    (_id, rule) => {
      for (const shape of rule.agent.handRolled ?? []) {
        expect(shape.length, shape).toBeGreaterThan(35);
        expect(
          shape,
          `"${shape}" restates native instead of the code`,
        ).not.toBe(rule.native);
      }
    },
  );

  // The whole point of the field is code with no package behind it. A rule
  // whose shape only appears alongside its own package is already covered by
  // detect(), so the shape earns nothing.
  it.each(withShapes.map((rule) => [rule.id, rule] as const))(
    "%s does not name one of its own replaced packages in a shape",
    (_id, rule) => {
      for (const shape of rule.agent.handRolled ?? []) {
        for (const pkg of rule.replaces) {
          expect(
            shape.toLowerCase(),
            `"${shape}" names ${pkg}, which detect() already matches`,
          ).not.toContain(pkg.toLowerCase());
        }
      }
    },
  );
});
