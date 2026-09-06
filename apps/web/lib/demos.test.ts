import { rules } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { demos, demosNotWorthIt } from "./demos";

describe("live demos", () => {
  it.each(rules.map((r) => [r.id] as const))(
    "%s either has a demo or says why it has none",
    (id) => {
      const covered =
        demos[id] !== undefined || demosNotWorthIt[id] !== undefined;
      expect(covered).toBe(true);
    },
  );

  it("has no demo for a rule that no longer exists", () => {
    const ids = new Set(rules.map((r) => r.id));
    const orphans = [
      ...Object.keys(demos),
      ...Object.keys(demosNotWorthIt),
    ].filter((id) => !ids.has(id));
    expect(orphans).toEqual([]);
  });

  it("never both ships a demo and excuses it", () => {
    const both = Object.keys(demosNotWorthIt).filter(
      (id) => demos[id] !== undefined,
    );
    expect(both).toEqual([]);
  });

  it("gives a real reason for every exemption", () => {
    for (const [id, reason] of Object.entries(demosNotWorthIt)) {
      expect(reason.length, id).toBeGreaterThan(30);
    }
  });
});

describe("demo scripts", () => {
  const entries = Object.entries(demos).filter(
    (entry): entry is [string, NonNullable<(typeof demos)[string]>] =>
      entry[1] !== undefined,
  );

  it.each(entries.map(([id]) => [id] as const))(
    "%s parses as JavaScript",
    (id) => {
      const demo = demos[id];
      if (!demo) throw new Error(`no demo for ${id}`);
      // Plenty of demos are pure CSS and carry no script at all.
      const scripts = [...demo.html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
      for (const [, body] of scripts) {
        // Parsed, never run. A demo renders in an iframe we cannot exercise
        // here, so this is the gate that catches a typo before it ships as a
        // silently dead demo.
        expect(() => new Function(body ?? "")).not.toThrow();
      }
    },
  );

  it.each(entries.map(([id]) => [id] as const))(
    "%s only looks up elements it renders",
    (id) => {
      const demo = demos[id];
      if (!demo) throw new Error(`no demo for ${id}`);
      const queried = [
        ...demo.html.matchAll(/getElementById\("([^"]+)"\)/g),
      ].map((m) => m[1]);
      for (const elementId of queried) {
        expect(demo.html, `#${elementId}`).toContain(`id="${elementId}"`);
      }
    },
  );
});
