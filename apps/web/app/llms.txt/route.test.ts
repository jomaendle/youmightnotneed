import { rules } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("llms.txt", () => {
  it("is markdown, and carries a row for every rule", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );

    const body = await response.text();
    for (const rule of rules) {
      expect(body, `${rule.id} is missing from the index`).toContain(
        `\`${rule.id}\``,
      );
    }
  });

  it("says how to fetch one rule", async () => {
    const body = await GET().text();
    expect(body).toContain("https://youmightnotneed.dev/rules/<id>.md");
  });
});
