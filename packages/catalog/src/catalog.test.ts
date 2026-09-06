import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveBaseline, resolveFeature } from "./baseline.ts";
import { baselineSnapshot } from "./generated/baseline.ts";
import { isKnownGuide, resolveGuide, resolveGuides } from "./guides.ts";
import { rules, rulesByPackage } from "./rules/index.ts";
import { catalogSchema } from "./schema.ts";
import { hasUnresolvedClaim, supportClaims } from "./support.ts";

const srcDir = dirname(fileURLToPath(import.meta.url));

/** Every user-visible prose string on a rule. Snippets are excluded. */
function proseOf(rule: (typeof rules)[number]): string[] {
  return [
    rule.title,
    rule.native,
    rule.human.explainer,
    rule.agent.when,
    ...rule.agent.unless,
  ];
}

describe("the catalog", () => {
  it("validates against the schema", () => {
    expect(() => catalogSchema.parse(rules)).not.toThrow();
  });

  it("is not empty", () => {
    expect(rules.length).toBeGreaterThan(0);
  });

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s resolves to a known support status",
    (_id, rule) => {
      // An "unknown" status means a featureId is missing from the snapshot.
      // Run `pnpm refresh:baseline` and check the rule's IDs.
      expect(resolveBaseline(rule).status).not.toBe("unknown");
    },
  );

  it.each(rules.flatMap((r) => r.featureIds.map((f) => [r.id, f] as const)))(
    "%s references the real web-features ID %s",
    (_id, featureId) => {
      expect(baselineSnapshot.features[featureId]).toBeDefined();
      expect(resolveFeature(featureId).status).not.toBe("unknown");
    },
  );

  it("claims each package exactly once", () => {
    const counts = new Map<string, number>();
    for (const rule of rules) {
      for (const pkg of rule.replaces) {
        counts.set(pkg, (counts.get(pkg) ?? 0) + 1);
      }
    }
    expect([...counts].filter(([, n]) => n > 1)).toEqual([]);
  });

  it("exposes every claimed package in the lookup map", () => {
    const total = rules.reduce((n, r) => n + r.replaces.length, 0);
    expect(rulesByPackage.size).toBe(total);
  });
});

