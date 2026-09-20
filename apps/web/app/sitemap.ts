import { rules } from "@jomae/catalog";
import type { MetadataRoute } from "next";
import { SITEMAP_PATHS } from "@/lib/page-paths";
import { site } from "@/lib/site";

/**
 * /report (without ?d=) and /search are bare tool entry points, not
 * indexable content, so they stay out of the sitemap.
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
