import {
  type BaselineInfo,
  compareBaseline,
  resolveBaseline,
} from "./baseline.ts";
import { packageSizes } from "./generated/sizes.ts";
import { rules as defaultRules } from "./rules/index.ts";
import type { BaselineStatus, Rule } from "./schema.ts";

/**
 * detect() is pure: no filesystem, no network, no `process`, no clock. It takes
 * a parsed dependency map and returns findings. Every surface (website, CLI,
 * agent tooling) calls this same function, which is what makes four form
 * factors cost one implementation.
 */

export const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
] as const;

export type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

/** The subset of a package.json that detect() reads. */
export interface PackageJsonLike {
  name?: string | undefined;
  dependencies?: Record<string, string> | undefined;
  devDependencies?: Record<string, string> | undefined;
  peerDependencies?: Record<string, string> | undefined;
}

export interface MatchedPackage {
  name: string;
  /** Every field the package appears in. Versions are ignored in v1. */
  fields: DependencyField[];
  /** Minified and gzipped bytes, or null when we have no measurement. */
  gzip: number | null;
  /** The version that was measured, not the version installed. */
  measuredVersion: string | null;
}

export interface Finding {
  rule: Rule;
  baseline: BaselineInfo;
  /** The dependencies that caused this rule to fire. Never empty. */
  matched: MatchedPackage[];
  /**
   * Sum of the known sizes of the matched packages. Null when none of them
   * has a measurement, so callers can say "size unknown" rather than "0 kB".
   */
  replaceableBytes: number | null;
  /** True when at least one matched package has no size data. */
  hasUnknownSizes: boolean;
}

export interface DetectOptions {
  /** Override the rule set. Used by tests; defaults to the full catalog. */
  rules?: readonly Rule[] | undefined;
}

function readSize(name: string): {
  gzip: number | null;
  version: string | null;
} {
  const entry = packageSizes.sizes[name];
  if (!entry) return { gzip: null, version: null };
  return { gzip: entry.gzip, version: entry.version };
}

/**
 * Collects the dependency names in a package.json, remembering which fields
 * each one came from. Names are compared exactly and lowercased, matching how
 * npm treats them.
 */
function collectDependencies(
  pkg: PackageJsonLike,
): Map<string, DependencyField[]> {
  const found = new Map<string, DependencyField[]>();
  for (const field of DEPENDENCY_FIELDS) {
    const block = pkg[field];
    if (!block || typeof block !== "object") continue;
    for (const rawName of Object.keys(block)) {
      const name = rawName.toLowerCase();
      const fields = found.get(name);
      if (fields) {
        if (!fields.includes(field)) fields.push(field);
      } else {
        found.set(name, [field]);
      }
    }
  }
  return found;
}

/**
 * Maps a dependency list to the rules that cover it.
 *
 * A dependency in package.json is not proof of what it is used for, so a
 * finding is a "this may apply" and every surface renders it with its Baseline
 * badge and its `unless` conditions.
 */
export function detect(
  pkg: PackageJsonLike,
  options: DetectOptions = {},
): Finding[] {
  const rules = options.rules ?? defaultRules;
  const installed = collectDependencies(pkg);
  const findings: Finding[] = [];

  for (const rule of rules) {
    const matched: MatchedPackage[] = [];

    for (const candidate of rule.replaces) {
      const fields = installed.get(candidate.toLowerCase());
      if (!fields) continue;
      const { gzip, version } = readSize(candidate);
      matched.push({
        name: candidate,
        fields: [...fields],
        gzip,
        measuredVersion: version,
      });
    }

    if (matched.length === 0) continue;

    const known = matched.filter((m) => m.gzip !== null);
    findings.push({
      rule,
      baseline: resolveBaseline(rule),
      matched,
      replaceableBytes:
        known.length > 0
          ? known.reduce((total, m) => total + (m.gzip ?? 0), 0)
          : null,
      hasUnknownSizes: known.length !== matched.length,
    });
  }

  return sortFindings(findings);
}

/**
 * Heaviest first, because the headline number is kilobytes. Ties break on
 * support (better-supported first) and then title, so the order is stable.
 */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const byBytes = (b.replaceableBytes ?? 0) - (a.replaceableBytes ?? 0);
    if (byBytes !== 0) return byBytes;
    const byBaseline = compareBaseline(a.baseline.status, b.baseline.status);
    if (byBaseline !== 0) return byBaseline;
    return a.rule.title.localeCompare(b.rule.title);
  });
}

export interface Summary {
  /**
   * Total known replaceable bytes, minified and gzipped. Phrased as "up to"
   * everywhere it is shown, because a dependency being present is not proof
   * that the native approach covers how it is used.
   */
  replaceableBytes: number;
  /** Number of rules that fired. */
  findingCount: number;
  /** Number of matched dependencies across all findings. */
  packageCount: number;
  /** True when any matched package had no size measurement. */
  hasUnknownSizes: boolean;
  /** How many findings sit in each support tier. */
  byStatus: Record<BaselineStatus, number>;
}

/** Pure. Rolls findings up into the numbers a report leads with. */
export function summarize(findings: readonly Finding[]): Summary {
  const byStatus: Record<BaselineStatus, number> = {
    widely: 0,
    newly: 0,
    limited: 0,
    unknown: 0,
  };
  let replaceableBytes = 0;
  let packageCount = 0;
  let hasUnknownSizes = false;

  for (const finding of findings) {
    replaceableBytes += finding.replaceableBytes ?? 0;
    packageCount += finding.matched.length;
    if (finding.hasUnknownSizes) hasUnknownSizes = true;
    byStatus[finding.baseline.status] += 1;
  }

  return {
    replaceableBytes,
    findingCount: findings.length,
    packageCount,
    hasUnknownSizes,
    byStatus,
  };
}

export interface Report {
  findings: Finding[];
  summary: Summary;
}

/** Convenience wrapper: detect() plus summarize() in one call. Pure. */
export function analyze(
  pkg: PackageJsonLike,
  options: DetectOptions = {},
): Report {
  const findings = detect(pkg, options);
  return { findings, summary: summarize(findings) };
}
