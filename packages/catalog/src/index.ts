/**
 * @youmightnotneed/catalog
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
  compareBaseline,
  type ResolvedFeature,
  resolveBaseline,
  resolveFeature,
  WEB_FEATURES_VERSION,
} from "./baseline.ts";
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
export { packageSizes, type SizeSnapshot } from "./generated/sizes.ts";
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
