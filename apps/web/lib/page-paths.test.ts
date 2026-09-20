import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_PATHS, SITEMAP_PATHS } from "./page-paths";

const APP = resolve(import.meta.dirname, "../app");

const PAGE_FILE = /^page\.(tsx|ts|jsx|js|mdx)$/;

/** Dynamic routes the proxy handles itself, so PAGE_PATHS need not list them. */
const DYNAMIC_PAGES = ["/rules/[id]"];

/** Every page under app/, with route groups stripped from the path. */
function pagesUnder(dir: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) {
      if (PAGE_FILE.test(name)) found.push(prefix || "/");
      continue;
    }
    if (name.includes(".")) continue;
    const isGroup = name.startsWith("(") && name.endsWith(")");
    found.push(...pagesUnder(full, isGroup ? prefix : `${prefix}/${name}`));
  }
  return found;
}

describe("PAGE_PATHS", () => {
  it("is exactly the static pages under app/", () => {
    const pages = pagesUnder(APP);
    const dynamic = pages.filter((path) => path.includes("["));
    // A new dynamic page would get markdown 404s until someone decides how
    // the proxy should treat it, so it fails here rather than in production.
    expect(dynamic.sort()).toEqual(DYNAMIC_PAGES);
    expect([...PAGE_PATHS].sort()).toEqual(
      pages.filter((path) => !path.includes("[")).sort(),
    );
  });

  it("keeps the tool entry points out of the sitemap", () => {
    expect(SITEMAP_PATHS).not.toContain("/report");
    expect(SITEMAP_PATHS).not.toContain("/search");
    expect(SITEMAP_PATHS).toContain("/about");
  });
});
