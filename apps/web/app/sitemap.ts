import { rules } from "@jomae/catalog";
import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * /report is excluded on purpose: without its ?d= permalink param it is an
 * empty tool entry point, not indexable content, the same reason a search
 * page's bare URL would not go in a sitemap either.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/rules", "/native"].map((path) => ({
    url: `${site.url}${path}`,
  }));

  const ruleRoutes = rules.map((rule) => ({
    url: `${site.url}/rules/${rule.id}`,
  }));

  return [...staticRoutes, ...ruleRoutes];
}
