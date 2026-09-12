import {
  analyze,
  BASELINE_DATA_DATE,
  type BaselineInfo,
  type Finding,
  GUIDE_SOURCE,
  type PackageJsonLike,
  packageSizes,
  type Report,
  type ResolvedGuide,
  type ResolvedLintRule,
  type Rule,
  resolveBaseline,
  resolveGuides,
  resolveRuleLint,
  rules,
  rulesById,
  rulesByPackage,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";

interface Provenance {
  baselineOn: string;
  webFeaturesVersion: string;
  sizesOn: string;
  guidesOn: string;
  guidesVersion: string;
}

/**
 * A finding with its long-form guides resolved. The catalog answers which
 * dependency has a native equivalent; the guides are the implementation an
 * agent should read before writing the replacement.
 */
interface GuidedFinding extends Finding {
  guides: ResolvedGuide[];
}

export interface AnalyzeDependenciesResult extends Omit<Report, "findings"> {
  findings: GuidedFinding[];
  provenance: Provenance;
  guideSource: typeof GUIDE_SOURCE;
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
    findings: report.findings.map((finding) => ({
      ...finding,
      guides: resolveGuides(finding.rule).filter((g) => g.url !== null),
    })),
    provenance: {
      baselineOn: BASELINE_DATA_DATE,
      webFeaturesVersion: WEB_FEATURES_VERSION,
      sizesOn: packageSizes.fetchedOn,
      guidesOn: GUIDE_SOURCE.fetchedOn,
      guidesVersion: GUIDE_SOURCE.version,
    },
    guideSource: GUIDE_SOURCE,
  };
}

export interface RuleSummary {
  id: string;
  title: string;
  replaces: string[];
  native: string;
  /** A lint rule that already checks this shape, when one exists. */
  lintRule?: string;
}

/**
 * One shape someone writes by hand instead of using the native feature.
 *
 * Keyed by the shape rather than by the rule, because an agent reaching for
 * this arrives holding code and not a rule id.
 */
export interface HandRolledShape {
  shape: string;
  ruleId: string;
  native: string;
}

/** Every rule, four fields each. Pure. Use getRule() for full detail. */
export function listRules(): {
  rules: RuleSummary[];
  handRolledShapes: HandRolledShape[];
} {
  return {
    rules: rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      replaces: rule.replaces,
      native: rule.native,
      lintRule: rule.lintRule,
    })),
    // The whole checklist in one call, so an agent holding code rather than a
    // package name does not have to fetch 64 rules to find out which shapes
    // are worth looking for.
    handRolledShapes: rules.flatMap((rule) =>
      (rule.agent.handRolled ?? []).map((shape) => ({
        shape,
        ruleId: rule.id,
        native: rule.native,
      })),
    ),
  };
}

export type GetRuleInput = { id: string } | { package: string };

export type GetRuleResult =
  | {
      found: true;
      rule: Rule;
      baseline: BaselineInfo;
      guides: ResolvedGuide[];
      /** The lint rule that already checks this, resolved, or null. */
      lint: ResolvedLintRule | null;
    }
  | { found: false };

/**
 * Looks up one rule by its id or by an npm package name it replaces. Pure.
 * Returns { found: false } rather than throwing, matching
 * resolveFeature()'s no-throw-on-unknown-input behavior elsewhere in the
 * catalog.
 */
export function getRule(input: GetRuleInput): GetRuleResult {
  const rule =
    "id" in input ? rulesById.get(input.id) : rulesByPackage.get(input.package);

  if (!rule) return { found: false };
  return {
    found: true,
    rule,
    baseline: resolveBaseline(rule),
    guides: resolveGuides(rule).filter((g) => g.url !== null),
    lint: resolveRuleLint(rule),
  };
}
