import { rules, rulesByPackage } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { ALL_PACKAGES, groupByInitial } from "./packages";

describe("ALL_PACKAGES", () => {
  it("covers every package the catalog claims, once each", () => {
    expect(ALL_PACKAGES).toHaveLength(rulesByPackage.size);
    expect(new Set(ALL_PACKAGES.map((entry) => entry.name)).size).toBe(
      ALL_PACKAGES.length,
    );
  });

  it("accounts for every package name in every rule", () => {
    const listed = new Set(ALL_PACKAGES.map((entry) => entry.name));
    for (const rule of rules) {
      for (const name of rule.replaces) {
        expect(listed, `${name} is missing from the index`).toContain(name);
      }
    }
  });

  it("points each package at the rule that replaces it", () => {
    for (const { name, rule } of ALL_PACKAGES) {
      expect(rule.replaces, `${name} is filed under ${rule.id}`).toContain(
        name,
      );
    }
  });

  it("sorts scoped names under their scope, not under the @", () => {
    const names = ALL_PACKAGES.map((entry) => entry.name);
    const scoped = names.find((name) => name.startsWith("@"));
    expect(
      scoped,
      "expected the catalog to cover a scoped package",
    ).toBeDefined();

    // If @ sorted as a character, every scoped name would be at the front.
    expect(names[0]?.startsWith("@")).toBe(false);
  });
});

describe("groupByInitial", () => {
  const groups = groupByInitial(ALL_PACKAGES);

  it("loses nothing", () => {
    const total = groups.reduce((sum, group) => sum + group.entries.length, 0);
    expect(total).toBe(ALL_PACKAGES.length);
  });

  it("gives each letter one group, in alphabetical order", () => {
    const letters = groups.map((group) => group.letter);
    expect(new Set(letters).size).toBe(letters.length);
    expect(letters).toEqual([...letters].sort());
  });

  it("files a scoped package under its scope's letter", () => {
    const groupOf = (name: string) =>
      groups.find((group) => group.entries.some((entry) => entry.name === name))
        ?.letter;

    expect(groupOf("@floating-ui/react")).toBe("F");
  });

  it("files nothing under @", () => {
    expect(groups.map((group) => group.letter)).not.toContain("@");
  });
});
