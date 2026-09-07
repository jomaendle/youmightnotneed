import {
  formatBytes,
  packageSizes,
  type Rule,
  resolveBaseline,
} from "@jomae/catalog";
import { TIERS_BY_STATUS } from "./tiers";

/**
 * The words on a rule's share card.
 *
 * Separated from the drawing in app/api/og/route.tsx so the content can be
 * checked without rasterising 56 PNGs. Satori gives no overflow signal: a
 * string too long for the frame is silently clipped or pushes the tier line
 * off the bottom, and nobody sees it until the card is already being shared.
 * The budgets below are what the tests assert against.
 */

/** Beyond this the packages line wraps into the headline and the card breaks. */
export const MAX_PACKAGES_SHOWN = 3;

/**
 * Character budgets, measured against the worst cases already in the catalog
 * rendered at 1200x630: `carousel-scroll-markers` has the longest `native` at
 * 60 characters and wraps to two lines with room under it. These leave
 * headroom on top of that, so they fail before a card actually breaks.
 */
export const MAX_NATIVE_CHARS = 72;
export const MAX_PACKAGES_CHARS = 90;

export interface RuleCardText {
  title: string;
  /** The matched packages, truncated with a count of the rest. */
  packages: string;
  native: string;
  tierLabel: string;
  status: string;
  /** "up to 7.5 kB", or null when no package in the rule has a known size. */
  size: string | null;
}

export function ruleCardText(rule: Rule): RuleCardText {
  const shown = rule.replaces.slice(0, MAX_PACKAGES_SHOWN).join(", ");
  const rest = rule.replaces.length - MAX_PACKAGES_SHOWN;

  const bytes = rule.replaces.reduce(
    (total, name) => total + (packageSizes.sizes[name]?.gzip ?? 0),
    0,
  );

  const status = resolveBaseline(rule).status;

  return {
    title: rule.title,
    packages: rest > 0 ? `${shown} and ${rest} more` : shown,
    native: rule.native,
    tierLabel: TIERS_BY_STATUS[status]?.short ?? "Support unverified",
    status,
    size: bytes > 0 ? `up to ${formatBytes(bytes)}` : null,
  };
}
