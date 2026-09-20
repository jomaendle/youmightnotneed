import {
  type BaselineStatus,
  baselineLabel,
  baselineSince,
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

/**
 * What a --since run narrowed away. Carried so the report can account for
 * every finding it is not showing: a filtered report that silently drops the
 * rest reads as "this is everything", which is the one thing it is not.
 */
export interface SinceView {
  /** The YYYY-MM-DD date the reader asked about. */
  date: string;
  /** Findings that reached their current status before the date. */
  earlier: number;
  /** Findings the catalog holds no crossing date for. */
  undated: number;
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
  /** Set when --since narrowed the report. */
  since?: SinceView | undefined;
}

/**
 * The line accounting for what a --since run is not showing. Returns null
 * when nothing was held back, so a window that happens to cover the whole
 * report does not print a sentence about zero findings.
 */
function sinceNote(view: SinceView): string | null {
  const parts: string[] = [];
  if (view.earlier > 0) {
    parts.push(
      `${view.earlier} reached ${view.earlier === 1 ? "its" : "their"} current status earlier`,
    );
  }
  if (view.undated > 0) {
    parts.push(
      `${view.undated} ${view.undated === 1 ? "has" : "have"} no crossing date in the catalog's data`,
    );
  }
  if (parts.length === 0) return null;
  const total = view.earlier + view.undated;
  return `${total} other ${total === 1 ? "finding is" : "findings are"} outside this view: ${parts.join(", ")}.`;
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

/**
 * What a report with no findings says. Three different answers wear the same
 * empty list: a --since window nothing fell into, a package the catalog has
 * no rule for, and a project where nothing matched. Saying the wrong one is a
 * false claim about the catalog's coverage.
 */
function emptyBody(options: RenderOptions): string[] {
  const { palette, since } = options;
  // The note is non-null on exactly the runs where the window held something
  // back, so it doubles as the test for whether the window did the filtering.
  // `--package lodash --since 2026-01-01` matches no rule at all, and saying
  // "nothing reached that status" would imply a rule exists that crossed
  // earlier, which is a different and wrong answer.
  const note = since ? sinceNote(since) : null;

  let headline: string;
  if (since && note) {
    headline = `Nothing here reached its current Baseline status on or after ${since.date}.`;
  } else if (options.subject === "package") {
    headline = `The catalog has no rule for ${options.projectName ?? "that package"}.`;
  } else {
    headline =
      "Nothing in this package.json has a native equivalent in the catalog.";
  }

  return [
    `  ${palette("green", headline)}`,
    `  ${palette(
      "grey",
      note ??
        "The catalog only covers cases where the platform replaces a library outright.",
    )}`,
  ];
}

/** The kilobyte headline and the qualifications that have to travel with it. */
function headlineBlock(
  summary: Report["summary"],
  options: RenderOptions,
): string[] {
  const { palette, since } = options;
  const lines = [
    `  ${palette(
      "bold",
      formatHeadline(summary.replaceableBytes, summary.packageCount),
    )}`,
  ];
  if (since) {
    lines.push(
      `  ${palette("grey", `Reached Baseline widely or newly available on or after ${since.date}.`)}`,
    );
  }
  lines.push(
    `  ${palette("grey", "Minified and gzipped, and 'up to' on purpose: a dependency being installed is not proof of how it is used.")}`,
  );
  const note = since ? sinceNote(since) : null;
  if (note) lines.push(`  ${palette("grey", note)}`);
  if (summary.hasUnknownSizes) {
    lines.push(
      `  ${palette("grey", "Some matched packages have no measurement, so the real figure is higher.")}`,
    );
  }
  return lines;
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
    lines.push(...emptyBody(options));
    lines.push("");
    lines.push(palette("grey", footer(options, false)));
    lines.push("");
    return lines.join("\n");
  }

  lines.push(...headlineBlock(summary, options));
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
export function renderJson(
  report: Report,
  provenance?: Provenance,
  since?: SinceView,
): string {
  return JSON.stringify(
    {
      // The human footer states the data vintage; without it here a script or
      // an agent consuming --json cannot tell how old the snapshot is.
      provenance,
      // Only present under --since, and it names what the findings list left
      // out so a consumer is not reading a filtered list as a whole one.
      since,
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
          // Unconditional, so a consumer never has to branch on whether
          // --since was passed to know the shape it is reading. Null means
          // the catalog holds no crossing date, not that none happened.
          since: baselineSince(finding.baseline),
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
