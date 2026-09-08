import { rulesById } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

function get(id: string) {
  return GET(new Request(`https://youmightnotneed.dev/rules/${id}.md`), {
    params: Promise.resolve({ id }),
  });
}

describe("the markdown handler", () => {
  it("serves a rule as markdown", async () => {
    const response = await get("dialog-element");
    expect(response.status).toBe(200);
    // The content type is what makes the negotiation mean anything. A curl
    // run proves it once; this fails the build when it changes.
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    const body = await response.text();
    const rule = rulesById.get("dialog-element");
    if (!rule) throw new Error("dialog-element is missing from the catalog");
    for (const condition of rule.agent.unless) {
      expect(body).toContain(condition);
    }
  });

  it("leaves the index and vary headers to the proxy", async () => {
    // noindex belongs on the .md alias, which proxy.ts sets. Setting it here
    // would put it on /rules/<id> too, and that URL is in the sitemap.
    const response = await get("dialog-element");
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
    expect(response.headers.get("Vary")).toBeNull();
  });

  it("answers an unknown id with a plain-text 404", async () => {
    const response = await get("no-such-rule");
    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    // The only recovery path an agent gets, so it is worth asserting.
    expect(await response.text()).toContain("/llms.txt");
  });
});
