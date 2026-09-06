import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveBaseline, resolveFeature } from "./baseline.ts";
import { CATEGORIES, categorySchema } from "./categories.ts";
import { baselineSnapshot } from "./generated/baseline.ts";
import { isKnownGuide, resolveGuide, resolveGuides } from "./guides.ts";
import { tierShareOf } from "./history.ts";
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

  it("uses every declared category at least once", () => {
    const used = new Set(rules.map((r) => r.category));
    const unused = CATEGORIES.filter((c) => !used.has(c.id));
    expect(unused).toEqual([]);
  });

  // CATEGORIES_BY_ID is typed as a total Record, so a category id that the
  // schema accepts but CATEGORIES omits would be a lookup returning
  // undefined behind a type that promises otherwise.
  it("describes every id the schema accepts", () => {
    const described = new Set(CATEGORIES.map((c) => c.id));
    const missing = categorySchema.options.filter((id) => !described.has(id));
    expect(missing).toEqual([]);
  });

  it("rejects a category the taxonomy does not declare", () => {
    expect(categorySchema.safeParse("not-a-category").success).toBe(false);
  });
});

describe("tierShareOf", () => {
  const entry = (
    ruleCount: number,
    tally: { widely: number; newly: number; limited: number; unknown: number },
  ) => ({
    month: "2026-09",
    generatedOn: "2026-09-05",
    webFeaturesVersion: "0.0.0",
    ruleCount,
    tally,
  });

  it("reports each tier as a percentage of the catalog", () => {
    const share = tierShareOf(
      entry(40, { widely: 20, newly: 10, limited: 8, unknown: 2 }),
    );
    expect(share).toEqual({ widely: 50, newly: 25, limited: 20, unknown: 5 });
  });

  // The whole reason the share is computed rather than stored: adding rules
  // must not read as support getting worse.
  it("holds steady when the catalog grows but support does not change", () => {
    const before = tierShareOf(
      entry(10, { widely: 5, newly: 3, limited: 2, unknown: 0 }),
    );
    const after = tierShareOf(
      entry(20, { widely: 10, newly: 6, limited: 4, unknown: 0 }),
    );
    expect(after).toEqual(before);
  });

  it("returns zeroes rather than dividing by zero on an empty catalog", () => {
    expect(
      tierShareOf(entry(0, { widely: 0, newly: 0, limited: 0, unknown: 0 })),
    ).toEqual({ widely: 0, newly: 0, limited: 0, unknown: 0 });
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

  /**
   * Import specifiers, anchored to the start of a line because rule prose
   * legitimately says things like: the usual range from "1 hour, 30 minutes".
   *
   * `[^;]*?` rather than `[^\n]*?` is load-bearing twice over. It spans
   * newlines, so a multi-line `import {\n  a,\n} from "x"` is seen at all:
   * without it, detect.ts's own import of baseline.ts was invisible and
   * neither baseline.ts nor generated/baseline.ts was ever purity-checked.
   * Excluding `=` as well as `;` keeps it from running out of
   * `export const rule: Rule = {` and down into rule prose, which really does
   * say things like: the usual range from "1 hour, 30 minutes".
   */
  const IMPORT_PATTERNS = [
    /^[ \t]*import\s[^;=]*?\bfrom\s*["']([^"']+)["']/gm,
    /^[ \t]*import\s*["']([^"']+)["']/gm,
    /^[ \t]*export\s[^;=]*?\bfrom\s*["']([^"']+)["']/gm,
  ];

  function importsOf(source: string): string[] {
    const specifiers = new Set<string>();
    const code = forImports(source);
    for (const pattern of IMPORT_PATTERNS) {
      for (const match of code.matchAll(pattern)) {
        const specifier = match[1];
        if (specifier !== undefined) specifiers.add(specifier);
      }
    }
    return [...specifiers];
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

  /**
   * Roots of the pure graph. detect() is the one CLAUDE.md names. The rest are
   * equally pure and shared by every surface, but nothing imports them from
   * detect(), so a walk rooted only there would never reach them. format.ts
   * was covered by the hand-written list this walk replaced.
   */
  const PURE_ROOTS = [
    "detect.ts",
    "format.ts",
    "guides.ts",
    "history.ts",
    "support.ts",
  ];

  const reachable = [
    ...new Set(PURE_ROOTS.flatMap((root) => reachableFrom(root))),
  ];

  it("reaches every module detect() actually depends on", () => {
    // Guards the walker itself. baseline.ts is named explicitly because a
    // line-anchored regex once missed it, along with generated/baseline.ts,
    // leaving both unchecked while the suite stayed green. `> 50` alone did
    // not notice: the 56 rule files satisfy it on their own.
    for (const file of [
      "baseline.ts",
      "generated/baseline.ts",
      "generated/sizes.ts",
      "generated/support-claims.ts",
      "guides.ts",
      "generated/guides.ts",
      "history.ts",
      "rules/index.ts",
      "schema.ts",
      "support.ts",
    ]) {
      expect(reachable, `${file} is not being purity-checked`).toContain(file);
    }
    expect(reachable.length).toBeGreaterThan(60);
  });

  it.each(reachable)("%s imports nothing impure", (file) => {
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
    "Chrome|Chromium|Firefox|Safari|Edge|Opera|WebKit|Blink|Gecko|iOS|iPadOS|macOS|Android|Samsung Internet|Node|Node\\.js|Deno|Bun";

  /**
   * Any sentence naming a browser or runtime, so a version is caught wherever
   * it sits in it. Matching only `Browser NN` let every real phrasing through:
   * "Safari before version 16.4", "Firefox before 127", "before 13.1",
   * "18.4 on iOS", "iOS 15.4", "versions below 102 of Chrome".
   */
  const BROWSER_SENTENCE = new RegExp(
    `[^.!?\\n]*\\b(?:${BROWSERS})\\b[^.!?\\n]*`,
    "g",
  );

  /** A bare four-digit year is a date, not a version. Anything else is one. */
  const YEAR = /^(?:19|20)\d{2}$/;

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
      const offenders: string[] = [];
      for (const [sentence] of handWritten.matchAll(BROWSER_SENTENCE)) {
        for (const [number] of sentence.matchAll(/\b\d+(?:\.\d+)*\b/g)) {
          if (!number.includes(".") && YEAR.test(number)) continue;
          offenders.push(`${number} in "${sentence.trim().slice(0, 80)}"`);
        }
      }
      expect(
        offenders,
        `${file} states a browser version by hand. Replace it with {{browser:key}}, where key is a web-features ID or a BCD path, and run \`pnpm refresh:support\`.`,
      ).toEqual([]);
    },
  );

  it.each(rules.map((r) => [r.id, r] as const))(
    "%s resolves every token it uses",
    (_id, rule) => {
      // Every field withResolvedClaims() touches, and nothing it does not:
      // title and native were interpolated later than the rest, and a token
      // in either shipped raw until this list caught up.
      const texts = [
        rule.title,
        rule.native,
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
