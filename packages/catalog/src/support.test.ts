import { describe, expect, it } from "vitest";
import { rules } from "./rules/index.ts";
import {
  hasUnresolvedClaim,
  resolveSupportClaims,
  supportClaims,
} from "./support.ts";

/** A token the snapshot really carries, so the test moves with the catalog. */
const [knownToken] = Object.keys(supportClaims.claims);

describe("resolveSupportClaims", () => {
  it("replaces a token with the version the source data gave", () => {
    if (!knownToken) throw new Error("the snapshot is empty");
    const expected = supportClaims.claims[knownToken];
    expect(resolveSupportClaims(`Safari {{${knownToken}}} and up`)).toBe(
      `Safari ${expected} and up`,
    );
  });

  it("leaves text without tokens exactly as it was", () => {
    const text = "fetch resolves for any response the server sent.";
    expect(resolveSupportClaims(text)).toBe(text);
  });

  it("leaves an unknown token visible rather than blanking it", () => {
    // An empty string would read as finished prose. A visible {{...}} is
    // obviously broken, which is what we want if this ever slips through.
    const text = "below Safari {{safari:api.Not.Real}}";
    expect(resolveSupportClaims(text)).toBe(text);
  });

  it("replaces every occurrence, not just the first", () => {
    if (!knownToken) throw new Error("the snapshot is empty");
    const out = resolveSupportClaims(`{{${knownToken}}} and {{${knownToken}}}`);
    expect(out).not.toContain("{{");
  });
});

describe("hasUnresolvedClaim", () => {
  it("is false for plain text", () => {
    expect(hasUnresolvedClaim("no tokens here")).toBe(false);
  });

  it("is false for a token the snapshot knows", () => {
    if (!knownToken) throw new Error("the snapshot is empty");
    expect(hasUnresolvedClaim(`{{${knownToken}}}`)).toBe(false);
  });

  it("is true for a token the snapshot does not know", () => {
    expect(hasUnresolvedClaim("{{safari:api.Not.Real}}")).toBe(true);
  });
});

describe("the exported rules are resolved", () => {
  it("carries a manualBaseline note with its versions filled in", () => {
    const manual = rules.filter((rule) => rule.manualBaseline);
    expect(manual.length).toBeGreaterThan(0);
    for (const rule of manual) {
      expect(rule.manualBaseline?.note, rule.id).not.toContain("{{");
    }
  });

  it("leaves no token in any snippet", () => {
    for (const rule of rules) {
      expect(rule.human.snippet, rule.id).not.toContain("{{");
      expect(rule.agent.snippet, rule.id).not.toContain("{{");
    }
  });
});

describe("the version guard covers the phrasings that evaded it", () => {
  // Each of these shipped past the old `Browser NN` pattern. Kept as data so
  // the calibration is visible rather than buried in a regex.
  const EVASIONS = [
    "You support Safari before version 16.4 here.",
    "Firefox before 127 needs the library.",
    "It works from 13.1 onward in Safari.",
    "Not on iOS 15.4 and below.",
    "WebKit 605 lacks it.",
    "Versions below 102 of Chrome ignore it.",
  ];

  const BROWSERS =
    "Chrome|Chromium|Firefox|Safari|Edge|Opera|WebKit|Blink|Gecko|iOS|iPadOS|macOS|Android|Samsung Internet|Node|Node\\.js|Deno|Bun";
  const BROWSER_SENTENCE = new RegExp(
    `[^.!?\\n]*\\b(?:${BROWSERS})\\b[^.!?\\n]*`,
    "g",
  );
  const YEAR = /^(?:19|20)\d{2}$/;

  function versionsIn(text: string): string[] {
    const found: string[] = [];
    for (const [sentence] of text.matchAll(BROWSER_SENTENCE)) {
      for (const [number] of sentence.matchAll(/\b\d+(?:\.\d+)*\b/g)) {
        if (!number.includes(".") && YEAR.test(number)) continue;
        found.push(number);
      }
    }
    return found;
  }

  it.each(EVASIONS)("catches %s", (text) => {
    expect(versionsIn(text).length).toBeGreaterThan(0);
  });

  // Years are the only numbers that legitimately sit beside a browser name in
  // this catalog, so they are the one exemption. All four of these appear in
  // real rule prose today.
  it.each([
    "Widely available on the newer of those dates, Safari in September 2021.",
    "The tier is widely available on the method's own dates: Safari shipped in March 2022.",
    "Every engine ships field-sizing now, but Safari only at the end of 2025 and Firefox in 2026.",
    "Both have been in every browser since 2017 and in Node for as long.",
  ])("passes the year-only sentence: %s", (text) => {
    expect(versionsIn(text)).toEqual([]);
  });
});