describe("honesty rules", () => {
  // Section 5 of the handover: a dependency in package.json is not proof of
  // what it is used for, so no surface may phrase a finding as an instruction.
  // These were far too narrow to enforce what CLAUDE.md says they enforce:
  // "Delete swiper", "Saves you 20 kB", "This will save 20 kB" and "You should
  // remove swiper" all walked through the previous set. Calibrated so that all
  // 56 rules pass unchanged while every one of those is caught.
  const imperatives = [
    // "Drop this dependency", "Remove the package", "Delete your library".
    /\b(?:delete|uninstall|remove|drop)\s+(?:this|your|the|it)?\s*(?:depend\w*|librar\w*|package|import|module)\b/i,
    // A sentence opening "Delete swiper" or "Uninstall swiper". "Drop" and
    // "remove" are excluded here: both open legitimate sentences about markup.
    /(^|[.!?]\s+)(?:delete|uninstall)\s+[`'"]?@?[a-z][\w.@/-]*/i,
    /\b(?:remove|delete|drop)\s+it\s+from\s+your\b/i,
    /\byou\s+(?:should|can|must)\s+(?:delete|remove|uninstall|drop)\b/i,
    // Sizes are "up to", never a promise. Catches "you will save", "you'll
    // save", "saves you", "this will save" and "saving you".
    /\b(?:you(?:'ll| will)?\s+save|saves?\s+you|will\s+save|saving\s+you)\b/i,
    /\b(?:just|simply|merely)\s+(?:replace|swap|drop|delete|remove)\b/i,
  ];

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s does not tell the reader to delete anything",
    (_id, rule) => {
      for (const text of proseOf(rule)) {
        for (const pattern of imperatives) {
          expect(text).not.toMatch(pattern);
        }
      }
    },
  );

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s states at least one condition where the dependency still wins",
    (_id, rule) => {
      expect(rule.agent.unless.length).toBeGreaterThan(0);
      for (const condition of rule.agent.unless) {
        // A bare "no Safari support" is not actionable. Ask for a sentence.
        expect(condition.length).toBeGreaterThan(20);
      }
    },
  );

  it.each(
    rules
      .filter((r) => resolveBaseline(r).status === "limited")
      .map((r) => [r.id, r] as const),
  )("%s is limited, so it flags support in its unless list", (_id, rule) => {
    const joined = rule.agent.unless.join(" ").toLowerCase();
    expect(joined).toMatch(
      /safari|firefox|chromium|chrome|limited availability|support|@supports|fallback/,
    );
  });

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s has an explainer of a few real sentences",
    (_id, rule) => {
      const sentences = rule.human.explainer
        .split(/[.!?]\s/)
        .filter((s) => s.trim().length > 0);
      expect(sentences.length).toBeGreaterThanOrEqual(2);
      expect(rule.human.explainer.length).toBeGreaterThan(120);
    },
  );

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s keeps its agent projection terse",
    (_id, rule) => {
      // Budget is roughly 200 tokens. Four characters per token is the usual
      // rough proxy, so allow about 1200 characters for when + unless.
      const size = rule.agent.when.length + rule.agent.unless.join(" ").length;
      expect(size).toBeLessThan(1400);
    },
  );

  it.each(
    rules
      .filter((r) => r.human.demoUrl)
      .map((r) => [r.id, r.human.demoUrl] as const),
  )("%s links its demo over https", (_id, url) => {
    expect(url).toMatch(/^https:\/\//);
  });
});

describe("writing voice", () => {
  // Rule 1 of the owner's writing-voice skill: no em dashes in user-visible
  // copy, anywhere. The fix is to restructure the sentence.
  it.each(rules.map((r) => [r.id, r] as const))(
    "%s contains no em dash",
    (_id, rule) => {
      for (const text of proseOf(rule)) {
        expect(text).not.toContain("—");
      }
    },
  );

  const banned = [
    "supercharge",
    "unlock",
    "elevate",
    "empower",
    "seamless",
    "robust",
    "delve",
    "showcase",
    "harness",
    "fast-paced",
    "it's worth noting",
  ];

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s avoids inflated vocabulary",
    (_id, rule) => {
      const prose = proseOf(rule).join(" ").toLowerCase();
      for (const word of banned) {
        expect(prose).not.toContain(word);
      }
    },
  );
});

describe("detect stays pure", () => {
  // CLAUDE.md locks detect() as a pure function: no filesystem, no network, no
  // process, no clock. Listing a handful of files by hand did not enforce it:
  // detect() transitively imports every rule file and all three generated
  // snapshots, none of which were scanned. So walk the real import graph.
  /** Comments out, template literals out. Leaves real import lines intact. */
  function forImports(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ")
      .replace(/`(?:\\.|[^`\\])*`/g, '""');
  }

  function importsOf(source: string): string[] {
    const specifiers: string[] = [];
    // Anchored to the start of a line, because rule prose legitimately says
    // things like: the usual range from "1 hour, 30 minutes" down to "1h 30m".
    // Covers `import x from "y"`, a bare side-effect `import "y"`, and
    // `export ... from "y"`.
    for (const match of forImports(source).matchAll(
      /^\s*(?:import|export)\b[^\n]*?["']([^"']+)["']/gm,
    )) {
      const specifier = match[1];
      if (specifier !== undefined) specifiers.push(specifier);
    }
    return specifiers;
  }

  /** The relative files one module pulls in, as paths under srcDir. */
  function localImportsOf(file: string): string[] {
    const source = readFileSync(join(srcDir, file), "utf8");
    return importsOf(source)
      .filter((specifier) => specifier.startsWith("."))
      .map((specifier) => join(dirname(file), specifier).replace(/^\.\//, ""));
  }

  /** Everything detect() pulls in, transitively, from the package sources. */
  function reachableFrom(entry: string): string[] {
    const seen = new Set<string>();
    const queue = [entry];

    while (queue.length > 0) {
      const file = queue.pop() as string;
      if (seen.has(file)) continue;
      seen.add(file);
      queue.push(...localImportsOf(file));
    }

    return [...seen];
  }

  /** The only non-relative imports a pure module may carry. */
  const ALLOWED_PACKAGES = new Set(["zod"]);

  /**
   * Comments and string literals out, so the call-site checks below read code
   * rather than rule prose. Without this, a rule explaining that "fetch
   * resolves for any response" would fail the fetch check.
   */
  function codeOnly(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ")
      .replace(/`(?:\\.|[^`\\])*`/g, '""')
      .replace(/'(?:\\.|[^'\\\n])*'/g, '""')
      .replace(/"(?:\\.|[^"\\\n])*"/g, '""');
  }

  const reachable = reachableFrom("detect.ts");

  it("reaches the rule data and the generated snapshots", () => {
    // Guards the walker itself: if this stops finding the rules, the purity
    // check silently narrows back to a handful of files.
    expect(reachable).toContain("rules/index.ts");
    expect(reachable).toContain("generated/sizes.ts");
    expect(reachable.length).toBeGreaterThan(50);
  });

  it.each(reachableFrom("detect.ts"))("%s imports nothing impure", (file) => {
    const source = readFileSync(join(srcDir, file), "utf8");

    // An allowlist, not a blocklist: `from "fs"` without the node: prefix is a
    // legal specifier and walked straight through the old check.
    for (const specifier of importsOf(source)) {
      if (specifier.startsWith(".")) continue;
      expect(
        ALLOWED_PACKAGES.has(specifier),
        `${file} imports ${specifier}`,
      ).toBe(true);
    }

    const code = codeOnly(source);
    // A dynamic import can name anything at runtime, so it is banned outright
    // rather than allowlisted.
    expect(code, file).not.toMatch(/\bimport\s*\(/);
    expect(code, file).not.toMatch(/\brequire\(/);
    expect(code, file).not.toMatch(/\bfetch\s*\(/);
    expect(code, file).not.toMatch(/\bprocess\s*[.[]/);
    expect(code, file).not.toMatch(/\bDate\.now\s*\(/);
    expect(code, file).not.toMatch(/new\s+Date\s*\(/);
    expect(code, file).not.toMatch(/\bperformance\.now\s*\(/);
    expect(code, file).not.toMatch(/\bglobalThis\b/);
  });
});

describe("guide references", () => {
  const withGuides = rules.filter((r) => (r.guides ?? []).length > 0);

  it("points at least a few rules to a long-form guide", () => {
    expect(withGuides.length).toBeGreaterThan(0);
  });

  it.each(
    rules.flatMap((r) => (r.guides ?? []).map((g) => [r.id, g] as const)),
  )("%s references the real modern-web-guidance guide %s", (_id, guideId) => {
    // A guide renamed or dropped upstream should fail here rather than ship
    // as a dead link. Run `pnpm refresh:guides` after an upstream release.
    expect(isKnownGuide(guideId)).toBe(true);
  });

  it.each(withGuides.map((r) => [r.id, r] as const))(
    "%s lists each guide once",
    (_id, rule) => {
      const guides = rule.guides ?? [];
      expect(new Set(guides).size).toBe(guides.length);
    },
  );

  it.each(withGuides.map((r) => [r.id, r] as const))(
    "%s resolves every guide to an https URL",
    (_id, rule) => {
      for (const guide of resolveGuides(rule)) {
        expect(guide.url).toMatch(/^https:\/\//);
        expect(guide.category).not.toBe("");
      }
    },
  );

  it("returns a null URL for an unknown guide rather than throwing", () => {
    const guide = resolveGuide("not-a-real-guide");
    expect(guide.url).toBeNull();
    expect(guide.category).toBe("");
  });

  // The snapshot is a plain object, so a bare `guides[id]` would resolve
  // "constructor" off Object.prototype and build a URL out of a function.
  it.each(["constructor", "toString", "hasOwnProperty", "__proto__"])(
    "does not resolve %s off the prototype chain",
    (id) => {
      expect(isKnownGuide(id)).toBe(false);
      const guide = resolveGuide(id);
      expect(guide.url).toBeNull();
      expect(guide.category).toBe("");
    },
  );
});

describe("browser versions are never written by hand", () => {
  // CLAUDE.md's "derived, never hardcoded" covered the support tier but not
  // the version numbers in prose, and a review found seven rules naming a
  // version the source data contradicts. A rule now writes
  // {{browser:key}} and the number comes from web-features or from MDN's
  // browser-compat-data, so a wrong one cannot be typed in the first place.
  const BROWSERS =
    "Chrome|Chromium|Firefox|Safari|Edge|Opera|Samsung Internet|Node|Node\\.js|Deno|Bun";
  const LITERAL_VERSION = new RegExp(`\\b(?:${BROWSERS})\\s+v?\\d`, "g");

  const ruleFiles = readdirSync(join(srcDir, "rules")).filter(
    (file) => file.endsWith(".ts") && file !== "index.ts",
  );

  it("has a rule file for every rule", () => {
    expect(ruleFiles.length).toBe(rules.length);
  });

  it.each(ruleFiles)(
    "%s cites no version the source data did not give",
    (file) => {
      const source = readFileSync(join(srcDir, "rules", file), "utf8");
      // Tokens out first: what remains is anything typed by hand.
      const handWritten = source.replace(
        /\{\{[a-z_]+:[A-Za-z0-9_.-]+\}\}/g,
        "",
      );
      const offenders = handWritten.match(LITERAL_VERSION) ?? [];
      expect(
        offenders,
        `${file} states a browser version by hand. Replace it with {{browser:key}}, where key is a web-features ID or a BCD path, and run \`pnpm refresh:support\`.`,
      ).toEqual([]);
    },
  );

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s resolves every token it uses",
    (_id, rule) => {
      const texts = [
        rule.human.explainer,
        rule.human.snippet,
        rule.agent.when,
        rule.agent.snippet,
        ...rule.agent.unless,
        rule.manualBaseline?.note ?? "",
      ];
      for (const text of texts) {
        expect(hasUnresolvedClaim(text)).toBe(false);
        expect(text).not.toContain("{{");
      }
    },
  );

  it("resolves at least one claim, so the mechanism is actually load-bearing", () => {
    expect(Object.keys(supportClaims.claims).length).toBeGreaterThan(0);
  });
});
