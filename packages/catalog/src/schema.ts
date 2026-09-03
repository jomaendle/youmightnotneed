import { z } from "zod";

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
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected an ISO date, YYYY-MM-DD");

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
    featureIds: z.array(z.string().min(1)),

    /** The native approach, one line. */
    native: z.string().min(1),

    human: z.object({
      /** 2 to 4 sentences of prose. */
      explainer: z.string().min(1),
      /** Copy-pasteable CSS, HTML, or JavaScript. */
      snippet: z.string().min(1),
      /** A live demo or a post that walks through it. */
      demoUrl: z.url().optional(),
      /** The MDN reference page for the native feature. */
      mdnUrl: z.url().optional(),
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
    }),

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
