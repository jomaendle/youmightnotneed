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
 * A report, never a gate: it exits 0 whatever it finds. A tier moving is news,
 * not a failure, and the refresh PR should open either way.
 */
import { features as liveFeatures } from "web-features";
import { baselineSnapshot } from "../packages/catalog/src/generated/baseline.ts";
import { rules } from "../packages/catalog/src/rules/index.ts";
import type { BaselineStatus } from "../packages/catalog/src/schema.ts";

type Live = { status?: { baseline?: "high" | "low" | false } };

function toStatus(
  baseline: "high" | "low" | false | undefined,
): BaselineStatus {
  if (baseline === "high") return "widely";
  if (baseline === "low") return "newly";
  if (baseline === false) return "limited";
  return "unknown";
}

/** Higher is better supported, so a positive delta is a promotion. */
const RANK: Record<BaselineStatus, number> = {
  unknown: 0,
  limited: 1,
  newly: 2,
  widely: 3,
};

const LABEL: Record<BaselineStatus, string> = {
  widely: "widely available",
  newly: "newly available",
  limited: "limited",
  unknown: "unverified",
};

interface Change {
  ruleId: string;
  featureId: string;
  from: BaselineStatus;
  to: BaselineStatus;
}

const promotions: Change[] = [];
const regressions: Change[] = [];

// Only features some rule actually depends on. web-features tracks thousands
// and a tier move in one nothing here references is not news for this repo.
for (const rule of rules) {
  for (const featureId of rule.featureIds) {
    const committed = Object.hasOwn(baselineSnapshot.features, featureId)
      ? baselineSnapshot.features[featureId]
      : undefined;
    const live = Object.hasOwn(liveFeatures, featureId)
      ? ((liveFeatures as Record<string, Live>)[featureId] as Live)
      : undefined;
    if (!(committed && live)) continue;

    const from = toStatus(committed.baseline);
    const to = toStatus(live.status?.baseline);
    if (from === to) continue;

    const change: Change = { ruleId: rule.id, featureId, from, to };
    if (RANK[to] > RANK[from]) promotions.push(change);
    else regressions.push(change);
  }
}

function describe(change: Change): string {
  return `- \`${change.ruleId}\`: \`${change.featureId}\` moves from ${LABEL[change.from]} to ${LABEL[change.to]}`;
}

const lines: string[] = [];

if (promotions.length === 0 && regressions.length === 0) {
  lines.push(
    `No rule changes tier. Snapshot is web-features@${baselineSnapshot.webFeaturesVersion}, captured ${baselineSnapshot.generatedOn}.`,
  );
} else {
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
    // Rare, and always worth a human look: usually web-features splitting or
    // renaming a feature rather than a browser actually removing support.
    lines.push("**Worse supported than the committed snapshot says:**", "");
    for (const change of regressions) lines.push(describe(change));
    lines.push("");
  }
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
