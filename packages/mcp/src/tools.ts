import {
  analyze,
  BASELINE_DATA_DATE,
  type BaselineInfo,
  packageSizes,
  type PackageJsonLike,
  type Report,
  resolveBaseline,
  type Rule,
  rules,
  rulesById,
  rulesByPackage,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";

export interface Provenance {
  baselineOn: string;
  webFeaturesVersion: string;
  sizesOn: string;
}

export interface AnalyzeDependenciesResult extends Report {
  provenance: Provenance;
}

/**
 * Matches a package.json's dependency fields against the catalog. Pure:
 * calls straight into @jomae/catalog's analyze(), no filesystem or network.
 */
export function analyzeDependencies(
  input: PackageJsonLike,
): AnalyzeDependenciesResult {
  const report = analyze(input);
  return {
    ...report,
    provenance: {
      baselineOn: BASELINE_DATA_DATE,
      webFeaturesVersion: WEB_FEATURES_VERSION,
      sizesOn: packageSizes.fetchedOn,
    },
  };
}

export interface RuleSummary {
  id: string;
  title: string;
  replaces: string[];
  native: string;
}

/** Every rule, four fields each. Pure. Use getRule() for full detail. */
export function listRules(): { rules: RuleSummary[] } {
  return {
    rules: rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      replaces: rule.replaces,
      native: rule.native,
    })),
  };
}

export type GetRuleInput = { id: string } | { package: string };

export type GetRuleResult =
  | { found: true; rule: Rule; baseline: BaselineInfo }
  | { found: false };

/**
 * Looks up one rule by its id or by an npm package name it replaces. Pure.
 * Returns { found: false } rather than throwing, matching
 * resolveFeature()'s no-throw-on-unknown-input behavior elsewhere in the
 * catalog.
 */
export function getRule(input: GetRuleInput): GetRuleResult {
  const rule =
    "id" in input
      ? rulesById.get(input.id)
      : rulesByPackage.get(input.package);

  if (!rule) return { found: false };
  return { found: true, rule, baseline: resolveBaseline(rule) };
}
