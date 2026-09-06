import { supportClaims } from "./generated/support-claims.ts";

/**
 * Interpolates the browser versions a rule's prose cites.
 *
 * Rules write `{{safari:api.Crypto.randomUUID}}`, never `15.4`. The number
 * comes from web-features or from MDN's browser-compat-data at build time and
 * is committed as a snapshot, so a version cannot be guessed, cannot go stale
 * without the diff showing it, and cannot be typed wrong in the first place.
 *
 * Pure, like everything else the surfaces share.
 */

/** `{{browser:key}}`, where key is a web-features ID or a BCD path. */
const CLAIM_TOKEN = /\{\{([a-z_]+):([A-Za-z0-9_.-]+)\}\}/g;

/**
 * Replaces every token with its version. An unknown token is left visible
 * rather than silently blanked: a `{{...}}` on screen is obviously broken,
 * where an empty string reads as finished prose. A test asserts none survive.
 */
export function resolveSupportClaims(text: string): string {
  return text.replace(
    CLAIM_TOKEN,
    (token, browser: string, key: string) =>
      supportClaims.claims[`${browser}:${key}`] ?? token,
  );
}

/** True when a string still carries an unresolved token. Used by the tests. */
export function hasUnresolvedClaim(text: string): boolean {
  for (const [, browser, key] of text.matchAll(CLAIM_TOKEN)) {
    if (supportClaims.claims[`${browser}:${key}`] === undefined) return true;
  }
  return false;
}

export { supportClaims };
