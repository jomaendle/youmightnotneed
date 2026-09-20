import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config.ts";

const APP = resolve(import.meta.dirname, "../app");

describe("the Link header on the home page", async () => {
  const entries = (await nextConfig.headers?.()) ?? [];
  const home = entries.find((entry) => entry.source === "/");
  const value = home?.headers.find((h) => h.key === "Link")?.value ?? "";
  const links = value.split(", ");

  it("is present", () => {
    expect(links.length).toBeGreaterThan(0);
    expect(value).not.toBe("");
  });

  it.each(links)("is well formed and points at a route: %s", (link) => {
    const match = /^<(\/[^>]+)>; rel="[a-z-]+"; type="[^"]+"$/.exec(link);
    expect(match, link).not.toBeNull();
    expect(existsSync(resolve(APP, `.${match?.[1]}`, "route.ts"))).toBe(true);
  });
});
