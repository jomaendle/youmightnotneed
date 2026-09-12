import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "../proxy";

function request(path: string, accept?: string) {
  return new NextRequest(`https://youmightnotneed.dev${path}`, {
    headers: accept === undefined ? undefined : { accept },
  });
}

/** Where the proxy sent it, or null when it passed the request through. */
function rewrittenTo(response: Response): string | null {
  const target = response.headers.get("x-middleware-rewrite");
  return target === null ? null : new URL(target).pathname;
}

describe("proxy", () => {
  it("serves the page to a browser", () => {
    const response = proxy(
      request(
        "/rules/dialog-element",
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ),
    );
    expect(rewrittenTo(response)).toBeNull();
  });

  it("serves the page when nothing said otherwise", () => {
    expect(rewrittenTo(proxy(request("/rules/dialog-element")))).toBeNull();
    expect(rewrittenTo(proxy(request("/rules")))).toBeNull();
  });

  it("rewrites the .md URL to the markdown handler", () => {
    const response = proxy(request("/rules/dialog-element.md"));
    expect(rewrittenTo(response)).toBe("/api/md/rules/dialog-element");
  });

  it("treats the suffix as case-insensitive", () => {
    expect(rewrittenTo(proxy(request("/rules/dialog-element.MD")))).toBe(
      "/api/md/rules/dialog-element",
    );
  });

  it("would take an uppercase path, which the matcher never sends it", () => {
    // Pinning what the regex does rather than what the comment wishes it did:
    // the i flag covers the whole pattern. /RULES/<id> 404s in a real build
    // because config.matcher is case-sensitive, so this never runs.
    expect(rewrittenTo(proxy(request("/RULES/dialog-element.md")))).toBe(
      "/api/md/rules/dialog-element",
    );
  });

  it("keeps noindex on the alias and off the canonical URL", () => {
    // /rules/<id> is in the sitemap. noindex on the alias stops two indexable
    // copies of every rule; noindex on the negotiated response would
    // de-index the page itself for any crawler that asks for markdown.
    expect(
      proxy(request("/rules/dialog-element.md")).headers.get("X-Robots-Tag"),
    ).toBe("noindex");
    expect(
      proxy(request("/rules/dialog-element", "text/markdown")).headers.get(
        "X-Robots-Tag",
      ),
    ).toBeNull();
  });

  it("rewrites when the request asks for markdown", () => {
    const response = proxy(request("/rules/dialog-element", "text/markdown"));
    expect(rewrittenTo(response)).toBe("/api/md/rules/dialog-element");
  });

  it("makes the negotiated response uncacheable, and says it varies", () => {
    // The one thing here that breaks the site rather than a feature. Next
    // owns the Vary on the prerendered HTML page and replays its own value,
    // so Vary alone cannot keep a cache from serving markdown to a browser.
    // no-store means no shared cache ever holds markdown under a page URL.
    const response = proxy(request("/rules/dialog-element", "text/markdown"));
    expect(response.headers.get("Vary")).toBe("Accept");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("leaves the .md URL cacheable, because it never negotiated", () => {
    const response = proxy(request("/rules/dialog-element.md"));
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(response.headers.get("Vary")).toBeNull();
  });

  it("leaves nested and trailing-slash paths alone", () => {
    expect(rewrittenTo(proxy(request("/rules/a/b")))).toBeNull();
    expect(rewrittenTo(proxy(request("/rules/dialog-element/")))).toBeNull();
  });

  it("cannot be walked out of the rules prefix", () => {
    // The safety is NextURL's, not this regex's, so it is worth pinning.
    expect(rewrittenTo(proxy(request("/rules/..%2f..%2fadmin.md")))).toBe(
      "/api/md/rules/..%2f..%2fadmin",
    );
  });

  it("passes an unknown id through to the handler, which 404s", () => {
    expect(rewrittenTo(proxy(request("/rules/nope.md")))).toBe(
      "/api/md/rules/nope",
    );
  });
});
