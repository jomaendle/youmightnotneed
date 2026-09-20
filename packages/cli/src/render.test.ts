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

describe("renderReport with a --since window", () => {
  function sinceRender(
    pkg: Parameters<typeof analyze>[0],
    since: { date: string; earlier: number; undated: number },
  ) {
    const report = analyze(pkg);
    return renderReport(report, {
      palette: createPalette(false),
      projectName: "test-project",
      provenance,
      verbose: false,
      since,
    });
  }

  it("names the window under the headline", () => {
    const output = sinceRender(
      { dependencies: { axios: "^1.6.0" } },
      { date: "2020-01-01", earlier: 0, undated: 0 },
    );
    expect(output).toContain("on or after 2020-01-01");
  });

  it("accounts for findings held back, in the plural", () => {
    const output = sinceRender(
      { dependencies: { axios: "^1.6.0" } },
      { date: "2020-01-01", earlier: 3, undated: 2 },
    );
    expect(output).toContain("5 other findings are outside this view");
    expect(output).toContain("3 reached their current status earlier");
    expect(output).toContain("2 have no crossing date");
  });

  it("uses the singular when exactly one finding is held back", () => {
    const output = sinceRender(
      { dependencies: { axios: "^1.6.0" } },
      { date: "2020-01-01", earlier: 1, undated: 0 },
    );
    expect(output).toContain("1 other finding is outside this view");
    expect(output).toContain("1 reached its current status earlier");
  });

  it("names only the undated bucket when nothing crossed earlier", () => {
    const output = sinceRender(
      { dependencies: { axios: "^1.6.0" } },
      { date: "2020-01-01", earlier: 0, undated: 4 },
    );
    expect(output).toContain("4 have no crossing date");
    expect(output).not.toContain("current status earlier");
  });

  // A window that happens to cover everything held nothing back, so a
  // sentence about zero other findings would be noise.
  it("says nothing about other findings when none were held back", () => {
    const output = sinceRender(
      { dependencies: { axios: "^1.6.0" } },
      { date: "2020-01-01", earlier: 0, undated: 0 },
    );
    expect(output).not.toContain("outside this view");
  });

  // An empty window is a different answer from "the catalog has no rule for
  // this", and giving the latter would misstate the catalog's coverage.
  it("distinguishes an empty window from an uncovered project", () => {
    const output = renderReport(
      { findings: [], summary: analyze({}).summary },
      {
        palette: createPalette(false),
        projectName: "test-project",
        provenance,
        verbose: false,
        since: { date: "2099-01-01", earlier: 6, undated: 2 },
      },
    );
    expect(output).toContain("on or after 2099-01-01");
    expect(output).not.toContain("no native equivalent in the catalog");
    expect(output).toContain("8 other findings are outside this view");
  });

  it("falls back to the coverage note when an empty window held nothing back", () => {
    const output = renderReport(
      { findings: [], summary: analyze({}).summary },
      {
        palette: createPalette(false),
        projectName: "test-project",
        provenance,
        verbose: false,
        since: { date: "2099-01-01", earlier: 0, undated: 0 },
      },
    );
    expect(output).toContain("The catalog only covers cases");
  });

  it("still says the catalog has no rule for an unmatched single package", () => {
    const output = renderReport(
      { findings: [], summary: analyze({}).summary },
      {
        palette: createPalette(false),
        projectName: "left-pad",
        subject: "package",
        provenance,
        verbose: false,
      },
    );
    expect(output).toContain("The catalog has no rule for left-pad");
  });
});

describe("renderJson carries the crossing date", () => {
  it("includes the since block only when a window was applied", () => {
    const report = analyze({ dependencies: { axios: "^1.6.0" } });
    const withWindow = JSON.parse(
      renderJson(report, provenance, {
        date: "2020-01-01",
        earlier: 2,
        undated: 1,
      }),
    ) as { since?: { date: string; earlier: number; undated: number } };
    const without = JSON.parse(renderJson(report, provenance)) as {
      since?: unknown;
    };

    expect(withWindow.since).toEqual({
      date: "2020-01-01",
      earlier: 2,
      undated: 1,
    });
    expect(without.since).toBeUndefined();
  });

  it("puts a date on every finding regardless of the window", () => {
    const parsed = JSON.parse(
      renderJson(analyze({ dependencies: { axios: "^1.6.0" } }), provenance),
    ) as { findings: Array<{ baseline: { since: string | null } }> };

    expect(parsed.findings[0]?.baseline.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("an empty --since view does not overclaim", () => {
  const empty = (since: { date: string; earlier: number; undated: number }) =>
    renderReport(
      { findings: [], summary: analyze({}).summary },
      {
        palette: createPalette(false),
        projectName: "left-pad",
        subject: "package",
        provenance,
        verbose: false,
        since,
      },
    );

  // Saying "nothing reached that status" implies a rule exists and crossed
  // earlier. For a package the catalog has no rule for, that is a different
  // and wrong answer, and the window did no filtering to speak of.
  it("says the catalog has no rule when the window held nothing back", () => {
    const output = empty({ date: "2026-01-01", earlier: 0, undated: 0 });

    expect(output).toContain("The catalog has no rule for left-pad");
    expect(output).not.toContain("reached its current Baseline status");
  });

  it("blames the window only when the window actually excluded something", () => {
    const output = empty({ date: "2026-01-01", earlier: 3, undated: 0 });

    expect(output).toContain("on or after 2026-01-01");
    expect(output).not.toContain("The catalog has no rule");
  });

  it("uses the singular for a single undated finding", () => {
    const output = empty({ date: "2026-01-01", earlier: 0, undated: 1 });

    expect(output).toContain("1 has no crossing date");
  });
});
