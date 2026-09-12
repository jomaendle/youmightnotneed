import {
  type BaselineStatus,
  baselineLabel,
  type Finding,
  formatBytes,
  formatHeadline,
  guideCommand,
  type Report,
  resolveGuides,
  resolveRuleLint,
} from "@jomae/catalog";
import type { ColorName, Palette } from "./colors.ts";

/**
 * Turns a report into terminal output. Pure: takes a report and a palette and
 * returns a string. Everything touching the filesystem lives in bin.ts.
 */

interface Tier {
  status: BaselineStatus;
  heading: string;
  /** Sets expectations before the reader sees the rules underneath. */
  note: string;
  marker: string;
  color: ColorName;
}

const TIERS: Tier[] = [
  {
    status: "widely",
    heading: "Baseline widely available",
    note: "safe to use today",
    marker: "+",
    color: "green",
  },
  {
    status: "newly",
    heading: "Baseline newly available",
    note: "works in current browsers, check your support target",
    marker: "~",
    color: "yellow",
  },
  {
    status: "limited",
    heading: "Limited availability",
    note: "not in every engine yet, so it needs a fallback",
    marker: "!",
    color: "red",
  },
  {
    status: "unknown",
    heading: "Support unverified",
    note: "the catalog could not resolve support for these",
    marker: "?",
    color: "grey",
  },
];

export interface Provenance {
  baselineOn: string;
  webFeaturesVersion: string;
  sizesOn: string;
}

export interface RenderOptions {
  palette: Palette;
  /** Shown in the header, usually the package.json name field. */
  projectName?: string | undefined;
  /**
   * What was scanned. A single --package lookup that matches nothing needs
   * different wording from a whole project that matches nothing.
   */
  subject?: "project" | "package" | undefined;
  provenance: Provenance;
  /** Print the full unless list. When false, print only a count. */
  verbose: boolean;
}

/**
 * The two places a finding hands off to something else: a lint rule that
 * already checks the shape mechanically, and a guide that covers the
 * implementation. Verbose only, because both are for someone who has decided
 * to act rather than someone skimming.
 */
function renderReferences(
  finding: Finding,
  palette: Palette,
): readonly string[] {
  const lines: string[] = [];

  const lint = resolveRuleLint(finding.rule);
  if (lint?.url) {
    lines.push(
      `    ${palette("dim", "lint      ")}${palette("grey", lint.name)}`,
    );
  }

  const guides = resolveGuides(finding.rule).filter((g) => g.url !== null);
  if (guides.length > 0) {
    lines.push(
      `    ${palette("dim", "guides    ")}${palette(
        "grey",
        guides.map((g) => g.id).join(", "),
      )}`,
    );
  }

  return lines;
}

function renderFinding(finding: Finding, options: RenderOptions): string[] {
  const { palette } = options;
  const lines: string[] = [];
  const size =
    finding.replaceableBytes === null
      ? "size unknown"
      : formatBytes(finding.replaceableBytes);

  lines.push(
    `  ${palette("bold", finding.rule.title)} ${palette("grey", `(${size})`)}`,
  );
  lines.push(
    `    ${palette("dim", "you have  ")}${finding.matched
      .map((m) => palette("cyan", m.name))
      .join(", ")}`,
  );
  lines.push(`    ${palette("dim", "native    ")}${finding.rule.native}`);

  const limitedBy = finding.baseline.limitedBy;
  if (limitedBy) {
    lines.push(
      `    ${palette("dim", "capped by ")}${palette(
        "grey",
        `${limitedBy.name}, ${baselineLabel(limitedBy.status).toLowerCase()}`,
      )}`,
    );
  }

  // Never show a replacement without the conditions under which it is wrong.
  if (options.verbose) {
    lines.push(`    ${palette("dim", "keep it if")}`);
    for (const condition of finding.rule.agent.unless) {
      lines.push(`      ${palette("grey", `- ${condition}`)}`);
    }
  } else {
    const count = finding.rule.agent.unless.length;
    const clause =
      count === 1 ? "1 condition applies" : `${count} conditions apply`;
    lines.push(`    ${palette("dim", `keep it if ${clause}, see --verbose`)}`);
  }

  if (options.verbose) {
    lines.push(...renderReferences(finding, palette));
  }

  lines.push("");
  return lines;
}

