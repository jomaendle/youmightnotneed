import { describe, expect, it } from "vitest";
import { resolveBaseline } from "./baseline.ts";
import { resolveGuides } from "./guides.ts";
import {
  renderCatalogReference,
  renderRuleMarkdown,
  renderUseCaseTable,
  ruleMarkdownUrl,
} from "./markdown.ts";
import { rules, rulesById } from "./rules/index.ts";

/**
 * Everything under one heading, verbatim.
 *
 * Deliberately not "the lines that look like bullets": commenting the block
 * out with <!-- --> or wrapping it in a code fence leaves those lines intact,
 * so a filtered read passes while the rendered page shows nothing.
 */
function sectionBody(markdown: string, heading: string): string {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return "";
  const rest = markdown.slice(start + heading.length + 3);
  const end = rest.indexOf("\n## ");
  return (end === -1 ? rest : rest.slice(0, end)).trim();
}

describe("renderRuleMarkdown", () => {
  it("emits every unless condition, under its own heading, for every rule", () => {
    // The conditions are the reason this endpoint exists. One dropped by a
    // formatting change would turn a conditional into an instruction.
    //
    // Scoped to the section rather than searched for in the whole document:
    // a substring check passes when the whole block is commented out, moved
    // into a code fence, or filed under the wrong heading.
    for (const rule of rules) {
      const body = sectionBody(
        renderRuleMarkdown(rule),
        "Keep the dependency if any of these apply",
      );
      expect(body, rule.id).toBe(
        rule.agent.unless.map((condition) => `- ${condition}`).join("\n"),
      );
    }
  });

  it("keeps every condition on one line", () => {
    // A newline inside an unless string breaks the list into bullets that
    // read as separate conditions, and nothing else would notice.
    for (const rule of rules) {
      for (const condition of rule.agent.unless) {
        expect(condition.includes("\n"), `${rule.id}: ${condition}`).toBe(
          false,
        );
      }
    }
  });

  it("names the rule's own title, id, native and packages", () => {
    for (const rule of rules) {
      const markdown = renderRuleMarkdown(rule);
      expect(markdown.startsWith(`# ${rule.title}\n`)).toBe(true);
      expect(markdown).toContain(`\`${rule.id}\``);
      expect(markdown).toContain(rule.native);
      expect(markdown).toContain(rule.agent.when);
      expect(markdown).toContain(rule.agent.snippet);
      for (const pkg of rule.replaces) {
        expect(markdown, `${rule.id} lost ${pkg}`).toContain(`\`${pkg}\``);
      }
    }
  });

  it("carries a Baseline tier for every rule", () => {
    const tiers = /Baseline (widely available|newly available|limited)/;
    for (const rule of rules) {
      expect(renderRuleMarkdown(rule), rule.id).toMatch(tiers);
    }
  });

  it("names the feature holding a rule back, where one does", () => {
    // Live in the real catalog, and the tier regex above passes with or
    // without it, so it needs its own assertion.
    const capped = rules.filter((rule) => resolveBaseline(rule).limitedBy);
    expect(capped.length).toBeGreaterThan(0);
    for (const rule of capped) {
      const name = resolveBaseline(rule).limitedBy?.name as string;
      expect(renderRuleMarkdown(rule), rule.id).toContain(
        `(capped by ${name})`,
      );
    }
  });

  it("links guides exactly when the rule has a linkable one", () => {
    // Without this the loop below goes vacuous if the catalog ever loses its
    // guides, and a silent pass is the failure mode it exists to prevent.
    expect(
      rules.filter((rule) => resolveGuides(rule).some((g) => g.url !== null))
        .length,
    ).toBeGreaterThan(0);

    for (const rule of rules) {
      const linkable = resolveGuides(rule).filter((g) => g.url !== null);
      const markdown = renderRuleMarkdown(rule);
      const retrieval = markdown.includes("modern-web-guidance@latest");

      expect(retrieval, `${rule.id} guide section`).toBe(linkable.length > 0);
      if (linkable.length === 0) {
        expect(markdown).toContain("No guide covers this rule yet");
      }
      for (const guide of linkable) {
        expect(markdown, `${rule.id} lost ${guide.id}`).toContain(
          `[${guide.id}](${guide.url})`,
        );
      }
    }
  });

  it("drops a guide the snapshot no longer knows", () => {
    // Dead in the real catalog by design: check:freshness rejects an unknown
    // id. It becomes live the moment a guide is renamed upstream, which is
    // the case the filter exists for, so it needs a synthetic rule.
    const base = rulesById.get("dialog-element");
    if (!base) throw new Error("dialog-element is missing from the catalog");
    const renamed = { ...base, guides: ["a-guide-that-moved-upstream"] };

    const markdown = renderRuleMarkdown(renamed);
    expect(markdown).not.toContain("a-guide-that-moved-upstream");
    // And says so, rather than printing an empty heading.
    expect(markdown).toContain("No guide covers this rule yet");
  });

  it("offers every guide in one retrieval command", () => {
    // 12 rules carry more than one, and the command takes a comma-separated
    // list, so naming only the first would quietly lose the rest.
    const multi = rules.filter(
      (rule) => resolveGuides(rule).filter((g) => g.url !== null).length > 1,
    );
    expect(multi.length).toBeGreaterThan(0);

    for (const rule of multi) {
      const ids = resolveGuides(rule)
        .filter((guide) => guide.url !== null)
        .map((guide) => guide.id);
      expect(renderRuleMarkdown(rule), rule.id).toContain(ids.join(","));
      // The category tells a reader which part of the upstream guide set
      // this came from.
      for (const guide of resolveGuides(rule).filter((g) => g.url !== null)) {
        expect(renderRuleMarkdown(rule), rule.id).toContain(
          `(${guide.category})`,
        );
      }
    }
  });

  it("has no snippet that would break its own fence", () => {
    // Same argument as the table-cell guard: no rule has one today, and
    // nothing in the schema forbids it.
    for (const rule of rules) {
      expect(rule.agent.snippet, rule.id).not.toContain("```");
    }
  });

  it("attributes the guides wherever they are mentioned", () => {
    // Apache-2.0 asks for it, and this is a surface with no page chrome to
    // carry the notice instead.
    for (const rule of rules) {
      expect(renderRuleMarkdown(rule), rule.id).toContain("Apache-2.0");
    }
  });

  it("keeps the finding conditional", () => {
    const dialog = rulesById.get("dialog-element");
    if (!dialog) throw new Error("dialog-element is missing from the catalog");
    const markdown = renderRuleMarkdown(dialog);
    expect(markdown).toContain("not a verdict");
    expect(markdown).toContain("Keep the dependency if any of these apply");
  });
});

