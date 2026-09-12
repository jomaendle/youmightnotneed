import { type NextRequest, NextResponse } from "next/server";
import { prefersMarkdown } from "@/lib/accept";

/**
 * Two ways to ask a rule page for markdown.
 *
 * `/rules/<id>.md` reads as a file, which is what an agent guesses first, and
 * `Accept: text/markdown` on the page URL is the correct way to ask. Both
 * rewrite to the same handler, so there is one renderer and one body.
 *
 * Next 16 renamed middleware.ts to proxy.ts, and a proxy always runs on the
 * Node.js runtime where middleware defaulted to the edge. Route segment
 * config is rejected in this file for that reason.
 */
export const config = {
  matcher: "/rules/:path*",
};

// The i applies to the whole pattern, not just the suffix, so this also
// matches /RULES/<id>. That is deliberate but not load-bearing: the matcher
// above is case-sensitive, so an uppercase path 404s before reaching here
// (checked against a production build). What the flag is actually for is
// /rules/<id>.MD, which is the same request as /rules/<id>.md.
const RULE_PATH = /^\/rules\/([^/]+?)(\.md)?$/i;

export function proxy(request: NextRequest) {
  const match = RULE_PATH.exec(request.nextUrl.pathname);

  // /rules itself, or something nested. Nothing to negotiate.
  if (!match) return NextResponse.next();

  const id = match[1] as string;
  const url = request.nextUrl.clone();
  url.pathname = `/api/md/rules/${id}`;

  // The .md URL is one representation, not a negotiated one. It needs no
  // Vary, and it is as cacheable as the page. noindex belongs here and only
  // here: this is the URL that duplicates the HTML page, which carries the
  // canonical. Setting it in the handler instead would stamp noindex on
  // /rules/<id> itself whenever negotiation fired, and that URL is in the
  // sitemap.
  if (match[2] !== undefined) {
    const alias = NextResponse.rewrite(url);
    alias.headers.set("X-Robots-Tag", "noindex");
    return alias;
  }

  if (!prefersMarkdown(request.headers.get("accept"))) {
    return NextResponse.next();
  }

  const response = NextResponse.rewrite(url);

  // Vary is the correct signal and it is not what makes this safe. Next owns
  // the Vary on the prerendered HTML page and replays its own value from the
  // cache entry, so the page cannot advertise that it varies, and measuring a
  // Vercel deployment shows this Accept never reaches the client either.
  //
  // Two things carry the guarantee instead. The rewrite puts the markdown
  // under its own cache key, /api/md/rules/<id>, so it is never stored as the
  // page URL, and no-store keeps any cache in front of this one from holding
  // it. The cache hits below are Vercel's own prerender cache, which sits
  // upstream of that no-store and serves the rewritten path, not this URL.
  // Checked
  // against a preview deployment on 2026-09-08 by alternating an
  // Accept: text/markdown request with a browser one, both served from the
  // same edge, both cache hits, neither answering with the other's body.
  //
  // That covers one direction only, which is the one that would break the
  // site. The other stays possible: a shared cache that stored the HTML page
  // can hand it to an agent that asked for markdown, because the page is
  // cacheable and cannot say it varies. Such an agent gets the answer it
  // would have got by not asking, and /rules/<id>.md is the URL that is
  // never ambiguous. That is why the alias exists.
  response.headers.set("Vary", "Accept");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
