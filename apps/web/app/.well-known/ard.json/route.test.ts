import { describe, expect, it } from "vitest";
import { buildArd } from "@/lib/ard";
import { GET as aliasGet } from "../ai-catalog.json/route";
import { GET } from "./route";

describe("the ARD routes", () => {
  it("serve the manifest as JSON", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toEqual(buildArd());
  });

  it("serve the same body at ai-catalog.json", async () => {
    expect(await aliasGet().text()).toBe(await GET().text());
  });
});
