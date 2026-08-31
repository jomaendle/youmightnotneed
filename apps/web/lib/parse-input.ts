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

/** github.com, with or without a scheme or www. */
function isGitHubHost(hostname: string): boolean {
  return hostname === "github.com" || hostname === "www.github.com";
}

/** Reads owner and repo, plus a ref when the URL carries /tree/ or /blob/. */
function fromGitHubUrl(input: string): RepoRef | null {
  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    return null;
  }
  if (!isGitHubHost(url.hostname)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const [owner, repo, marker, maybeRef] = parts;
  if (!(owner && repo)) return null;

  const carriesRef = marker === "tree" || marker === "blob";
  return carriesRef && maybeRef
    ? { owner, repo, ref: maybeRef }
    : { owner, repo };
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

  return fromGitHubUrl(trimmed);
}

/**
 * Fetches a public repository's package.json over the raw CDN. Unauthenticated
 * and rate limited, which is acceptable for v1 because paste is the primary
 * input.
 *
 * `HEAD` resolves whatever the default branch is, so there is no need to guess
 * between main and master.
 */
export async function fetchRepoPackageJson(ref: RepoRef): Promise<ParseResult> {
  const branch = ref.ref ?? "HEAD";
  const url = `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/package.json`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "text/plain" },
      // Cache briefly so a shared link does not re-fetch on every view.
      next: { revalidate: 600 },
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach GitHub. Paste the package.json instead.",
    };
  }

  if (response.ok) return parsePackageJson(await response.text());

  if (response.status === 403 || response.status === 429) {
    return {
      ok: false,
      error: "GitHub is rate limiting this. Paste the package.json instead.",
    };
  }

  return {
    ok: false,
    error: `No package.json found in ${ref.owner}/${ref.repo}. It may be private, in a subdirectory, or on a branch you need to name.`,
  };
}
