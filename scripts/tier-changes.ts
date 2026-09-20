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
  type TierChange,
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
  liveFeatures as Parameters<typeof diffTiers>[2],
);

const promotions = changes.filter((c) => c.direction === "promotion");
const regressions = changes.filter((c) => c.direction === "regression");
const missing = changes.filter((c) => c.direction === "missing");

function describe(change: TierChange): string {
  const to = change.to === null ? "" : ` to ${LABEL[change.to]}`;
  return `- \`${change.ruleId}\`: \`${change.featureId}\` moves from ${LABEL[change.from]}${to}`;
}

const lines: string[] = [];

if (changes.length === 0) {
  lines.push(
    `No rule changes tier. Snapshot is web-features@${baselineSnapshot.webFeaturesVersion}, captured ${baselineSnapshot.generatedOn}.`,
  );
}

if (promotions.length > 0) {
  lines.push("**Better supported than the committed snapshot says:**", "");
  for (const change of promotions) lines.push(describe(change));
  lines.push("");
  // The whole reason limited rules are worth writing before they land.
  const landed = promotions.filter((c) => c.from === "limited");
  if (landed.length > 0) {
    lines.push(
      `${landed.length} of these left limited availability, so ${landed.length === 1 ? "its rule no longer needs" : "their rules no longer need"} to lead with a fallback. Worth a post.`,
      "",
    );
  }
}

if (regressions.length > 0) {
  lines.push("**Worse supported than the committed snapshot says:**", "");
  for (const change of regressions) lines.push(describe(change));
  lines.push("");
}

if (missing.length > 0) {
  // The loudest case, and the one a silent skip used to swallow: the rule
  // still renders a tier from an ID upstream no longer publishes.
  lines.push("**Gone from web-features entirely, probably renamed:**", "");
  for (const change of missing) {
    lines.push(
      `- \`${change.ruleId}\`: \`${change.featureId}\` is in the snapshot but not in web-features@latest`,
    );
  }
  lines.push(
    "",
    "Repoint or drop these before the refresh lands, or the rule loses its derived tier.",
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
