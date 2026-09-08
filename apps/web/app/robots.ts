import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/md is where the markdown alias is rewritten to. It is prerendered
    // and answers a direct request, so it is kept out of an index by name as
    // well as by the noindex proxy.ts sets on the alias. /api/og stays
    // crawlable: social scrapers fetch the card.
    rules: { userAgent: "*", allow: "/", disallow: "/api/md/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
