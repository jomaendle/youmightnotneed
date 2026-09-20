import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("the markdown 404 handler", () => {
  it("answers 404 as markdown, with the two ways out", async () => {
    const response = GET();
    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    const body = await response.text();
    expect(body).toContain("(/llms.txt)");
    expect(body).toContain("(/rules)");
  });
});
