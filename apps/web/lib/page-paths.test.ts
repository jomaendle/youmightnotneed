import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_PATHS, SITEMAP_PATHS } from "./page-paths";

const APP = resolve(import.meta.dirname, "../app");

/** Paths of every page.tsx under app/, skipping dynamic segments and dotted dirs. */
function pagesUnder(dir: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) {
      if (name === "page.tsx") found.push(prefix || "/");
      continue;
    }
    if (name.startsWith("[") || name.includes(".")) continue;
    found.push(...pagesUnder(full, `${prefix}/${name}`));
  }
  return found;
}

describe("PAGE_PATHS", () => {
  it("is exactly the static pages under app/", () => {
    expect([...PAGE_PATHS].sort()).toEqual(pagesUnder(APP).sort());
  });

  it("keeps the tool entry points out of the sitemap", () => {
    expect(SITEMAP_PATHS).not.toContain("/report");
    expect(SITEMAP_PATHS).not.toContain("/search");
    expect(SITEMAP_PATHS).toContain("/about");
  });
});
