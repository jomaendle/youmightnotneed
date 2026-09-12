import { z } from "zod";
import { categorySchema } from "./categories.ts";

/**
 * Bumped whenever the shape of a rule changes in a way that breaks consumers.
 * Published alongside the catalog so downstream surfaces can refuse data they
 * do not understand.
 */
export const SCHEMA_VERSION = 1;

/**
 * Support tiers, mirroring the three Baseline states plus an explicit unknown.
 * `unknown` is never authored by hand. It only appears when a `featureId` is
 * missing from the web-features snapshot, which the catalog tests treat as a
 * failure.
 */
export const baselineStatusSchema = z.enum([
  "widely",
  "newly",
  "limited",
  "unknown",
]);
export type BaselineStatus = z.infer<typeof baselineStatusSchema>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected an ISO date, YYYY-MM-DD")
  // Shape alone is not enough: "2026-99-99" matches the regex, and
  // check-freshness then computes NaN days of age, which is never greater
  // than the limit. A typo would make a hand-verified claim immortal.
  //
  // Checked arithmetically rather than with Date, because the purity test
  // bans constructing one anywhere detect() can reach.
  .refine((value) => {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    if (month < 1 || month > 12 || day < 1) return false;
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const lengths = [
      31,
      leap ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    return day <= (lengths[month - 1] as number);
  }, "expected a real calendar date");

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a lowercase kebab-case slug");

/** npm package names: optionally scoped, lowercase, no URL-unsafe characters. */
const packageName = z
  .string()
  .regex(
    /^(?:@[a-z0-9][a-z0-9-._]*\/)?[a-z0-9][a-z0-9-._]*$/,
    "expected a lowercase npm package name",
  );

/** Rendered as a link on every surface, so nothing but https gets in. */
const httpsUrl = z
  .url()
  .refine((value) => value.startsWith("https://"), "expected an https URL");

/**
 * Escape hatch for features that web-features has no ID for yet. Carries the
 * date it was checked by hand so `scripts/check-freshness.ts` can fail CI once
 * the claim goes stale.
 */
export const manualBaselineSchema = z.object({
  status: baselineStatusSchema.exclude(["unknown"]),
  verifiedOn: isoDate,
  /** What was checked, and where. Shown to maintainers, not to users. */
  note: z.string().min(1),
});
export type ManualBaseline = z.infer<typeof manualBaselineSchema>;

export const ruleSchema = z
  .object({
    /** Stable identifier. Used in URLs and as the reference filename. */
    id: slug,
    /** Short human label, e.g. "Carousels". */
    title: z.string().min(1),
    /** Which entry in packages/catalog/src/categories.ts this rule belongs to. */
    category: categorySchema,

    /** npm packages this rule can replace. Exact names, lowercase. */
    replaces: z.array(packageName).min(1),

    /**
     * web-features IDs for the features REQUIRED to make the replacement.
     * Baseline status is DERIVED from these, never hardcoded, and a rule
     * reports the least-supported of them. Features that merely make the
     * snippet nicer do not belong here, or they would understate the rule.
     * Call those out in `agent.unless` instead. Empty only when
     * `manualBaseline` is supplied.
     */
    featureIds: z
      .array(
        z
          .string()
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "expected a lowercase web-features ID",
          ),
      )
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "a feature may only be listed once",
      ),

    /** The native approach, one line. */
    native: z.string().min(1),

    human: z.object({
      /** 2 to 4 sentences of prose. */
      explainer: z.string().min(1),
      /** Copy-pasteable CSS, HTML, or JavaScript. */
      snippet: z.string().min(1),
      /** A live demo or a post that walks through it. */
      demoUrl: httpsUrl.optional(),
      /** The MDN reference page for the native feature. */
      mdnUrl: httpsUrl.optional(),
    }),

    /** Terse projection for LLM surfaces. Budget roughly 200 tokens. */
    agent: z.object({
      /** The situation the native approach covers. */
      when: z.string().min(1),
      /**
       * The refusal conditions: when the dependency is still the right call.
       * A rule with an empty `unless` is not finished, so this is enforced
       * rather than documented.
       */
      unless: z
        .array(z.string().min(1))
        .min(1, "every rule must state when the dependency is still correct"),
      snippet: z.string().min(1),
      /**
       * Shapes someone writes by hand instead of using the native feature,
       * one short description each.
       *
       * This is the half of the problem `replaces` cannot see. A hand-written
       * focus trap installs nothing, so no package.json match can ever fire,
       * and the shapes worth naming here are multi-line and stateful, which is
       * why no linter has them either. Where a linter does cover the shape,
       * name it in `lintRule` instead: this field is for the ones that need a
       * person or a model to recognise.
       *
       * Prose, deliberately, and read rather than matched. An agent compares
       * what it is looking at against these, then reads `unless` before
       * deciding, the same as for any other finding.
       */
      handRolled: z.array(z.string().min(1)).min(1).optional(),
    }),

    /**
     * IDs of GoogleChrome/modern-web-guidance guides that cover the
     * implementation in depth. Their guides are keyed by use case, ours by
     * package name, so this is the hand-off from "which dependency can go" to
     * "how to build the thing properly". IDs only: the category and the URL
     * are resolved from the committed snapshot in guides.ts, so a guide that
     * is renamed upstream fails a test instead of shipping as a dead link.
     */
    guides: z.array(slug).optional(),

    /**
     * A lint rule that already checks this shape, as `<prefix>/<name>`, e.g.
     * `unicorn/prefer-structured-clone`.
     *
     * Same philosophy as `guides`: references, never copies. Where a linter
     * checks something mechanically, this catalog says so and points at it
     * rather than growing a second implementation of the same check. It also
     * tells a reader which migrations they can automate today and which need
     * judgment, which is a question nothing else answers.
     *
     * Resolved against the snapshot in generated/lint-rules.ts, so a rule
     * renamed upstream fails the freshness check instead of shipping as a dead
     * link.
     */
    lintRule: z
      .string()
      .regex(
        /^[a-z0-9-]+\/[a-z0-9-]+$/,
        "expected a lint rule as <prefix>/<name>",
      )
      .optional(),

    manualBaseline: manualBaselineSchema.optional(),
  })
  .superRefine((rule, ctx) => {
    if (rule.featureIds.length === 0 && !rule.manualBaseline) {
      ctx.addIssue({
        code: "custom",
        path: ["featureIds"],
        message:
          "a rule needs at least one web-features ID, or an explicit manualBaseline with a verifiedOn date",
      });
    }
    // resolveBaseline() only consults manualBaseline when featureIds is empty,
    // so carrying both silently discards the hand-verified override while
    // check-freshness keeps ageing its verifiedOn date.
    if (rule.featureIds.length > 0 && rule.manualBaseline) {
      ctx.addIssue({
        code: "custom",
        path: ["manualBaseline"],
        message:
          "a manualBaseline is only read when featureIds is empty. Drop one or the other.",
      });
    }
  });

export type Rule = z.infer<typeof ruleSchema>;

export const catalogSchema = z.array(ruleSchema).superRefine((rules, ctx) => {
  const seenIds = new Set<string>();
  const owners = new Map<string, string>();

  for (const [index, rule] of rules.entries()) {
    if (seenIds.has(rule.id)) {
      ctx.addIssue({
        code: "custom",
        path: [index, "id"],
        message: `duplicate rule id "${rule.id}"`,
      });
    }
    seenIds.add(rule.id);

    for (const pkg of rule.replaces) {
      const owner = owners.get(pkg);
      if (owner) {
        ctx.addIssue({
          code: "custom",
          path: [index, "replaces"],
          message: `"${pkg}" is already claimed by rule "${owner}". A package may only be claimed once, so a report never shows the same dependency twice.`,
        });
      } else {
        owners.set(pkg, rule.id);
      }
    }
  }
});

/** Throws a readable error if any rule is malformed. Used by tests and CI. */
export function parseCatalog(rules: unknown): Rule[] {
  return catalogSchema.parse(rules);
}
