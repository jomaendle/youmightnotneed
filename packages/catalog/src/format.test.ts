import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatConditional,
  formatHeadline,
  formatList,
} from "./format.ts";

describe("formatBytes", () => {
  it("uses bytes below a kilobyte", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(999)).toBe("999 B");
  });

  it("uses one decimal place up to 100 kB", () => {
    expect(formatBytes(1000)).toBe("1.0 kB");
    expect(formatBytes(20_076)).toBe("20.1 kB");
  });

  it("drops the decimal above 100 kB", () => {
    expect(formatBytes(142_000)).toBe("142 kB");
  });
});

describe("formatHeadline", () => {
  it("says nothing was found when nothing matched", () => {
    expect(formatHeadline(0, 0)).toBe("Nothing here the platform covers yet");
  });

  it("hedges with 'up to' rather than promising a saving", () => {
    const headline = formatHeadline(214_000, 6);
    expect(headline).toContain("Up to");
    expect(headline).toContain("214 kB");
    expect(headline).not.toMatch(/save/i);
  });

  it("falls back to a count when no size is known", () => {
    expect(formatHeadline(0, 1)).toBe(
      "1 dependency may have a native equivalent",
    );
  });

  it("pluralises correctly", () => {
    expect(formatHeadline(5000, 1)).toContain("1 dependency");
    expect(formatHeadline(5000, 2)).toContain("2 dependencies");
  });
});

describe("formatList", () => {
  it("handles each length", () => {
    expect(formatList([])).toBe("");
    expect(formatList(["a"])).toBe("a");
    expect(formatList(["a", "b"])).toBe("a and b");
    expect(formatList(["a", "b", "c"])).toBe("a, b and c");
  });
});

describe("formatConditional", () => {
  it("phrases a finding as a condition, never an instruction", () => {
    const text = formatConditional(
      ["swiper"],
      "a horizontal gallery",
      "CSS scroll-snap",
    );
    expect(text).toBe(
      "If you're using swiper for a horizontal gallery, CSS scroll-snap covers that case.",
    );
    expect(text).not.toMatch(/delete/i);
  });
});
