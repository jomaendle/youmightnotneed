/**
 * Builds the skill archive and the discovery index that points at it.
 *
 * Format from github.com/cloudflare/agent-skills-discovery-rfc: an
 * `index.json` under /.well-known/agent-skills/ with a `$schema` and a
 * `skills` array, each entry `{name, type, description, url, digest}`, where
 * `type` is "archive" or "skill-md" and `digest` is `sha256:<hex>`.
 *
 * Both files are committed under apps/web/public, so the site serves them as
 * static assets: no filesystem read at request time, no cwd dependency.
 *
 * Reproducible on purpose. check-freshness rebuilds the archive and compares
 * bytes, so entries are sorted, mtimes are zero, owners are blank and the
 * gzip header carries no timestamp. Anything that varied per run would make
 * the check flap.
 *
 * Run: pnpm refresh:skill-archive
 */
import { createHash } from "node:crypto";
import {
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(here, "../skills/youmightnotneed");
const OUT_DIR = join(here, "../apps/web/public/.well-known/agent-skills");

export const SKILL_NAME = "youmightnotneed";
export const ARCHIVE_FILE = join(OUT_DIR, `${SKILL_NAME}.tar.gz`);
export const INDEX_FILE = join(OUT_DIR, "index.json");
const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
const ORIGIN = "https://youmightnotneed.dev";

/** Every file under the skill, as archive paths, in byte order. */
function listFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full));
    else found.push(relative(SKILL_DIR, full).split("\\").join("/"));
  }
  return found.sort();
}

function octal(value: number, width: number): string {
  return `${value.toString(8).padStart(width - 1, "0")}\0`;
}

/** One ustar header plus the body padded to a 512 byte block. */
function tarEntry(path: string, body: Buffer): Buffer {
  const header = Buffer.alloc(512);
  header.write(path, 0, 100, "utf8");
  header.write(octal(0o644, 8), 100);
  header.write(octal(0, 8), 108); // uid
  header.write(octal(0, 8), 116); // gid
  header.write(octal(body.length, 12), 124);
  header.write(octal(0, 12), 136); // mtime, zeroed
  header.write("        ", 148); // checksum placeholder is eight spaces
  header.write("0", 156); // regular file
  header.write("ustar\0", 257);
  header.write("00", 263);
  const sum = header.reduce((total, byte) => total + byte, 0);
  header.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
  const padding = Buffer.alloc((512 - (body.length % 512)) % 512);
  return Buffer.concat([header, body, padding]);
}

export function buildSkillArchive(): Buffer {
  const parts = listFiles(SKILL_DIR).map((path) => {
    if (path.length > 100) throw new Error(`Path too long for ustar: ${path}`);
    return tarEntry(path, readFileSync(join(SKILL_DIR, path)));
  });
  // Two empty blocks end a tar stream.
  const tar = Buffer.concat([...parts, Buffer.alloc(1024)]);
  const gz = gzipSync(tar, { level: 9 });
  // zlib writes the mtime as zero already. The OS byte follows the platform,
  // so pin it to Unix (3) and the same bytes come out on any machine.
  gz[9] = 3;
  return gz;
}

export function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function skillDescription(): string {
  const doc = readFileSync(join(SKILL_DIR, "SKILL.md"), "utf8");
  const match = /^description:\s*(.+)$/m.exec(doc);
  if (!match?.[1]) throw new Error("SKILL.md has no description line.");
  return match[1].trim();
}

export function buildSkillIndex(archive: Buffer): string {
  const index = {
    $schema: SCHEMA,
    skills: [
      {
        name: SKILL_NAME,
        type: "archive",
        description: skillDescription(),
        url: `${ORIGIN}/.well-known/agent-skills/${SKILL_NAME}.tar.gz`,
        digest: `sha256:${sha256(archive)}`,
      },
    ],
  };
  return `${JSON.stringify(index, null, 2)}\n`;
}

function isEntryPoint(): boolean {
  const argv1 = process.argv[1];
  if (argv1 === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(argv1)).href;
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  const archive = buildSkillArchive();
  writeFileSync(ARCHIVE_FILE, archive);
  writeFileSync(INDEX_FILE, buildSkillIndex(archive), "utf8");
  console.info(
    `Wrote ${SKILL_NAME}.tar.gz (${archive.length} bytes, sha256:${sha256(archive).slice(0, 12)}...) and index.json.`,
  );
}
