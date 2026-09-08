import { type NextRequest, NextResponse } from "next/server";
import { prefersMarkdown } from "@/lib/accept";

/**
 * Two ways to ask a rule page for markdown.
 *
 * `/rules/<id>.md` reads as a file, which is what an agent guesses first, and
 * `Accept: text/markdown` on the page URL is the correct way to ask. Both
 * rewrite to the same handler, so there is one renderer and one body.
 *
 * Next 16 renamed Middleware to Proxy. Same file, same behaviour.
 */
export const config = {
  matcher: "/rules/:path*",
};

const RULE_PATH = /^\/rules\/([^/]+?)(\.md)?$/;

export function proxy(request: NextRequest) {
  const match = RULE_PATH.exec(request.nextUrl.pathname);

  // /rules itself, or something nested. Nothing to negotiate.
  if (!match) return NextResponse.next();

  const id = match[1] as string;
  const url = request.nextUrl.clone();
  url.pathname = `/api/md/rules/${id}`;

  // The .md URL is one representation, not a negotiated one. It needs no
  // Vary, and it is as cacheable as the page.
  if (match[2] !== undefined) return NextResponse.rewrite(url);

  if (!prefersMarkdown(request.headers.get("accept"))) {
    return NextResponse.next();
  }

  const response = NextResponse.rewrite(url);

  // Vary is the correct signal, and it is not enough on its own here: Next
  // owns the Vary on the prerendered HTML page and replays its own value from
  // the cache entry, so the page cannot advertise that it varies. no-store
  // closes the gap that leaves. A shared cache never stores markdown under a
  // page URL, so it can never hand markdown to a browser, whatever it does
  // with Vary. What it can still do is give an agent the HTML page, which is
  // the answer it would have got by not asking, and /rules/<id>.md is the
  // URL that is never ambiguous.
  response.headers.set("Vary", "Accept");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
