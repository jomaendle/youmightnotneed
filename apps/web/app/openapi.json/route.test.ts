import { rules } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("openapi.json", () => {
  it("is a 3.1 document that needs no authentication", async () => {
    const doc = await GET().json();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.security).toEqual([]);
  });

  it("lists every rule id for the path parameter", async () => {
    const doc = await GET().json();
    const ids = doc.paths["/rules/{id}.md"].get.parameters[0].schema.enum;
    expect(ids).toEqual(rules.map((rule) => rule.id));
  });
});
