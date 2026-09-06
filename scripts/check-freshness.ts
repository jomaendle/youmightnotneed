/**
 * Fails CI when a support claim has gone stale.
 *
 * Browser support moves monthly and a hardcoded or hand-verified claim will
 * eventually be wrong in public. This script is the backstop:
 *
 *   1. Any rule with a `manualBaseline` older than 90 days is an error.
 *   2. A rule whose featureIds are missing from the snapshot is an error.
 *   3. A rule pointing at a modern-web-guidance guide that no longer exists
 *      upstream is an error, so a report never links to a dead guide.
 *   4. The agent skill's generated catalog reference differing by one byte
 *      from a fresh render is an error, so the skill can never describe a
 *      catalog that moved on.
 *   5. A browser version cited in rule prose that no longer matches the
 *      source data is an error. No version is ever written by hand.
 *   6. The skill's hand-written SKILL.md restating a count that the generated
 *      reference already carries is an error, because it goes stale silently.
 *   6. A snapshot older than 45 days, or generated from an older web-features
 *      than the one installed, is a warning telling you to run the refresh.
 *
 * Run: pnpm check:freshness
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NATIVE_FEATURE_IDS } from "../apps/web/lib/native-usage.ts";
import { baselineSnapshot } from "../packages/catalog/src/generated/baseline.ts";
import { guideSnapshot } from "../packages/catalog/src/generated/guides.ts";
import { packageSizes } from "../packages/catalog/src/generated/sizes.ts";
import { supportClaims } from "../packages/catalog/src/generated/support-claims.ts";
import { rules } from "../packages/catalog/src/rules/index.ts";
import { renderCatalogReference, SKILL_CATALOG_FILE } from "./build-skill.ts";
import { resolveAllClaims, sourceVersions } from "./refresh-support.ts";

const MANUAL_BASELINE_MAX_AGE_DAYS = 90;
const SNAPSHOT_WARN_AGE_DAYS = 45;
const SIZES_WARN_AGE_DAYS = 120;
const GUIDES_WARN_AGE_DAYS = 90;

const require = createRequire(import.meta.url);
const errors: string[] = [];
const warnings: string[] = [];

function daysSince(isoDate: string): number {
  const then = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - then) / 86_400_000);
}

/** A date in the future makes every `age > limit` test below unreachable. */
function isInTheFuture(isoDate: string): boolean {
  return daysSince(isoDate) < 0;
}

