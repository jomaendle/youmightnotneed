/**
 * Content negotiation for the markdown mirror of a rule page.
 *
 * Browsers send `text/html,application/xhtml+xml,application/xml;q=0.9,*\/*;q=0.8`.
 * Matching the `*\/*` in that would serve markdown to every visitor, so this
 * reads the quality values and only answers true for an explicit
 * `text/markdown` that outranks `text/html`.
 */

/** Top level so it is compiled once: proxy.ts calls this per /rules request. */
const QUALITY = /^q=(\d*\.?\d+)$/;
const IS_QUALITY = /^q=/;

interface AcceptEntry {
  type: string;
  quality: number;
}

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((part) => {
      const [type, ...parameters] = part.split(";").map((s) => s.trim());
      if (!type) return null;

      // Lowercased, and whitespace stripped, before the match: RFC 9110 makes
      // parameter names case-insensitive, and `Q = 0.1` is a spelling this
      // has to read rather than skip.
      const q = parameters
        .map((parameter) => parameter.toLowerCase().replace(/\s/g, ""))
        .find((parameter) => IS_QUALITY.test(parameter));

      return {
        type: type.toLowerCase(),
        quality: q === undefined ? 1 : parseQuality(q),
      };
    })
    .filter((entry) => entry !== null);
}

/**
 * The q of a parameter already known to be one.
 *
 * A q this cannot read counts as zero, not as one. Every other unreadable
 * thing here falls back to a default, and this is the one place where the
 * obvious default is backwards: q exists to lower preference, so reading
 * `q=1e-3` as "no q given", which means maximum preference, inverts what the
 * client said. Unreadable means unacceptable, which fails to the HTML page.
 */
function parseQuality(parameter: string): number {
  const match = QUALITY.exec(parameter);
  if (!match?.[1]) return 0;
  // Clamped, because q ranges 0 to 1 and `q=5` is a malformed way to say
  // "most preferred", not a licence to outrank a well-formed 1.
  return Math.min(Number(match[1]), 1);
}

/**
 * The highest q the client gave this exact type, and 0 when it named only a
 * wildcard.
 *
 * Never named and named as `q=0` collapse to the same number on purpose. Both
 * mean the type is not on offer, the comparison below cannot tell them apart
 * anyway, and keeping them apart cost a null union and two call sites that
 * had to remember which was which.
 */
function explicitQuality(entries: AcceptEntry[], type: string): number {
  const matches = entries
    .filter((entry) => entry.type === type)
    .map((entry) => entry.quality);
  return matches.length === 0 ? 0 : Math.max(...matches);
}

/**
 * True when the client asked for markdown ahead of HTML. A missing or empty
 * header is a browser, or something that did not say, and both get the page.
 */
export function prefersMarkdown(header: string | null): boolean {
  if (!header) return false;

  const entries = parseAccept(header);
  return (
    explicitQuality(entries, "text/markdown") >
    explicitQuality(entries, "text/html")
  );
}
