/**
 * A very small ANSI helper. The CLI has no dependencies beyond the catalog, so
 * terminal output screenshots well without pulling in a colour library.
 */

/** ASCII escape, built at runtime to keep a control character out of source. */
const ESC = `${String.fromCharCode(27)}[`;

const CODES = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  cyan: `${ESC}36m`,
  grey: `${ESC}90m`,
} as const;

export type ColorName = Exclude<keyof typeof CODES, "reset">;

export interface Palette {
  (name: ColorName, text: string): string;
  enabled: boolean;
}

/** Returns a painter that becomes the identity function when colour is off. */
export function createPalette(enabled: boolean): Palette {
  const paint = ((name: ColorName, text: string) =>
    enabled ? `${CODES[name]}${text}${CODES.reset}` : text) as Palette;
  paint.enabled = enabled;
  return paint;
}
