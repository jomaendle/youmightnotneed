import { renderRuleMarkdown, rules } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("llms-full.txt", () => {
  it("is markdown, cacheable at the edge, and carries the count", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=0, s-maxage=3600",
    );
    expect(await response.text()).toContain(`${rules.length} rules.`);
  });

  it("is the same text as each per-rule markdown, conditions included", async () => {
    const body = await GET().text();
    for (const rule of rules) {
      expect(body, `${rule.id} differs from its own page`).toContain(
        renderRuleMarkdown(rule),
      );
    }
  });
});
