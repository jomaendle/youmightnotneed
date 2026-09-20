import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildArd } from "./ard";
import { site } from "./site";

const WEB = resolve(import.meta.dirname, "..");
const AGENT_SKILLS = join(WEB, "public/.well-known/agent-skills");

/** Where a URL on this site is served from: a route handler or a static file. */
function servedFrom(url: string): boolean {
  const path = new URL(url).pathname;
  return (
    existsSync(join(WEB, "app", path, "route.ts")) ||
    existsSync(join(WEB, "public", path))
  );
}

describe("ARD manifest", () => {
  const { entries } = buildArd();

  it("follows the entry shape in the spec", () => {
    for (const entry of entries) {
      expect(entry.identifier).toMatch(
        new RegExp(
          `^urn:air:${site.domain.replace(".", "\\.")}:[a-z]+:[a-z-]+$`,
        ),
      );
      expect(entry.displayName).not.toBe("");
      // A media type, not a label.
      expect(entry.type).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/);
      // Exactly one of url and data.
      expect(Number("url" in entry) + Number("data" in entry)).toBe(1);
    }
  });

  it("has unique identifiers", () => {
    expect(new Set(entries.map((e) => e.identifier)).size).toBe(entries.length);
  });

  it.each(entries.filter((e) => e.url !== undefined))(
    "$displayName resolves to something this repo serves",
    (entry) => {
      expect(entry.url?.startsWith(site.url)).toBe(true);
      expect(servedFrom(entry.url as string), entry.url).toBe(true);
    },
  );

  it("is served at both paths", () => {
    for (const name of ["ard.json", "ai-catalog.json"]) {
      expect(existsSync(join(WEB, "app/.well-known", name, "route.ts"))).toBe(
        true,
      );
    }
  });
});

describe("skill archive", () => {
  const archive = readFileSync(join(AGENT_SKILLS, "youmightnotneed.tar.gz"));
  const index = JSON.parse(
    readFileSync(join(AGENT_SKILLS, "index.json"), "utf8"),
  );
  const [skill] = index.skills;

  it("is listed in the index the way the RFC asks", () => {
    expect(index.$schema).toMatch(/^https:\/\/.+\/schema\.json$/);
    expect(skill.type).toBe("archive");
    expect(skill.name).toMatch(/^[a-z0-9-]{1,64}$/);
    expect(skill.description.length).toBeLessThanOrEqual(1024);
    expect(skill.url).toBe(
      `${site.url}/.well-known/agent-skills/youmightnotneed.tar.gz`,
    );
  });

  it("has a digest that equals the file that is served", () => {
    const hex = createHash("sha256").update(archive).digest("hex");
    expect(skill.digest).toBe(`sha256:${hex}`);
  });

  it("extracts to SKILL.md plus references", () => {
    const dir = mkdtempSync(join(tmpdir(), "skill-"));
    execFileSync("tar", ["xzf", join(AGENT_SKILLS, "youmightnotneed.tar.gz")], {
      cwd: dir,
    });
    expect(readdirSync(dir).sort()).toEqual(["SKILL.md", "references"]);
    expect(readdirSync(join(dir, "references")).sort()).toContain("catalog.md");
  });
});
