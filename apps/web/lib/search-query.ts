import { stripControlChars, truncateCodePoints } from "./untrusted-text";

/**
 * Reads ?q= off a search page.
 *
 * A query string is untrusted input and its type is not what it looks like.
 * Next hands searchParams over as Record<string, string | string[]>, so
 * ?q=uuid&q=axios arrives as an array, and calling .trim() on it threw a 500
 * rather than running a search. A repeated parameter is one double-submitted
 * form or one crafted link away.
 *
 * The rest is the same treatment permalink.ts gives a project name: the query
 * is rendered into an <h1> and a <title>, so it is capped and stripped of
 * control characters first.
 */

/**
 * Long enough for the longest package name npm allows, which is 214. Anything
 * past that is not a search.
 */
export const MAX_QUERY = 214;

export function readQuery(raw: string | string[] | undefined): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first === undefined) return "";
  return truncateCodePoints(stripControlChars(first), MAX_QUERY).trim();
}
