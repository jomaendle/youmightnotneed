/**
 * Content negotiation for the markdown mirror of a rule page.
 *
 * Browsers send `text/html,application/xhtml+xml,application/xml;q=0.9,*\/*;q=0.8`.
 * A naive `includes()` on that string, or matching the `*\/*`, would serve
 * markdown to every visitor, so this reads the quality values and only answers
 * true for an explicit `text/markdown` that outranks `text/html`.
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

      // q=0 means "not acceptable", and a malformed q is ignored rather than
      // turned into NaN, which loses every comparison it takes part in.
      const q = parameters
        .map((parameter) => QUALITY.exec(parameter))
        .find((match) => match !== null);
      const quality = q?.[1] === undefined ? 1 : Number(q[1]);

      return {
        type: type.toLowerCase(),
        quality: Number.isFinite(quality) ? Math.min(quality, 1) : 1,
      };
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
