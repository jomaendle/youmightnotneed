/**
 * The site palette as sRGB hex, for the images Satori draws.
 *
 * globals.css states every colour in oklch, which is right for the site and
 * unusable here: Satori parses neither oklch nor var(). These values are the
 * same tokens resolved through a browser, so the OG cards and the favicon
 * match the page rather than approximating it by eye.
 *
 * Dark values only. The cards have one appearance wherever they are shown,
 * and a share preview in a light-mode client still renders the dark card.
 *
 * Re-resolve by reading the computed colour of an element set to
 * `var(--c-accent)` and friends, rather than converting the oklch by hand.
 */
export const OG_PALETTE = {
  bg: "#0a0b0d",
  bgSubtle: "#101214",
  border: "#222428",
  fg: "#f1f2f3",
  fgMuted: "#a8abb0",
  fgFaint: "#86898e",
  accent: "#42a3fd",
  widely: "#59d38c",
  newly: "#f0ba59",
  limited: "#fb8274",
  unknown: "#86898e",
} as const;

/** The dot colour for a support tier, matching the badges on the site. */
export function tierColor(status: string): string {
  if (status === "widely") return OG_PALETTE.widely;
  if (status === "newly") return OG_PALETTE.newly;
  if (status === "limited") return OG_PALETTE.limited;
  return OG_PALETTE.unknown;
}
