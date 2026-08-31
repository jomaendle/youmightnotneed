import type { PackageJsonLike } from "@jomae/catalog";

/**
 * Turns whatever the user pasted into something detect() can read.
 *
 * Two accepted inputs in v1: a package.json, and a public GitHub repository
 * reference. Both are unauthenticated, and nothing is stored.
 */

export type ParseResult =
  | { ok: true; pkg: PackageJsonLike }
  | { ok: false; error: string };

const MAX_INPUT_BYTES = 500_000;

/** npm package names: optionally scoped, lowercase. */
const NPM_NAME = /^(?:@[a-z0-9][a-z0-9-._]*\/)?[a-z0-9][a-z0-9-._]*$/;

/**
 * Anything npm accepts on the right-hand side of a dependency: a semver range,
 * a tag, or one of the protocol forms.
 */
const VERSION_RANGE =
  /^(?:\*|latest|next|workspace:|npm:|file:|link:|portal:|catalog:|git|https?:|[\^~><=v\s]*\d)/i;

const DEPENDENCY_BLOCKS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
] as const;

/**
 * Decides whether a bare object is a dependency map rather than a package.json
 * that simply has no dependencies.
 *
 * Checking only that every value is a string is not enough: `{"name": "x",
 * "version": "1.0.0"}` passes that and would be analysed as two dependencies,
 * reporting nothing found instead of saying the file has no dependencies. So
 * the values have to look like version ranges too.
 */
function looksLikeDependencyMap(record: Record<string, unknown>): boolean {
  const entries = Object.entries(record);
  if (entries.length === 0) return false;

  return entries.every(
    ([name, range]) =>
      typeof range === "string" &&
      NPM_NAME.test(name.toLowerCase()) &&
      VERSION_RANGE.test(range),
  );
}

/** Accepts a full package.json, or a bare dependency block. */
export function parsePackageJson(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Paste a package.json to get started." };
  }
  if (trimmed.length > MAX_INPUT_BYTES) {
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
  const hasBlock = DEPENDENCY_BLOCKS.some(
    (key) => typeof record[key] === "object" && record[key] !== null,
  );
  if (hasBlock) return { ok: true, pkg: record as PackageJsonLike };

  // A bare dependency map is a reasonable thing to paste, so accept it.
  if (looksLikeDependencyMap(record)) {
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

export interface RepoRef {
  owner: string;
  repo: string;
  /**
   * Everything after `/tree/` or `/blob/` in the URL: a ref, optionally
   * followed by the subdirectory holding the package.json. The two cannot be
   * told apart without asking GitHub, because a branch name may contain a
   * slash, so this is passed through verbatim and the raw CDN resolves the
   * split itself. Absent means the default branch.
   */
  path?: string | undefined;
}

const TRAILING_SLASHES = /\/+$/;
const GIT_SUFFIX = /\.git$/;

/**
 * GitHub owner names are alphanumeric with inner hyphens, so no dots. That is
 * what keeps `github.com/vercel` from parsing as owner `github.com`.
 */
const SHORTHAND = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\/([\w.-]+)$/i;

/** A bare github.com host prefix, with or without www. */
const GITHUB_PREFIX = /^(?:www\.)?github\.com\//i;

function isGitHubHost(hostname: string): boolean {
  return hostname === "github.com" || hostname === "www.github.com";
}

/** Reads owner, repo and any ref or subdirectory out of a github.com URL. */
function fromGitHubUrl(input: string): RepoRef | null {
  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    return null;
  }
  if (!isGitHubHost(url.hostname)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const [owner, repo, marker, ...rest] = parts;
  if (!(owner && repo)) return null;

  const carriesPath = marker === "tree" || marker === "blob";
  if (!carriesPath || rest.length === 0) return { owner, repo };

  // A /blob/ URL usually points straight at the file. Drop it so the fetcher
  // can append package.json itself.
  const segments = rest.at(-1) === "package.json" ? rest.slice(0, -1) : rest;
  if (segments.length === 0) return { owner, repo };

  return { owner, repo, path: segments.join("/") };
}

/** Pulls owner/repo out of a GitHub URL, or an "owner/repo" shorthand. */
export function parseRepoInput(input: string): RepoRef | null {
  // Order matters: strip the trailing slash first, or a URL ending `.git/`
  // keeps its `.git` and the repo name is wrong.
  const trimmed = input
    .trim()
    .replace(TRAILING_SLASHES, "")
    .replace(GIT_SUFFIX, "");
  if (trimmed.length === 0) return null;

  // Try the URL form first. `github.com/vercel` looks like a shorthand but is
  // a host and a single path segment, which is not a repository.
  if (trimmed.includes("://") || GITHUB_PREFIX.test(trimmed)) {
    return fromGitHubUrl(trimmed);
  }

  const shorthand = SHORTHAND.exec(trimmed);
  if (shorthand?.[1] && shorthand[2]) {
    return { owner: shorthand[1], repo: shorthand[2] };
  }

  return fromGitHubUrl(trimmed);
}

/** The raw CDN path for a reference's package.json. */
export function rawPackageJsonUrl(ref: RepoRef): string {
  // `HEAD` resolves whatever the default branch is, so there is no need to
  // guess between main and master.
  const path = ref.path ?? "HEAD";
  return `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${path}/package.json`;
}

/**
 * Fetches a public repository's package.json over the raw CDN.
 * Unauthenticated and rate limited, which is acceptable for v1 because paste
 * is the primary input.
 */
export async function fetchRepoPackageJson(ref: RepoRef): Promise<ParseResult> {
  let response: Response;
  try {
    response = await fetch(rawPackageJsonUrl(ref), {
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

  const where = ref.path === undefined ? "" : ` at ${ref.path}`;
  return {
    ok: false,
    error: `No package.json found in ${ref.owner}/${ref.repo}${where}. It may be private, or on a different branch.`,
  };
}
