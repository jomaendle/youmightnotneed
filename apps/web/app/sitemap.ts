import { rules } from "@jomae/catalog";
import type { MetadataRoute } from "next";
import { SITEMAP_PATHS } from "@/lib/page-paths";
import { site } from "@/lib/site";

/**
 * /report and /search are excluded on purpose: without its ?d= permalink param it is an
 * empty tool entry point, not indexable content, the same reason a search
 * page's bare URL would not go in a sitemap either.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = SITEMAP_PATHS.map((path) => ({
    url: `${site.url}${path === "/" ? "" : path}`,
  }));

  const ruleRoutes = rules.map((rule) => ({
    url: `${site.url}/rules/${rule.id}`,
  }));

  return [...staticRoutes, ...ruleRoutes];
}
