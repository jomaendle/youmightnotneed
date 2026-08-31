/**
 * Fails CI when a support claim has gone stale.
 *
 * Browser support moves monthly and a hardcoded or hand-verified claim will
 * eventually be wrong in public. This script is the backstop:
 *
 *   1. Any rule with a `manualBaseline` older than 90 days is an error.
 *   2. A rule whose featureIds are missing from the snapshot is an error.
 *   3. A snapshot older than 45 days, or generated from an older web-features
 *      than the one installed, is a warning telling you to run the refresh.
 *
 * Run: pnpm check:freshness
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { NATIVE_FEATURE_IDS } from "../apps/web/lib/native-usage.ts";
import { baselineSnapshot } from "../packages/catalog/src/generated/baseline.ts";
import { packageSizes } from "../packages/catalog/src/generated/sizes.ts";
import { rules } from "../packages/catalog/src/rules/index.ts";

const MANUAL_BASELINE_MAX_AGE_DAYS = 90;
const SNAPSHOT_WARN_AGE_DAYS = 45;
const SIZES_WARN_AGE_DAYS = 120;

const require = createRequire(import.meta.url);
const errors: string[] = [];
const warnings: string[] = [];

function daysSince(isoDate: string): number {
  const then = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - then) / 86_400_000);
}

// 1. Hand-verified claims expire.
for (const rule of rules) {
  const manual = rule.manualBaseline;
  if (!manual) continue;
  const age = daysSince(manual.verifiedOn);
  if (age > MANUAL_BASELINE_MAX_AGE_DAYS) {
    errors.push(
      `Rule "${rule.id}" has a manualBaseline verified ${age} days ago (limit is ${MANUAL_BASELINE_MAX_AGE_DAYS}). Re-check the support and update verifiedOn, or move it onto a web-features ID.`,
    );
  }
}

// 2. Every referenced feature must be in the snapshot.
for (const rule of rules) {
  for (const id of rule.featureIds) {
    if (!baselineSnapshot.features[id]) {
      errors.push(
        `Rule "${rule.id}" references web-features ID "${id}", which is not in the snapshot. Run \`pnpm refresh:baseline\`.`,
      );
    }
  }
}

// 3. Features the site itself uses must resolve, or /native claims a feature
// is widely available while its badge reads "Unverified".
for (const id of NATIVE_FEATURE_IDS) {
  if (!baselineSnapshot.features[id]) {
    errors.push(
      `The site uses web-features ID "${id}" but it is not in the snapshot. Run \`pnpm refresh:baseline\`.`,
    );
  }
}

// 4. Snapshot age and version drift are warnings, not failures.
const snapshotAge = daysSince(baselineSnapshot.generatedOn);
if (snapshotAge > SNAPSHOT_WARN_AGE_DAYS) {
  warnings.push(
    `The Baseline snapshot is ${snapshotAge} days old (${baselineSnapshot.generatedOn}). Run \`pnpm refresh:baseline\`.`,
  );
}

const sizesAge = daysSince(packageSizes.fetchedOn);
if (sizesAge > SIZES_WARN_AGE_DAYS) {
  warnings.push(
    `Bundle sizes were fetched ${sizesAge} days ago (${packageSizes.fetchedOn}). Run \`pnpm refresh:sizes\`.`,
  );
}

function installedWebFeaturesVersion(): string | null {
  let dir = dirname(require.resolve("web-features"));
  for (let depth = 0; depth < 5; depth += 1) {
    try {
      const pkg = JSON.parse(
        readFileSync(join(dir, "package.json"), "utf8"),
      ) as {
        name?: string;
        version?: string;
      };
      if (pkg.name === "web-features" && pkg.version) return pkg.version;
    } catch {
      // Keep walking up.
    }
    dir = dirname(dir);
  }
  return null;
}

const installed = installedWebFeaturesVersion();
if (installed && installed !== baselineSnapshot.webFeaturesVersion) {
  warnings.push(
    `The snapshot came from web-features@${baselineSnapshot.webFeaturesVersion} but web-features@${installed} is installed. Run \`pnpm refresh:baseline\`.`,
  );
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} freshness check(s) failed.`);
  process.exit(1);
}

console.info(
  `Freshness OK. Baseline data from ${baselineSnapshot.generatedOn} (web-features@${baselineSnapshot.webFeaturesVersion}), sizes from ${packageSizes.fetchedOn}. ${warnings.length} warning(s).`,
);
