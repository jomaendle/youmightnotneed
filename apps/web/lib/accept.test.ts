import { describe, expect, it } from "vitest";
import { prefersMarkdown } from "./accept";

describe("prefersMarkdown", () => {
  it("serves HTML to a browser", () => {
    // The regression that matters. This is Chrome's header, and the `*/*`
    // in it must not read as a request for markdown.
    expect(
      prefersMarkdown(
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      ),
    ).toBe(false);
    expect(prefersMarkdown("text/html")).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
    expect(prefersMarkdown("text/*")).toBe(false);
  });

  it("serves markdown when it is asked for by name", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, */*;q=0.1")).toBe(true);
    expect(prefersMarkdown("text/markdown;q=0.9, text/html;q=0.8")).toBe(true);
    expect(prefersMarkdown("TEXT/MARKDOWN")).toBe(true);
  });

  it("keeps HTML when the client ranks it higher", () => {
    expect(prefersMarkdown("text/markdown;q=0.5, text/html;q=0.9")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0.8, text/html")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0.8, text/html;q=0.8")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0")).toBe(false);
  });

  it("treats a missing or unparseable header as a browser", () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown("")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=bogus, text/html")).toBe(false);
    expect(prefersMarkdown(",,")).toBe(false);
  });

  it("ignores parameters that are not q", () => {
    expect(prefersMarkdown("text/markdown;charset=utf-8")).toBe(true);
    expect(
      prefersMarkdown("text/html;charset=utf-8, text/markdown;q=0.9"),
    ).toBe(false);
  });
});
