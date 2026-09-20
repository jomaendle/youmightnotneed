import { rules } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { site } from "@/lib/site";
import sitemap from "./sitemap";

describe("sitemap", () => {
  const urls = sitemap().map((entry) => entry.url);

  it("lists the home page without a trailing slash", () => {
    expect(urls).toContain(site.url);
  });

  it("lists the trust pages", () => {
    for (const path of ["/about", "/privacy", "/contact"]) {
      expect(urls).toContain(`${site.url}${path}`);
    }
  });

  it("leaves out the tool entry points", () => {
    expect(urls).not.toContain(`${site.url}/report`);
    expect(urls).not.toContain(`${site.url}/search`);
  });

  it("lists every rule once", () => {
    for (const rule of rules) {
      expect(
        urls.filter((u) => u === `${site.url}/rules/${rule.id}`),
      ).toHaveLength(1);
    }
  });
});
