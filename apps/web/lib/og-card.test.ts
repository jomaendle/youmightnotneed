import { rules, rulesById } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import {
  MAX_NATIVE_CHARS,
  MAX_PACKAGES_CHARS,
  MAX_PACKAGES_SHOWN,
  ruleCardText,
} from "./og-card";

/*
 * Satori gives no overflow signal. A card whose text is too long for the
 * frame is silently clipped, or pushes the tier line off the bottom, and the
 * first anyone knows about it is a broken preview in someone else's timeline.
 * These budgets fail the build instead.
 */
describe("rule share cards", () => {
  it("has a card for every rule", () => {
    for (const rule of rules) {
      const card = ruleCardText(rule);
      expect(card.native, rule.id).toBe(rule.native);
      expect(card.title, rule.id).toBe(rule.title);
    }
  });

  it("keeps every native string inside the headline budget", () => {
    for (const rule of rules) {
      expect(
        ruleCardText(rule).native.length,
        `${rule.id} native is too long for the card`,
      ).toBeLessThanOrEqual(MAX_NATIVE_CHARS);
    }
  });

  it("keeps every packages line inside its budget", () => {
    for (const rule of rules) {
      expect(
        ruleCardText(rule).packages.length,
        `${rule.id} packages line is too long for the card`,
      ).toBeLessThanOrEqual(MAX_PACKAGES_CHARS);
    }
  });

  it("names a real support tier for every rule, never a raw status", () => {
    for (const rule of rules) {
      const { tierLabel } = ruleCardText(rule);
      expect(tierLabel, rule.id).not.toBe("");
      expect(tierLabel, rule.id).not.toBe(ruleCardText(rule).status);
    }
  });

  it("truncates a long package list and counts the rest", () => {
    const carousel = rulesById.get("carousel-scroll-markers");
    if (!carousel) throw new Error("expected the carousel rule to exist");
    expect(carousel.replaces.length).toBeGreaterThan(MAX_PACKAGES_SHOWN);

    const { packages } = ruleCardText(carousel);
    expect(packages).toContain(carousel.replaces[0] as string);
    expect(packages).toMatch(/ and \d+ more$/);
  });

  it("lists a short package list in full, with no count", () => {
    const short = rules.find(
      (rule) => rule.replaces.length <= MAX_PACKAGES_SHOWN,
    );
    if (!short) throw new Error("expected a rule with few packages");
    expect(ruleCardText(short).packages).not.toMatch(/ and \d+ more$/);
  });

  it("hedges the size, or omits it when nothing is measured", () => {
    for (const rule of rules) {
      const { size } = ruleCardText(rule);
      if (size !== null) expect(size, rule.id).toMatch(/^up to /);
    }
  });
});