describe("renderUseCaseTable", () => {
  it("has a row for every rule", () => {
    const table = renderUseCaseTable();
    expect(table.split("\n")).toHaveLength(rules.length + 2);
    for (const rule of rules) {
      expect(table, rule.id).toContain(`| \`${rule.id}\` |`);
    }
  });

  it("is sorted by use case, in codepoint order", () => {
    // check-freshness byte-compares the generated reference, so the order is
    // load-bearing. localeCompare would pass a maintainer's machine and fail
    // CI on another ICU build.
    const cases = renderUseCaseTable()
      .split("\n")
      .slice(2)
      .map((row) => row.split(" | ")[0]?.slice(2) as string);
    expect(cases).toEqual([...cases].sort());
  });

  it("has no cell that would break the table", () => {
    // A pipe splits a column silently and a newline ends the row. No rule has
    // one today, and the schema does not forbid it.
    for (const rule of rules) {
      for (const field of [rule.title, rule.native, rule.agent.when]) {
        expect(field, `${rule.id}: ${field}`).not.toMatch(/[|\n]/);
      }
    }
  });
});

describe("renderCatalogReference", () => {
  it("counts the rules and the packages it claims to", () => {
    // check-freshness only compares this against itself, so a wrong number
    // here would be committed and pass forever.
    const reference = renderCatalogReference();
    const packages = new Set(rules.flatMap((rule) => rule.replaces)).size;
    expect(reference).toContain(
      `Every rule, ${rules.length} of them, covering ${packages} npm packages.`,
    );
  });

  it("carries both lookups, not just the counts", () => {
    // Deleting either section from the render used to pass every test here:
    // check-freshness compares this function against a file the same function
    // wrote, so it would bless an empty one.
    const reference = renderCatalogReference();
    for (const rule of rules) {
      expect(
        reference,
        `${rule.id} is missing from the use-case table`,
      ).toContain(`| \`${rule.id}\` |`);
      expect(
        reference,
        `${rule.id} is missing from the package index`,
      ).toContain(`- \`${rule.id}\`: ${rule.replaces.join(", ")}`);
    }
  });

  it("recommends a fetch that fails visibly", () => {
    // Plain curl exits 0 on a 404, so an error page reads as an answer. This
    // is the whole subject of the failure handling in SKILL.md.
    expect(renderCatalogReference()).toContain("--fail-with-body");
  });

  it("tells the reader where the conditions actually live", () => {
    // The table alone cannot answer "should this dependency go", so the file
    // has to hand off. This is the whole point of shrinking it.
    expect(renderCatalogReference()).toContain(
      "https://youmightnotneed.dev/rules/<id>.md",
    );
  });
});

describe("ruleMarkdownUrl", () => {
  it("is the .md path a rule page also answers", () => {
    expect(ruleMarkdownUrl("dialog-element")).toBe(
      "https://youmightnotneed.dev/rules/dialog-element.md",
    );
  });
});
