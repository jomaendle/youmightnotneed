import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/md is where the markdown alias is rewritten to. A direct request
    // to it carries no noindex, because proxy.ts sets that on the alias URL
    // rather than on the handler, so this line is the only thing keeping the
    // internal path out of a crawl. Scoped to /api/md/ rather than /api/
    // because social scrapers read robots.txt and do fetch /api/og.
    rules: { userAgent: "*", allow: "/", disallow: "/api/md/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
