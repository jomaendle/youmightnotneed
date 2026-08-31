import type { PackageJsonLike } from "@youmightnotneed/catalog";

/**
 * Turns whatever the user pasted into something detect() can read.
 *
 * Two accepted inputs in v1: a package.json, and a public GitHub repository
 * URL. Both are unauthenticated, and nothing is stored.
 */

export type ParseResult =
  | { ok: true; pkg: PackageJsonLike }
  | { ok: false; error: string };

/** Accepts a full package.json, or a bare dependency block. */
export function parsePackageJson(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Paste a package.json to get started." };
  }
  if (trimmed.length > 500_000) {
    return { ok: false, error: "That file is too large to be a package.json." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      error:
        "That is not valid JSON. Paste the whole package.json, including the braces.",
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "Expected a JSON object." };
  }

  const record = parsed as Record<string, unknown>;
  const hasAnyBlock = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
  ].some((key) => typeof record[key] === "object" && record[key] !== null);

  // A bare dependency map is a reasonable thing to paste, so accept it.
  if (!hasAnyBlock) {
    const looksLikeDeps = Object.values(record).every(
      (v) => typeof v === "string",
    );
    if (looksLikeDeps && Object.keys(record).length > 0) {
      return {
        ok: true,
        pkg: { dependencies: record as Record<string, string> },
      };
    }
    return {
      ok: false,
      error: "No dependencies, devDependencies or peerDependencies found.",
    };
  }

  return { ok: true, pkg: record as PackageJsonLike };
}

const GIT_SUFFIX = /\.git$/;
const TRAILING_SLASHES = /\/+$/;
const OWNER_REPO = /^([\w.-]+)\/([\w.-]+)$/;

export interface RepoRef {
  owner: string;
  repo: string;
  /** Branch, tag or commit. Defaults to the repo's default branch. */
  ref?: string | undefined;
}

/** Pulls owner/repo out of a GitHub URL, or an "owner/repo" shorthand. */
export function parseRepoInput(input: string): RepoRef | null {
  const trimmed = input
    .trim()
    .replace(GIT_SUFFIX, "")
    .replace(TRAILING_SLASHES, "");
  if (trimmed.length === 0) return null;

  const shorthand = OWNER_REPO.exec(trimmed);
  if (shorthand?.[1] && shorthand[2]) {
    return { owner: shorthand[1], repo: shorthand[2] };
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const owner = parts[0];
  const repo = parts[1];
  if (!(owner && repo)) return null;

  // .../tree/<ref> and .../blob/<ref> both carry a usable ref.
  const marker = parts[2];
  const ref =
    (marker === "tree" || marker === "blob") && parts[3] ? parts[3] : undefined;

  return ref ? { owner, repo, ref } : { owner, repo };
}

/**
 * Fetches a public repository's package.json over the raw CDN. Unauthenticated
 * and rate limited, which is acceptable for v1: paste is the primary input.
 */
export async function fetchRepoPackageJson(ref: RepoRef): Promise<ParseResult> {
  const branches = ref.ref ? [ref.ref] : ["HEAD", "main", "master"];

  for (const branch of branches) {
    const url = `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/package.json`;
    try {
      const response = await fetch(url, {
        headers: { Accept: "text/plain" },
        // Cache briefly so a shared link does not re-fetch on every view.
        next: { revalidate: 600 },
      });
      if (response.ok) {
        return parsePackageJson(await response.text());
      }
      if (response.status === 403 || response.status === 429) {
        return {
          ok: false,
          error:
            "GitHub is rate limiting this. Paste the package.json instead.",
        };
      }
    } catch {
      return {
        ok: false,
        error: "Could not reach GitHub. Paste the package.json instead.",
      };
    }
  }

  return {
    ok: false,
    error: `No package.json found in ${ref.owner}/${ref.repo}. It may be private, or in a subdirectory.`,
  };
}
