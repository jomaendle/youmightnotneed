import { detect } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { EXAMPLE_REPORT_PAYLOAD } from "./example-report";
import { EXAMPLE_PACKAGE_JSON } from "./example-scan";
import { parsePackageJson } from "./parse-input";
import { decodeReport } from "./permalink";

/*
 * The example is the first thing a stranger clicks, so an example that has
 * quietly stopped matching the catalog is a worse first impression than no
 * example at all. These are the assertions that fail the build instead.
 */
describe("the example report", () => {
  const parsed = parsePackageJson(EXAMPLE_PACKAGE_JSON);

  it("parses", () => {
    expect(parsed.ok).toBe(true);
  });

  it("still matches rules in the catalog", () => {
    if (!parsed.ok) throw new Error("unreachable");
    expect(detect(parsed.pkg).length).toBeGreaterThan(0);
  });

  it("decodes back to the packages it encoded", () => {
    const payload = decodeReport(EXAMPLE_REPORT_PAYLOAD);
    expect(payload).not.toBeNull();
    expect(payload?.packages.length).toBeGreaterThan(0);
  });

  it("shows more than one rule, or it undersells the point", () => {
    if (!parsed.ok) throw new Error("unreachable");
    expect(detect(parsed.pkg).length).toBeGreaterThan(1);
  });

  it("survives a round trip through the URL", () => {
    const query = new URLSearchParams({ d: EXAMPLE_REPORT_PAYLOAD });
    expect(
      decodeReport(new URLSearchParams(query.toString()).get("d") ?? undefined),
    ).not.toBeNull();
  });
});
