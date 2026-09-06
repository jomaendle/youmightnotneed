/**
 * Two guards for text that arrives in a URL and ends up on the page.
 *
 * Both started in permalink.ts, for the project name in a ?d= payload. The
 * search query in ?q= is the same kind of input and reaches the same places,
 * a heading and a <title>, so they live here rather than being written twice.
 */

/**
 * Control characters have no business in a displayed label. Filtering by code
 * point avoids putting them inside a character class, which is both harder to
 * read and something Biome flags.
 */
export function stripControlChars(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isControl = code <= 0x1f || (code >= 0x7f && code <= 0x9f);
    if (!isControl) out += char;
  }
  return out;
}

/**
 * Caps a label by code point rather than by UTF-16 unit. A plain slice at 80
 * lands in the middle of a surrogate pair for anything astral (an emoji in a
 * repo name is enough), and the lone half encodes as U+FFFD, so the label
 * comes back ending in a replacement character.
 */
export function truncateCodePoints(value: string, max: number): string {
  let out = "";
  let count = 0;
  for (const char of value) {
    if (count >= max) break;
    out += char;
    count += 1;
  }
  return out;
}