function footer(options: RenderOptions, hasGuides: boolean): string {
  const { provenance } = options;
  const lines = [
    `Baseline from web-features@${provenance.webFeaturesVersion}, captured ${provenance.baselineOn}.`,
    `Sizes from bundlephobia, captured ${provenance.sizesOn}.`,
  ];
  if (hasGuides) {
    lines.push(
      `Guides are from modern-web-guidance, Apache-2.0. Read one with ${guideCommand(["<id>"])}.`,
    );
  }
  lines.push("Details and live demos: https://youmightnotneed.dev");
  return lines.join("\n");
}

export function renderReport(report: Report, options: RenderOptions): string {
  const { palette } = options;
  const { findings, summary } = report;
  const lines: string[] = [];

  lines.push("");
  const title = palette("bold", "youmightnotneed");
  lines.push(
    options.projectName
      ? `${title} ${palette("grey", `· ${options.projectName}`)}`
      : title,
  );
  lines.push("");

  if (findings.length === 0) {
    lines.push(
      `  ${palette(
        "green",
        options.subject === "package"
          ? `The catalog has no rule for ${options.projectName ?? "that package"}.`
          : "Nothing in this package.json has a native equivalent in the catalog.",
      )}`,
    );
    lines.push(
      `  ${palette("grey", "The catalog only covers cases where the platform replaces a library outright.")}`,
    );
    lines.push("");
    lines.push(palette("grey", footer(options, false)));
    lines.push("");
    return lines.join("\n");
  }

  lines.push(
    `  ${palette(
      "bold",
      formatHeadline(summary.replaceableBytes, summary.packageCount),
    )}`,
  );
  lines.push(
    `  ${palette("grey", "Minified and gzipped, and 'up to' on purpose: a dependency being installed is not proof of how it is used.")}`,
  );
  if (summary.hasUnknownSizes) {
    lines.push(
      `  ${palette("grey", "Some matched packages have no measurement, so the real figure is higher.")}`,
    );
  }
  lines.push("");

  for (const tier of TIERS) {
    const inTier = findings.filter((f) => f.baseline.status === tier.status);
    if (inTier.length === 0) continue;

    lines.push(
      `${palette(tier.color, tier.marker)} ${palette("bold", tier.heading)} ${palette("grey", `· ${tier.note}`)}`,
    );
    lines.push("");
    for (const finding of inTier) {
      lines.push(...renderFinding(finding, options));
    }
  }

  const hasGuides =
    options.verbose &&
    findings.some((f) => resolveGuides(f.rule).some((g) => g.url !== null));
  lines.push(palette("grey", footer(options, hasGuides)));
  lines.push("");
  return lines.join("\n");
}

/** --json, so scripts and agents get the data without parsing terminal text. */
export function renderJson(report: Report, provenance?: Provenance): string {
  return JSON.stringify(
    {
      // The human footer states the data vintage; without it here a script or
      // an agent consuming --json cannot tell how old the snapshot is.
      provenance,
      summary: report.summary,
      findings: report.findings.map((finding) => ({
        ruleId: finding.rule.id,
        title: finding.rule.title,
        category: finding.rule.category,
        native: finding.rule.native,
        baseline: {
          status: finding.baseline.status,
          label: baselineLabel(finding.baseline.status),
          limitedBy: finding.baseline.limitedBy?.id ?? null,
          dataDate: finding.baseline.dataDate,
          // Null for a derived tier. On the four hand-verified rules this
          // says which web-features ID was rejected and why, which is the
          // only place a consumer can see that the tier was not derived.
          note: finding.baseline.note,
        },
        matched: finding.matched.map((m) => ({
          name: m.name,
          fields: m.fields,
          gzip: m.gzip,
          measuredVersion: m.measuredVersion,
        })),
        replaceableBytes: finding.replaceableBytes,
        when: finding.rule.agent.when,
        unless: finding.rule.agent.unless,
        snippet: finding.rule.agent.snippet,
        demoUrl: finding.rule.human.demoUrl ?? null,
        lintRule: finding.rule.lintRule,
        guides: resolveGuides(finding.rule)
          .filter((g) => g.url !== null)
          .map((g) => ({
            id: g.id,
            category: g.category,
            url: g.url,
            command: g.command,
          })),
      })),
    },
    null,
    2,
  );
}
