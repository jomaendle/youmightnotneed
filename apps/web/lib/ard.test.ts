import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { GET as getOpenApi } from "../app/openapi.json/route";
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
      expect(
        Number(entry.url !== undefined) + Number(entry.data !== undefined),
      ).toBe(1);
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

  it("names the operations the OpenAPI document really has", async () => {
    const spec = await getOpenApi().json();
    const operationIds = Object.values(spec.paths).map(
      (path) => (path as { get: { operationId: string } }).get.operationId,
    );
    const entry = entries.find((e) => e.identifier.endsWith(":api:openapi"));
    expect(entry?.capabilities.sort()).toEqual(operationIds.sort());
  });

  it("names the tools the MCP server really registers", () => {
    const source = readFileSync(
      join(WEB, "../../packages/mcp/src/server.ts"),
      "utf8",
    );
    const tools = [...source.matchAll(/registerTool\(\s*"([a-z_]+)"/g)].map(
      (match) => match[1],
    );
    const entry = entries.find((e) => e.identifier.endsWith(":server:mcp"));
    expect(tools.length).toBeGreaterThan(0);
    expect(entry?.capabilities.sort()).toEqual(tools.sort());
  });

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

  /** The tar inside the gzip, read without shelling out. */
  function readTar(): Map<
    string,
    { body: string; mtime: number; uid: number }
  > {
    const tar = gunzipSync(archive);
    const files = new Map<
      string,
      { body: string; mtime: number; uid: number }
    >();
    for (let at = 0; at + 512 <= tar.length; ) {
      const header = tar.subarray(at, at + 512);
      if (header.every((byte) => byte === 0)) break;
      const name = header.toString("utf8", 0, 100).replace(/\0.*$/s, "");
      const size = Number.parseInt(header.toString("utf8", 124, 135), 8);
      files.set(name, {
        body: tar.toString("utf8", at + 512, at + 512 + size),
        mtime: Number.parseInt(header.toString("utf8", 136, 147), 8),
        uid: Number.parseInt(header.toString("utf8", 108, 115), 8),
      });
      at += 512 + Math.ceil(size / 512) * 512;
    }
    return files;
  }

  it("holds SKILL.md plus references, byte for byte what the skill directory has", () => {
    const skillDir = join(WEB, "../../skills/youmightnotneed");
    const expected = readdirSync(skillDir, {
      recursive: true,
      withFileTypes: true,
    })
      .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
      .map((entry) =>
        join(entry.parentPath, entry.name).slice(skillDir.length + 1),
      );
    const files = readTar();
    expect([...files.keys()]).toEqual([...expected].sort());
    for (const [name, file] of files) {
      expect(file.body, name).toBe(readFileSync(join(skillDir, name), "utf8"));
    }
  });

  it("carries nothing that varies between runs", () => {
    for (const [name, file] of readTar()) {
      expect(file.mtime, name).toBe(0);
      expect(file.uid, name).toBe(0);
    }
    // gzip header: no timestamp, and the OS byte is pinned to Unix.
    expect([...archive.subarray(4, 8)]).toEqual([0, 0, 0, 0]);
    expect(archive[9]).toBe(3);
  });
});
