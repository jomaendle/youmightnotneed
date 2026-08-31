import {
  type BaselineStatus,
  baselineLabel,
  type Finding,
  formatBytes,
  formatHeadline,
  formatList,
  type Report,
} from "@youmightnotneed/catalog";
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
    note: "the catalog could not resolve these, so treat them with suspicion",
    marker: "?",
    color: "grey",
  },
];

export interface RenderOptions {
  palette: Palette;
  /** Shown in the header, usually the package.json name field. */
  projectName?: string | undefined;
  provenance: {
    baselineOn: string;
    webFeaturesVersion: string;
    sizesOn: string;
  };
  /** Print the full unless list. When false, print only a count. */
  verbose: boolean;
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
    lines.push(
      `    ${palette(
        "dim",
        `keep it if ${count} condition${count === 1 ? "" : "s"} apply, see --verbose`,
      )}`,
    );
  }

  lines.push("");
  return lines;
}

function footer(options: RenderOptions): string {
  const { provenance } = options;
  return [
    `Baseline from web-features@${provenance.webFeaturesVersion}, captured ${provenance.baselineOn}.`,
    `Sizes from bundlephobia, captured ${provenance.sizesOn}.`,
    "Details and live demos: https://youmightnotneed.dev",
  ].join("\n");
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
      `  ${palette("green", "Nothing in this package.json has a native equivalent in the catalog.")}`,
    );
    lines.push(
      `  ${palette("grey", "That is a real result. The catalog only covers CSS and HTML replacements.")}`,
    );
    lines.push("");
    lines.push(palette("grey", footer(options)));
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

  lines.push(palette("grey", footer(options)));
  lines.push("");
  return lines.join("\n");
}

/** --json, so scripts and agents get the data without parsing terminal text. */
export function renderJson(report: Report): string {
  return JSON.stringify(
    {
      summary: report.summary,
      findings: report.findings.map((finding) => ({
        ruleId: finding.rule.id,
        title: finding.rule.title,
        native: finding.rule.native,
        baseline: {
          status: finding.baseline.status,
          label: baselineLabel(finding.baseline.status),
          limitedBy: finding.baseline.limitedBy?.id ?? null,
          dataDate: finding.baseline.dataDate,
        },
        matched: finding.matched.map((m) => ({
          name: m.name,
          fields: m.fields,
          gzip: m.gzip,
        })),
        replaceableBytes: finding.replaceableBytes,
        when: finding.rule.agent.when,
        unless: finding.rule.agent.unless,
        snippet: finding.rule.agent.snippet,
        demoUrl: finding.rule.human.demoUrl ?? null,
      })),
    },
    null,
    2,
  );
}

/** Handy for tests and for a one-line summary. */
export function describeMatched(finding: Finding): string {
  return formatList(finding.matched.map((m) => m.name));
}
