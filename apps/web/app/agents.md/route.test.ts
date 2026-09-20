import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const WEB = resolve(import.meta.dirname, "../..");

describe("agents.md", () => {
  it("is markdown", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(await response.text()).toContain("`unless`");
  });

  it("only links URLs this site serves", async () => {
    const body = await GET().text();
    const urls = [
      ...body.matchAll(/https:\/\/youmightnotneed\.dev(\/[^\s):]*)/g),
    ]
      .map((match) => (match[1] as string).replace(/[.,]+$/, ""))
      .filter((path) => !path.includes("<"));
    expect(urls.length).toBeGreaterThan(0);
    for (const path of urls) {
      const served =
        existsSync(join(WEB, "app", path, "route.ts")) ||
        existsSync(join(WEB, "public", path));
      expect(served, path).toBe(true);
    }
  });
});
