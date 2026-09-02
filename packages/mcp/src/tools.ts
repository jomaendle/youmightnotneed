import {
  analyze,
  BASELINE_DATA_DATE,
  type PackageJsonLike,
  packageSizes,
  type Report,
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
