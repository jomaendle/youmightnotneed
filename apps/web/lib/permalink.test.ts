import { describe, expect, it } from "vitest";
import { decodeReport, encodeReport, toPackageJsonLike } from "./permalink.ts";

describe("encodeReport and decodeReport", () => {
  it("round-trips packages and a label", () => {
    const encoded = encodeReport({
      packages: ["swiper", "polished"],
      projectName: "acme",
    });
    expect(decodeReport(encoded)).toEqual({
      packages: ["polished", "swiper"],
      projectName: "acme",
    });
  });

  it("sorts and de-duplicates so the same report has one URL", () => {
    const a = encodeReport({ packages: ["b", "a", "b"] });
    const b = encodeReport({ packages: ["a", "b"] });
    expect(a).toBe(b);
  });

  it("keeps the empty report, which is a real result", () => {
    expect(decodeReport(encodeReport({ packages: [] }))).toEqual({
      packages: [],
    });
  });

  it("survives a scoped package name", () => {
    const decoded = decodeReport(
      encodeReport({ packages: ["@floating-ui/react"] }),
    );
    expect(decoded?.packages).toEqual(["@floating-ui/react"]);
  });

  it("lowercases package names on the way back in", () => {
    expect(
      decodeReport(encodeReport({ packages: ["Swiper"] }))?.packages,
    ).toEqual(["swiper"]);
  });

  it("returns null for anything malformed", () => {
    for (const bad of [
      undefined,
      "",
      "garbage",
      "9.abc",
      "1",
      "1.!!!not base64!!!",
    ]) {
      expect(decodeReport(bad)).toBeNull();
    }
  });
});

describe("decodeReport treats the link as untrusted", () => {
  it("caps the label, which is shown in the header and the OG card", () => {
    const decoded = decodeReport(
      encodeReport({ packages: ["swiper"], projectName: "x".repeat(300) }),
    );
    expect(decoded?.projectName).toHaveLength(80);
  });

  it("strips control characters from the label", () => {
    const dirty = `ok${String.fromCharCode(7)}${String.fromCharCode(27)}bad`;
    const decoded = decodeReport(
      encodeReport({ packages: ["swiper"], projectName: dirty }),
    );
    expect(decoded?.projectName).toBe("okbad");
  });

  it("drops a label that is only whitespace", () => {
    const decoded = decodeReport(
      encodeReport({ packages: ["swiper"], projectName: "   " }),
    );
    expect(decoded?.projectName).toBeUndefined();
  });

  it("caps the number of packages", () => {
    const many = Array.from({ length: 500 }, (_, i) => `pkg-${i}`);
    expect(
      decodeReport(encodeReport({ packages: many }))?.packages.length,
    ).toBe(200);
  });

  it("drops a package name longer than npm allows", () => {
    const decoded = decodeReport(
      encodeReport({ packages: ["ok", "y".repeat(300)] }),
    );
    expect(decoded?.packages).toEqual(["ok"]);
  });
});

describe("toPackageJsonLike", () => {
  it("produces something detect() can read", () => {
    const pkg = toPackageJsonLike({
      packages: ["swiper"],
      projectName: "acme",
    });
    expect(pkg.name).toBe("acme");
    expect(pkg.dependencies).toEqual({ swiper: "*" });
  });
});
