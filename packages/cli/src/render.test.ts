import { analyze, rules } from "@jomae/catalog";
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

describe("guide references", () => {
  it("lists the long-form guides in verbose mode", () => {
    const output = render({ dependencies: { swiper: "^11.0.0" } }, true);
    expect(output).toContain("guides");
    expect(output).toContain("carousel-snap-highlights");
    expect(output).toContain("modern-web-guidance");
  });

  it("keeps them out of the short output", () => {
    const output = render({ dependencies: { swiper: "^11.0.0" } }, false);
    expect(output).not.toContain("carousel-snap-highlights");
  });

  it("puts the guide URLs in --json", () => {
    const parsed = JSON.parse(
      renderJson(analyze({ dependencies: { swiper: "^11.0.0" } })),
    ) as {
      findings: { guides: { id: string; category: string; url: string }[] }[];
    };
    const guides = parsed.findings[0]?.guides ?? [];
    expect(guides.length).toBeGreaterThan(0);
    expect(guides[0]?.url).toMatch(/^https:\/\//);
    expect(guides[0]?.category).not.toBe("");
  });
});

describe("a single --package lookup", () => {
  it("names the package when the catalog has no rule for it", () => {
    const output = renderReport(
      analyze({ dependencies: { lodash: "^4.0.0" } }),
      {
        palette: createPalette(false),
        projectName: "lodash",
        subject: "package",
        provenance,
        verbose: true,
      },
    );
    expect(output).toContain("The catalog has no rule for lodash.");
    expect(output).not.toContain("Nothing in this package.json");
  });

  it("falls back to a generic noun when the name is missing", () => {
    const output = renderReport(
      analyze({ dependencies: { lodash: "^4.0.0" } }),
      {
        palette: createPalette(false),
        subject: "package",
        provenance,
        verbose: true,
      },
    );
    expect(output).toContain("no rule for that package");
  });
});

describe("condition count grammar", () => {
  it("agrees in number for a single condition", () => {
    const template = rules[0];
    if (!template) throw new Error("the catalog is empty");
    const rule = {
      ...template,
      id: "one-condition",
      replaces: ["swiper"],
      agent: {
        ...template.agent,
        unless: ["A single reason to keep it here."],
      },
    };

    const output = renderReport(
      analyze({ dependencies: { swiper: "^11.0.0" } }, { rules: [rule] }),
      { palette: createPalette(false), provenance, verbose: false },
    );
    expect(output).toContain("keep it if 1 condition applies");
    expect(output).not.toContain("1 condition apply,");
  });

  it("agrees in number for several", () => {
    const output = renderReport(
      analyze({ dependencies: { swiper: "^11.0.0" } }),
      {
        palette: createPalette(false),
        provenance,
        verbose: false,
      },
    );
    expect(output).toMatch(/keep it if \d+ conditions apply/);
  });
});

describe("--json carries what the other surfaces carry", () => {
  it("includes the rule category, as the MCP server does", () => {
    const parsed = JSON.parse(
      renderJson(analyze({ dependencies: { swiper: "^11.0.0" } })),
    ) as { findings: { category: string }[] };
    expect(parsed.findings[0]?.category).toBe("scrolling");
  });
});
