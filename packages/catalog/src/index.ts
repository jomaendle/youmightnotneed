/**
 * @jomae/catalog
 *
 * The rule catalog, the pure detection function, and the Baseline resolution
 * that sits between them. Every surface is a thin adapter over this package.
 */

export {
  BASELINE_DATA_DATE,
  type BaselineInfo,
  baselineLabel,
  baselineRank,
  baselineShortLabel,
  combinedSupport,
  compareBaseline,
  hasNoVersions,
  type ResolvedFeature,
  resolveBaseline,
  resolveFeature,
  TRACKED_BROWSERS,
  type TrackedBrowser,
  unpublishedSupport,
  WEB_FEATURES_VERSION,
} from "./baseline.ts";
export {
  CATEGORIES,
  CATEGORIES_BY_ID,
  type CategoryId,
  categorySchema,
} from "./categories.ts";
export {
  analyze,
  DEPENDENCY_FIELDS,
  type DependencyField,
  type DetectOptions,
  detect,
  type Finding,
  type MatchedPackage,
  type PackageJsonLike,
  type Report,
  type Summary,
  sortFindings,
  summarize,
} from "./detect.ts";
export {
  formatBytes,
  formatConditional,
  formatHeadline,
  formatList,
} from "./format.ts";
export {
  type BaselineHistory,
  type BaselineHistoryEntry,
  baselineHistory,
} from "./generated/baseline-history.ts";
export { packageSizes, type SizeSnapshot } from "./generated/sizes.ts";
export {
  GUIDE_SOURCE,
  type GuideSnapshot,
  guideCommand,
  guideSnapshot,
  isKnownGuide,
  type ResolvedGuide,
  resolveGuide,
  resolveGuides,
} from "./guides.ts";
export { type TierShare, tierShareOf } from "./history.ts";
export {
  isKnownLintRule,
  LINT_RULES_FETCHED_ON,
  LINT_SOURCES,
  type LintRuleSnapshot,
  lintRuleSnapshot,
  type ResolvedLintRule,
  resolveLintRule,
  resolveRuleLint,
} from "./lint.ts";
export {
  renderRuleMarkdown,
  renderUseCaseTable,
  ruleMarkdownUrl,
} from "./markdown.ts";
export { rules, rulesById, rulesByPackage } from "./rules/index.ts";
export {
  type BaselineStatus,
  baselineStatusSchema,
  type ManualBaseline,
  manualBaselineSchema,
  parseCatalog,
  type Rule,
  ruleSchema,
  SCHEMA_VERSION,
} from "./schema.ts";
export {
  MIN_QUERY_LENGTH,
  type SearchOptions,
  type SearchResult,
  searchRules,
} from "./search.ts";
