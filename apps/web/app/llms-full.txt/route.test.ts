import { rules } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("llms-full.txt", () => {
  it("is markdown and carries every rule", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    const body = await response.text();
    for (const rule of rules) {
      expect(body, `${rule.id} is missing`).toContain(rule.title);
    }
  });
});
