import {
  type LintRuleSnapshot,
  lintRuleSnapshot,
} from "./generated/lint-rules.ts";
import type { Rule } from "./schema.ts";

/**
 * Resolution for the lint rules a catalog rule can point at.
 *
 * Some of what this catalog describes is already checked mechanically. Where
 * it is, the rule names that linter rule rather than this project growing a
 * second implementation of the same check, which is the `guides` philosophy
 * applied to tooling: references, never copies.
 *
 * The useful consequence is a split nothing else publishes. A rule either has
 * a `lintRule`, meaning a linter can find it in CI today, or it has
 * `agent.handRolled` shapes, meaning the pattern is multi-line and stateful
 * and needs a person or a model to recognise it. Knowing which half a
 * migration falls into is most of deciding how to tackle it.
 *
 * Pure, like everything else the surfaces share. Names are checked against a
 * committed snapshot (`pnpm refresh:lint-rules`), so a rule renamed upstream
 * fails a test rather than shipping as a dead link.
 */

export interface ResolvedLintRule {
  /** The full name as written on the rule, e.g. "unicorn/prefer-group-by". */
  name: string;
  /** Config prefix, e.g. "unicorn". */
  prefix: string;
  /** The npm package it ships in, or null when the prefix is unknown. */
  package: string | null;
  /** Version the snapshot was taken from, or null when unknown. */
  version: string | null;
  /** Docs permalink, or null when the name is not in the snapshot. */
  url: string | null;
}

function sourceFor(prefix: string) {
  return lintRuleSnapshot.sources.find((s) => s.prefix === prefix);
}

/**
 * Looks up one lint rule. Returns nulls for an unknown name rather than
 * throwing, matching resolveGuide() and resolveFeature().
 */
export function resolveLintRule(name: string): ResolvedLintRule {
  const [prefix = "", rule = ""] = name.split("/");
  const source = sourceFor(prefix);
  const known = source?.rules.includes(rule) ?? false;

  return {
    name,
    prefix,
    package: source?.package ?? null,
    version: source?.version ?? null,
    url: known && source ? source.docs.replace("{rule}", rule) : null,
  };
}

/** The rule's lint rule, or null when it has none. Most rules have none. */
export function resolveRuleLint(rule: Rule): ResolvedLintRule | null {
  return rule.lintRule === undefined ? null : resolveLintRule(rule.lintRule);
}

/** True when the snapshot knows this name. Used by the tests and the scripts. */
export function isKnownLintRule(name: string): boolean {
  const [prefix = "", rule = ""] = name.split("/");
  return sourceFor(prefix)?.rules.includes(rule) ?? false;
}

/**
 * The linters this catalog defers to, for the "checked against X, captured on
 * Y" line every surface prints beside derived data.
 */
export const LINT_SOURCES = lintRuleSnapshot.sources.map((s) => ({
  prefix: s.prefix,
  package: s.package,
  version: s.version,
})) as readonly {
  prefix: string;
  package: string;
  version: string;
}[];

export const LINT_RULES_FETCHED_ON = lintRuleSnapshot.fetchedOn;

export { type LintRuleSnapshot, lintRuleSnapshot };
