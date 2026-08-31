import { analyze } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { createPalette } from "./colors.ts";
import { renderJson, renderReport } from "./render.ts";

const provenance = {
  baselineOn: "2026-08-31",
  webFeaturesVersion: "3.36.0",
  sizesOn: "2026-08-31",
};

function render(pkg: Parameters<typeof analyze>[0], verbose = true) {
  return renderReport(analyze(pkg), {
    palette: createPalette(false),
    projectName: "test-project",
    provenance,
    verbose,
  });
}

describe("renderReport", () => {
  it("says so plainly when nothing matched", () => {
    const output = render({ dependencies: { lodash: "^4.0.0" } });
    expect(output).toContain("Nothing in this package.json");
    expect(output).not.toContain("Up to");
  });

  it("leads with an 'up to' headline and never promises a saving", () => {
    const output = render({ dependencies: { swiper: "^11.0.0" } });
    expect(output).toContain("Up to");
    expect(output).not.toMatch(/you will save/i);
    expect(output).not.toMatch(/\bdelete\b/i);
  });

  it("groups findings under their support tier", () => {
    const output = render({
      dependencies: { "react-modal": "^3.0.0", swiper: "^11.0.0" },
    });
    expect(output).toContain("Baseline widely available");
    expect(output).toContain("Limited availability");
    // The safe tier is listed before the risky one.
    expect(output.indexOf("Baseline widely available")).toBeLessThan(
      output.indexOf("Limited availability"),
    );
  });

  it("always shows the conditions in verbose mode", () => {
    const output = render({ dependencies: { swiper: "^11.0.0" } }, true);
    expect(output).toContain("keep it if");
    expect(output).toContain("Safari");
  });

  it("still signposts the conditions when not verbose", () => {
    const output = render({ dependencies: { swiper: "^11.0.0" } }, false);
    expect(output).toMatch(/keep it if \d+ conditions? apply/);
  });

  it("names the feature that caps a multi-feature rule", () => {
    const output = render({
      dependencies: { "@floating-ui/react": "^0.26.0" },
    });
    expect(output).toContain("capped by");
  });

  it("cites where its data came from", () => {
    const output = render({ dependencies: { swiper: "^11.0.0" } });
    expect(output).toContain("web-features@3.36.0");
    expect(output).toContain("bundlephobia");
  });

  it("emits no ANSI codes when colour is disabled", () => {
    const output = render({ dependencies: { swiper: "^11.0.0" } });
    expect(output).not.toContain(String.fromCharCode(27));
  });

  it("emits ANSI codes when colour is enabled", () => {
    const output = renderReport(
      analyze({ dependencies: { swiper: "^11.0.0" } }),
      {
        palette: createPalette(true),
        provenance,
        verbose: false,
      },
    );
    expect(output).toContain(String.fromCharCode(27));
  });
});

describe("renderJson", () => {
  it("emits valid JSON carrying the unless conditions", () => {
    const parsed = JSON.parse(
      renderJson(analyze({ dependencies: { swiper: "^11.0.0" } })),
    ) as {
      summary: { replaceableBytes: number };
      findings: {
        ruleId: string;
        unless: string[];
        baseline: { status: string };
      }[];
    };
    expect(parsed.summary.replaceableBytes).toBeGreaterThan(0);
    expect(parsed.findings[0]?.ruleId).toBe("carousel-scroll-markers");
    expect(parsed.findings[0]?.unless.length).toBeGreaterThan(0);
    expect(parsed.findings[0]?.baseline.status).toBe("limited");
  });
});

describe("unmeasured packages", () => {
  it("says the real figure is higher when a size is missing", () => {
    // sticky-kit is a real package the catalog covers, but it is old enough
    // that bundlephobia cannot build it, so it has no measurement.
    const output = render({
      dependencies: { "sticky-kit": "^1.1.3", "react-modal": "^3.16.1" },
    });
    expect(output).toContain("the real figure is higher");
  });

  it("prints 'size unknown' rather than 0 kB for an unmeasured rule", () => {
    const output = render({ dependencies: { "sticky-kit": "^1.1.3" } });
    expect(output).toContain("size unknown");
    expect(output).not.toContain("0 B");
  });
});
