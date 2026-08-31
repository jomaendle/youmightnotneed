/**
 * Report permalinks encode their whole payload in the URL. There is no
 * database, so nobody's package.json is stored anywhere, a link cannot rot,
 * and the report is reproducible from the link alone.
 *
 * Only the matched package names are encoded, not the whole file. detect() is
 * pure, so those names are enough to rebuild the report, and it keeps the URL
 * short. Names are stored verbatim rather than as catalog indices: an index
 * would silently point at a different package the next time the catalog moved.
 */

const VERSION = "1";

/**
 * A report link is untrusted input: anyone can craft a `?d=` and share it. The
 * package list is bounded already, so the label needs the same treatment, or a
 * crafted link puts arbitrary text in the report header, the meta description
 * and the OG card.
 */
const MAX_PROJECT_NAME = 80;
const MAX_PACKAGES = 200;
const MAX_PACKAGE_NAME = 214;

const PLUS = /\+/g;
const SLASH = /\//g;
const TRAILING_EQUALS = /[=]+$/;
const DASH = /-/g;
const UNDERSCORE = /_/g;

/**
 * Control characters have no business in a displayed label. Filtering by code
 * point avoids putting them inside a character class, which is both harder to
 * read and something Biome flags.
 */
function stripControlChars(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isControl = code <= 0x1f || (code >= 0x7f && code <= 0x9f);
    if (!isControl) out += char;
  }
  return out;
}

/** Base64url, without Buffer, so this works in Node and on the edge. */
function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(PLUS, "-")
    .replace(SLASH, "_")
    .replace(TRAILING_EQUALS, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(DASH, "+").replace(UNDERSCORE, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export interface ReportPayload {
  /** Dependency names that matched a rule. */
  packages: string[];
  /** Optional project label, shown in the report header and the OG card. */
  projectName?: string | undefined;
}

/**
 * Encodes a payload for the `d` query parameter. Shape is
 * `1.<name,name,...>` with an optional `~<projectName>` suffix, base64url'd.
 */
export function encodeReport(payload: ReportPayload): string {
  const names = [...new Set(payload.packages)].sort().join(",");
  const label = payload.projectName?.trim();
  const raw = label ? `${names}~${label}` : names;
  return `${VERSION}.${toBase64Url(raw)}`;
}

/** Returns null for anything malformed, so a bad link renders an empty state. */
export function decodeReport(value: string | undefined): ReportPayload | null {
  if (!value) return null;
  const separator = value.indexOf(".");
  if (separator === -1) return null;

  const version = value.slice(0, separator);
  if (version !== VERSION) return null;

  try {
    const raw = fromBase64Url(value.slice(separator + 1));
    const tilde = raw.indexOf("~");
    const names = tilde === -1 ? raw : raw.slice(0, tilde);
    const projectName = tilde === -1 ? undefined : raw.slice(tilde + 1);

    const packages = names
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter((n) => n.length > 0 && n.length <= MAX_PACKAGE_NAME)
      .slice(0, MAX_PACKAGES);

    const label =
      projectName === undefined
        ? undefined
        : stripControlChars(projectName).trim().slice(0, MAX_PROJECT_NAME);

    // An empty list is valid: it is the "nothing matched" report, which is a
    // real result worth having a shareable link for.
    return label ? { packages, projectName: label } : { packages };
  } catch {
    return null;
  }
}

/** Turns a payload back into the shape detect() expects. */
export function toPackageJsonLike(payload: ReportPayload) {
  return {
    name: payload.projectName,
    dependencies: Object.fromEntries(payload.packages.map((p) => [p, "*"])),
  };
}
