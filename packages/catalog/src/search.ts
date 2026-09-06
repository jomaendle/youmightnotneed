import { rules as defaultRules } from "./rules/index.ts";
import type { Rule } from "./schema.ts";

/**
 * Free-text lookup over the catalog.
 *
 * `detect()` answers "here is my package.json, what applies", which needs the
 * whole file. This answers the question someone arrives with instead: one name
 * they already have in their head. The catalog covers far more package names
 * than it has rules, and a rule is titled after the native feature rather than
 * after any package it replaces, so most of those names appear nowhere a
 * reader can find them.
 *
 * Pure, like `detect()`. It reads nothing but the rules handed to it.
 */

/** Why a rule came back, strongest first. Also its sort key. */
const EXACT_PACKAGE = 4;
const PACKAGE_PREFIX = 3;
const PACKAGE_SUBSTRING = 2;
const RULE_TEXT = 1;

export interface SearchResult {
  rule: Rule;
  /**
   * The packages from `rule.replaces` the query matched, in the order the rule
   * lists them. Empty when the rule matched by title or native feature alone,
   * which is what tells a surface whether it has anything to show underneath.
   */
  packages: readonly string[];
}

export interface SearchOptions {
  /** Defaults to the whole catalog. Present so tests can pass their own. */
  rules?: readonly Rule[];
}

/**
 * Two characters. One is a substring of most of the catalog, and a list of
 * everything is what `/rules` is for.
 */
const MIN_QUERY_LENGTH = 2;

function scorePackage(name: string, query: string): number {
  const lower = name.toLowerCase();
  if (lower === query) return EXACT_PACKAGE;
  if (lower.startsWith(query)) return PACKAGE_PREFIX;
  if (lower.includes(query)) return PACKAGE_SUBSTRING;
  return 0;
}

/**
 * Scores one rule. A rule that matches by package never falls back to its
 * title, so the packages array stays a list of what the reader actually
 * typed rather than everything the rule happens to replace.
 */
function scoreRule(
  rule: Rule,
  needle: string,
): { packages: string[]; score: number } {
  const packages: string[] = [];
  let score = 0;

  for (const name of rule.replaces) {
    const packageScore = scorePackage(name, needle);
    if (packageScore === 0) continue;
    packages.push(name);
    score = Math.max(score, packageScore);
  }

  if (score > 0) return { packages, score };

  const matchesText =
    rule.title.toLowerCase().includes(needle) ||
    rule.native.toLowerCase().includes(needle);

  return { packages, score: matchesText ? RULE_TEXT : 0 };
}

/**
 * Ranks rules against a query. Returns an empty array for a query too short to
 * narrow anything down.
 */
export function searchRules(
  query: string,
  options: SearchOptions = {},
): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < MIN_QUERY_LENGTH) return [];

  const scored: { result: SearchResult; score: number }[] = [];

  for (const rule of options.rules ?? defaultRules) {
    const { packages, score } = scoreRule(rule, needle);
    if (score === 0) continue;
    scored.push({ result: { rule, packages }, score });
  }

  /*
   * Ties break on how much of the rule the query hit, then on title, so the
   * order is stable rather than dependent on the order rules/index.ts happens
   * to list them in.
   */
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.result.packages.length - a.result.packages.length ||
      a.result.rule.title.localeCompare(b.result.rule.title),
  );

  return scored.map((entry) => entry.result);
}
