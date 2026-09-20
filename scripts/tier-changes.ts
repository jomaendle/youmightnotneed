/**
 * Reports which rules would change Baseline tier if the snapshot were
 * refreshed right now.
 *
 * The monthly refresh already opens a PR, and its body used to say "check the
 * diff for rules that changed tier". That asks a human to read a generated
 * file of ninety-odd features and spot three changed lines, which is exactly
 * the kind of reading nobody does twice. This says it in a sentence instead.
 *
 * Run it BEFORE `pnpm refresh:baseline`, so the committed snapshot is still
 * the old state and `web-features` on disk is already the new one. After the
 * refresh the two agree and it correctly reports nothing.
 *
 * A report, never a gate: it exits 0 whatever it finds, and the workflow step
 * is `continue-on-error` so even a crash here cannot block the refresh PR. A
 * tier moving is news, not a failure.
 *
 * The comparison itself lives in `packages/catalog/src/tier-diff.ts`, where
 * the test machinery reaches. This file is only the I/O around it.
 */
import { features as liveFeatures } from "web-features";
import { baselineSnapshot } from "../packages/catalog/src/generated/baseline.ts";
import { rules } from "../packages/catalog/src/rules/index.ts";
import type { BaselineStatus } from "../packages/catalog/src/schema.ts";
import {
  diffTiers,
  type LiveFeatures,
  type TierChange,
  type TierDirection,
} from "../packages/catalog/src/tier-diff.ts";

const LABEL: Record<BaselineStatus, string> = {
  widely: "widely available",
  newly: "newly available",
  limited: "limited",
  unknown: "unverified",
};

const changes = diffTiers(
  rules,
  baselineSnapshot.features,
  liveFeatures as LiveFeatures,
);

/** Both directions that carry a destination tier, narrowed for `describe`. */
type Moved = Extract<TierChange, { to: BaselineStatus }>;
const isMoved = (c: TierChange, d: TierDirection): c is Moved =>
  c.direction === d;

const promotions = changes.filter((c): c is Moved => isMoved(c, "promotion"));
const regressions = changes.filter((c): c is Moved => isMoved(c, "regression"));
const missing = changes.filter((c) => c.direction === "missing");

/** Narrowed to the two directions that have a destination tier. */
function describe(change: Moved): string {
  return `- \`${change.ruleId}\`: \`${change.featureId}\` moves from ${LABEL[change.from]} to ${LABEL[change.to]}`;
}

const lines: string[] = [];

/** A heading, its rows, and the blank line every section ends with. */
function section(heading: string, rows: readonly string[]): string[] {
  return rows.length === 0 ? [] : [heading, "", ...rows, ""];
}

if (changes.length === 0) {
  lines.push(
    `No rule changes tier. Snapshot is web-features@${baselineSnapshot.webFeaturesVersion}, captured ${baselineSnapshot.generatedOn}.`,
  );
}

lines.push(
  ...section(
    "**Better supported than the committed snapshot says:**",
    promotions.map(describe),
  ),
);

// The whole reason limited rules are worth writing before they land.
const landed = promotions.filter((c) => c.from === "limited");
if (landed.length > 0) {
  lines.push(
    `${landed.length} of these left limited availability, so ${landed.length === 1 ? "its rule no longer needs" : "their rules no longer need"} to lead with a fallback. Worth a post.`,
    "",
  );
}

lines.push(
  ...section(
    "**Worse supported than the committed snapshot says:**",
    regressions.map(describe),
  ),
);

// The loudest case, and the one a silent skip used to swallow: the rule still
// renders a tier from an ID upstream no longer publishes.
lines.push(
  ...section(
    "**Gone from web-features entirely, probably renamed:**",
    missing.map(
      (change) =>
        `- \`${change.ruleId}\`: \`${change.featureId}\` is in the snapshot but not in web-features@latest`,
    ),
  ),
);
if (missing.length > 0) {
  lines.push(
    "Repoint or drop these before the refresh lands, or the rule loses its derived tier.",
    "",
  );
}

// The diff walks featureIds, so a manualBaseline rule has nothing to compare
// and can never appear above. Saying so keeps the report from reading as a
// complete sweep when it structurally is not: those tiers are a person's
// assertion, and check:freshness expires them at 90 days instead.
const manual = rules.filter((rule) => rule.featureIds.length === 0);
if (manual.length > 0) {
  lines.push(
    `${manual.length} rule${manual.length === 1 ? "" : "s"} carry a hand-verified tier and are not covered above: ${manual
      .map((rule) => `\`${rule.id}\``)
      .join(", ")}. check:freshness expires those separately.`,
    "",
  );
}

const report = lines.join("\n");
console.info(report);

// GitHub Actions reads this file into the job summary, and the refresh
// workflow also pastes it into the PR body.
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(summaryPath, `## Baseline tier changes\n\n${report}\n`);
}