// 1. Hand-verified claims expire.
for (const rule of rules) {
  const manual = rule.manualBaseline;
  if (!manual) continue;
  const age = daysSince(manual.verifiedOn);
  if (isInTheFuture(manual.verifiedOn)) {
    errors.push(
      `Rule "${rule.id}" has a manualBaseline verified on ${manual.verifiedOn}, which is in the future. That date can never expire, so the claim would never be re-checked.`,
    );
  } else if (age > MANUAL_BASELINE_MAX_AGE_DAYS) {
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

// 4. Every claimed package needs a measurement, or a typo in `replaces` just
// contributes 0 to the headline kilobytes and nothing ever says so.
const UNSIZEABLE = new Set([
  // Real packages bundlephobia cannot build, checked by hand. Not typos.
  "cordova-plugin-ble-central",
  "react-page-transition",
  "sticky-kit",
  "svelte-intersection-observer",
  "svelte-modals",
  "svelte-select",
]);

for (const rule of rules) {
  for (const pkg of rule.replaces) {
    if (packageSizes.sizes[pkg] || UNSIZEABLE.has(pkg)) continue;
    errors.push(
      `Rule "${rule.id}" claims "${pkg}", which has no size measurement. Run \`pnpm refresh:sizes\`; if the name is right and bundlephobia simply cannot build it, add it to UNSIZEABLE in this script.`,
    );
  }
}

// 5. Guide references must still exist upstream.
for (const rule of rules) {
  for (const id of rule.guides ?? []) {
    if (!Object.hasOwn(guideSnapshot.guides, id)) {
      errors.push(
        `Rule "${rule.id}" points at modern-web-guidance guide "${id}", which is not in the snapshot. Run \`pnpm refresh:guides\`, and drop or repoint the reference if it was renamed upstream.`,
      );
    }
  }
}

// 6. Every browser version the prose cites must still match the source data.
// This is the gate that makes "never guess a version" real: the snapshot is
// re-derived from web-features and BCD and compared, so a hand-edited number
// cannot survive, and a version that moved upstream fails until it is
// regenerated.
const { claims: freshClaims, failures: claimFailures } = resolveAllClaims();
for (const failure of claimFailures) {
  errors.push(`Support claim does not resolve. ${failure}`);
}

const committedClaims = supportClaims.claims;
for (const [token, version] of Object.entries(freshClaims)) {
  const committed = committedClaims[token];
  if (committed === undefined) {
    errors.push(
      `Rule prose cites {{${token}}} but the snapshot has no entry for it. Run \`pnpm refresh:support\`.`,
    );
  } else if (committed !== version) {
    errors.push(
      `{{${token}}} is committed as "${committed}" but the source data says "${version}". Run \`pnpm refresh:support\` and read the diff.`,
    );
  }
}
for (const token of Object.keys(committedClaims)) {
  if (!(token in freshClaims)) {
    errors.push(
      `The snapshot carries {{${token}}}, which no rule cites any more. Run \`pnpm refresh:support\`.`,
    );
  }
}

const sources = sourceVersions();
if (supportClaims.bcdVersion !== sources.bcdVersion) {
  errors.push(
    `Support claims came from browser-compat-data@${supportClaims.bcdVersion} but @${sources.bcdVersion} is installed. Run \`pnpm refresh:support\`.`,
  );
}

// 7. The skill's generated catalog reference must match the catalog exactly.
// Comparing against a fresh render, rather than grepping for rule ids, is what
// catches an edited `when` line or a moved support tier.
try {
  const committed = readFileSync(SKILL_CATALOG_FILE, "utf8");
  if (committed !== renderCatalogReference()) {
    errors.push(
      "skills/youmightnotneed/references/catalog.md does not match the rules. Run `pnpm refresh:skill`.",
    );
  }
} catch {
  errors.push(
    "skills/youmightnotneed/references/catalog.md is missing. Run `pnpm refresh:skill`.",
  );
}

// 8. The hand-written part of the skill must not restate a generated number.
const skillDoc = join(
  dirname(fileURLToPath(import.meta.url)),
  "../skills/youmightnotneed/SKILL.md",
);
try {
  const doc = readFileSync(skillDoc, "utf8");
  const hardcoded = doc.match(/\b\d+\s+(?:rules|packages)\b/);
  if (hardcoded) {
    errors.push(
      `skills/youmightnotneed/SKILL.md hardcodes "${hardcoded[0]}". Counts live in the generated references/catalog.md, or they go stale the next time a rule lands.`,
    );
  }
} catch {
  errors.push("skills/youmightnotneed/SKILL.md is missing.");
}

// 9. Snapshot age is a warning. A version mismatch is not: it means the
// committed data and its source have actually diverged.
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

const guidesAge = daysSince(guideSnapshot.fetchedOn);
if (guidesAge > GUIDES_WARN_AGE_DAYS) {
  warnings.push(
    `The modern-web-guidance index was taken ${guidesAge} days ago (${guideSnapshot.fetchedOn}, v${guideSnapshot.version}). Run \`pnpm refresh:guides\`.`,
  );
}

const installed = installedWebFeaturesVersion();
if (installed && installed !== baselineSnapshot.webFeaturesVersion) {
  // Nothing else compares the committed snapshot against web-features, so this
  // is the only signal that the two have diverged. A warning is invisible in a
  // green check.
  errors.push(
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
