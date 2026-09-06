import { describe, expect, it } from "vitest";
import { rules, rulesByPackage } from "./rules/index.ts";
import type { Rule } from "./schema.ts";
import { searchRules } from "./search.ts";

const testRules: Rule[] = [
  {
    id: "test-dialog",
    title: "Dialogs",
    category: "forms",
    replaces: ["react-modal", "a11y-dialog"],
    featureIds: ["dialog"],
    native: "<dialog>",
    human: { explainer: "Prose.", snippet: "<dialog></dialog>" },
    agent: { when: "a modal", unless: ["Click outside."], snippet: "x" },
  },
  {
    id: "test-carousel",
    title: "Carousels",
    category: "scrolling",
    replaces: ["swiper", "vue-awesome-swiper"],
    featureIds: ["scroll-buttons"],
    native: "::scroll-button()",
    human: { explainer: "Prose.", snippet: ".c {}" },
    agent: { when: "a gallery", unless: ["Autoplay."], snippet: "x" },
  },
];

const opts = { rules: testRules };

/** Adds a rule whose title, not its packages, carries the word "modal". */
const withModalTitle: Rule[] = [
  ...testRules,
  {
    id: "test-modal-sheets",
    title: "Modal bottom sheets",
    category: "forms",
    replaces: ["react-spring-bottom-sheet"],
    featureIds: ["dialog"],
    native: "<dialog>",
    human: { explainer: "Prose.", snippet: "<dialog></dialog>" },
    agent: { when: "a sheet", unless: ["Drag to dismiss."], snippet: "x" },
  },
];

describe("searchRules", () => {
  it("finds a rule by an exact package name", () => {
    const results = searchRules("react-modal", opts);
    expect(results).toHaveLength(1);
    expect(results[0]?.rule.id).toBe("test-dialog");
    expect(results[0]?.packages).toEqual(["react-modal"]);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(searchRules("  React-Modal ", opts)[0]?.rule.id).toBe("test-dialog");
  });

  it("matches a package name by prefix and lists every package it hit", () => {
    const results = searchRules("swiper", opts);
    expect(results).toHaveLength(1);
    expect(results[0]?.packages).toEqual(["swiper", "vue-awesome-swiper"]);
  });

  it("matches inside a package name, not only at the start", () => {
    expect(searchRules("awesome", opts)[0]?.rule.id).toBe("test-carousel");
  });

  it("matches a rule title", () => {
    const results = searchRules("dialogs", opts);
    expect(results[0]?.rule.id).toBe("test-dialog");
    expect(results[0]?.packages).toEqual([]);
  });

  it("matches the native feature", () => {
    expect(searchRules("scroll-button", opts)[0]?.rule.id).toBe(
      "test-carousel",
    );
  });

  it("returns nothing for a query no rule covers", () => {
    expect(searchRules("zustand", opts)).toEqual([]);
  });

  it("returns nothing for a query too short to mean anything", () => {
    expect(searchRules("s", opts)).toEqual([]);
    expect(searchRules("   ", opts)).toEqual([]);
    expect(searchRules("", opts)).toEqual([]);
  });

  /*
   * The ranking exists so that typing a package name you already have
   * installed puts its own rule first. A substring hit in another rule's
   * package list must never outrank it, so this asserts the property over
   * every package in the real catalog rather than one hand-picked pair.
   */
  it("ranks the exact package match first, for every package in the catalog", () => {
    for (const [name, rule] of rulesByPackage) {
      const first = searchRules(name)[0];
      expect(first?.rule.id, `searching for ${name}`).toBe(rule.id);
      expect(first?.packages, `searching for ${name}`).toContain(name);
    }
  });

  it("reaches every rule in the catalog by one of its own package names", () => {
    for (const rule of rules) {
      const name = rule.replaces[0] as string;
      expect(
        searchRules(name).some((result) => result.rule.id === rule.id),
        `${rule.id} is unreachable by searching for ${name}`,
      ).toBe(true);
    }
  });

  it("puts a package match above a rule that only matches by title", () => {
    // "modal" is a package of test-dialog and the title of test-modal-sheets.
    // Someone typing it has the package installed far more often than they
    // are browsing by name, so the package match leads.
    const results = searchRules("modal", { rules: withModalTitle });
    expect(results.map((result) => result.rule.id)).toEqual([
      "test-dialog",
      "test-modal-sheets",
    ]);
  });

  it("returns a rule once however many of its fields match", () => {
    // "dialog" hits a11y-dialog, the title "Dialogs" and the native <dialog>.
    const results = searchRules("dialog", opts);
    expect(
      results.filter((result) => result.rule.id === "test-dialog"),
    ).toHaveLength(1);
  });
});
