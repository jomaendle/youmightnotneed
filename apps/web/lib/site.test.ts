import { ruleMarkdownUrl } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { site } from "./site";

describe("the domain", () => {
  it("is the same one the catalog hands to agents", () => {
    // The catalog ships to npm and cannot import site.ts, so it writes the
    // origin down a second time. Changing one and not the other would send
    // every agent reading the skill to a dead host, and nothing else here
    // would notice.
    expect(ruleMarkdownUrl("dialog-element")).toBe(
      `${site.url}/rules/dialog-element.md`,
    );
  });
});
