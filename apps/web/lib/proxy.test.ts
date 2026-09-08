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

  it("passes an unknown id through to the handler, which 404s", () => {
    expect(rewrittenTo(proxy(request("/rules/nope.md")))).toBe(
      "/api/md/rules/nope",
    );
  });
});
