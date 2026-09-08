/**
 * Content negotiation for the markdown mirror of a rule page.
 *
 * Browsers send `text/html,application/xhtml+xml,application/xml;q=0.9,*\/*;q=0.8`.
 * Matching the `*\/*` in that would serve markdown to every visitor, so this
 * reads the quality values and only answers true for an explicit
 * `text/markdown` that outranks `text/html`.
 */

/** Top level so it is compiled once: proxy.ts calls this on every request. */
const QUALITY = /^q=(\d*\.?\d+)$/;

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

      // Lowercased before the match, because RFC 9110 makes parameter names
      // case-insensitive and an unread `Q=0` would otherwise fall through to
      // the default of 1, turning "not acceptable" into "preferred".
      const q = parameters
        .map((parameter) => QUALITY.exec(parameter.toLowerCase()))
        .find((match) => match !== null);

      // A parameter that is not a q at all leaves the default. Clamped,
      // because q ranges 0 to 1 and `q=5` is a malformed way to say "most
      // preferred", not a licence to outrank a well-formed 1.
      const quality = q?.[1] === undefined ? 1 : Number(q[1]);

      return { type: type.toLowerCase(), quality: Math.min(quality, 1) };
    })
    .filter((entry) => entry !== null);
}

/** The highest q for an exact type. Null when only a wildcard covers it. */
function explicitQuality(entries: AcceptEntry[], type: string): number | null {
  const matches = entries.filter((entry) => entry.type === type);
  if (matches.length === 0) return null;
  return Math.max(...matches.map((entry) => entry.quality));
}

/**
 * True when the client asked for markdown ahead of HTML. A missing or empty
 * header is a browser, or something that did not say, and both get the page.
 */
export function prefersMarkdown(header: string | null): boolean {
  if (!header) return false;

  const entries = parseAccept(header);
  const markdown = explicitQuality(entries, "text/markdown");
  if (markdown === null || markdown === 0) return false;

  return markdown > (explicitQuality(entries, "text/html") ?? 0);
}
