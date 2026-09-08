import { describe, expect, it } from "vitest";
import { resolveGuides } from "./guides.ts";
import {
  renderRuleMarkdown,
  renderUseCaseTable,
  ruleMarkdownUrl,
} from "./markdown.ts";
import { rules, rulesById } from "./rules/index.ts";

describe("renderRuleMarkdown", () => {
  it("emits every unless condition, for every rule", () => {
    // The conditions are the reason this endpoint exists. One dropped by a
    // formatting change would turn a conditional into an instruction.
    for (const rule of rules) {
      const markdown = renderRuleMarkdown(rule);
      for (const condition of rule.agent.unless) {
        expect(
          markdown.includes(`- ${condition}`),
          `${rule.id} lost a condition: ${condition}`,
        ).toBe(true);
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

  it("links guides exactly when the rule has a linkable one", () => {
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
});

describe("ruleMarkdownUrl", () => {
  it("is the .md path a rule page also answers", () => {
    expect(ruleMarkdownUrl("dialog-element")).toBe(
      "https://youmightnotneed.dev/rules/dialog-element.md",
    );
  });
});
