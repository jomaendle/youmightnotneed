import { detect } from "@jomae/catalog";
import { EXAMPLE_PACKAGE_JSON } from "./example-scan";
import { parsePackageJson } from "./parse-input";
import { encodeReport } from "./permalink";

/**
 * The encoded payload for the report the example package.json produces, ready
 * to pass as /report?d=.
 *
 * Built here rather than by submitting the form, so "See an example" is an
 * ordinary link: no JavaScript, no round trip, and the payoff is one click
 * from the home page instead of behind a paste. It goes through detect() and
 * encodeReport() like any real scan, so the example cannot drift into
 * claiming something the catalog would not.
 *
 * Server-side only. It reaches the whole catalog, which has no business in a
 * client bundle.
 */
function buildExampleReportPayload(): string {
  const parsed = parsePackageJson(EXAMPLE_PACKAGE_JSON);
  if (!parsed.ok) {
    throw new Error(`the example package.json does not parse: ${parsed.error}`);
  }

  const findings = detect(parsed.pkg);
  const packages = findings.flatMap((finding) =>
    finding.matched.map((match) => match.name),
  );

  if (packages.length === 0) {
    throw new Error(
      "the example package.json no longer matches any rule, so the example report would be empty",
    );
  }

  return encodeReport({ packages, projectName: "example" });
}

export const EXAMPLE_REPORT_PAYLOAD = buildExampleReportPayload();
