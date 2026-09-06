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
