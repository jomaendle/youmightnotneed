import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  it("cannot be closed early by a value", () => {
    const out = serializeJsonLd({ headline: "</script><img onerror=x>" });
    expect(out).not.toContain("<");
  });

  it("round-trips the original string", () => {
    const headline = "</script><!-- a < b";
    expect(JSON.parse(serializeJsonLd({ headline }))).toEqual({ headline });
  });
});
