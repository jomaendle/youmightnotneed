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

  it("reads the q parameter whatever its case", () => {
    // RFC 9110 makes parameter names case-insensitive. Missing an uppercase
    // Q meant falling back to "no q given", which is maximum preference, so
    // `Q=0` read as "preferred" when it means "not acceptable".
    expect(prefersMarkdown("text/markdown;Q=0.1, text/html;q=0.9")).toBe(false);
    expect(prefersMarkdown("text/markdown;Q=0")).toBe(false);
    expect(prefersMarkdown("text/markdown;Q=0.9, text/html;q=0.5")).toBe(true);
  });

  it("clamps a q above 1 rather than letting it outrank", () => {
    expect(prefersMarkdown("text/markdown;q=5, text/html")).toBe(false);
  });

  it("treats a q it cannot read as unacceptable, not as preferred", () => {
    // Every one of these says "I barely want markdown, I strongly want HTML".
    // Falling back to "no q given" would read each as maximum preference and
    // serve markdown, which is the inverse of what was asked.
    expect(prefersMarkdown("text/markdown;Q = 0.1, text/html;q=0.9")).toBe(
      false,
    );
    expect(prefersMarkdown("text/markdown;q=1e-3, text/html;q=0.9")).toBe(
      false,
    );
    expect(prefersMarkdown("text/markdown;q=, text/html;q=0.9")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=high, text/html;q=0.9")).toBe(
      false,
    );
  });

  it("refuses to negotiate when the bad q is on text/html", () => {
    // The mirror of the case above. Zeroing the type the unreadable q sits on
    // would hand the decision to the other type, so a client that plainly
    // wants the page would be served markdown.
    expect(prefersMarkdown("text/html;q=1e0, text/markdown;q=0.1")).toBe(false);
    expect(prefersMarkdown("text/html;q=, text/markdown;q=0.1")).toBe(false);
    expect(prefersMarkdown("text/html;q=high, text/markdown;q=0.9")).toBe(
      false,
    );
  });

  it("still reads a q written with spaces around the equals", () => {
    expect(prefersMarkdown("text/markdown;Q = 0.9, text/html;q=0.1")).toBe(
      true,
    );
  });

  it("takes the highest q when a type is listed twice", () => {
    expect(
      prefersMarkdown(
        "text/markdown;q=0.1, text/markdown;q=0.9, text/html;q=0.5",
      ),
    ).toBe(true);
    expect(
      prefersMarkdown("text/html;q=0.1, text/html;q=0.9, text/markdown;q=0.5"),
    ).toBe(false);
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
    // What a GFM-aware client sends.
    expect(prefersMarkdown("text/markdown;variant=GFM")).toBe(true);
    // A different media type, not a parameter on ours.
    expect(prefersMarkdown("text/x-markdown")).toBe(false);
    expect(
      prefersMarkdown("text/html;charset=utf-8, text/markdown;q=0.9"),
    ).toBe(false);
  });
});
