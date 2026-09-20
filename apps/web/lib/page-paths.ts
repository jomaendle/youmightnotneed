/**
 * Every HTML page the site serves, as a path with no trailing slash.
 *
 * proxy.ts answers an unknown path with a markdown 404 when the client asked
 * for markdown, and it cannot ask Next whether a route exists. This list is
 * how it knows. page-paths.test.ts walks app/ and fails when a page exists
 * that is not here, or the other way round, so it cannot drift silently.
 *
 * Route handlers are not listed. Their paths carry a dot (llms.txt,
 * openapi.json, agents.md, .well-known/...) or sit under api/, and the proxy
 * matcher leaves both alone. The test strips route groups such as
 * (group) and fails on any new dynamic page.
 */
export const PAGE_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/about",
  "/checks",
  "/contact",
  "/native",
  "/packages",
  "/privacy",
  "/report",
  "/rules",
  "/search",
]);

/** Pages that belong in the sitemap. /report and /search are tool entry points. */
export const SITEMAP_PATHS = [...PAGE_PATHS].filter(
  (path) => path !== "/report" && path !== "/search",
);
