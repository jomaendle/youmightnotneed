import type { BaselineStatus } from "@jomae/catalog";

/**
 * Tier presentation. The single source of truth for every surface that
 * renders a support tier: the report, the catalog index, the tier legend
 * and the badge itself. Duplicating this per component is how a badge and
 * its own legend end up saying different things about the same tier.
 */
export interface TierMeta {
  status: BaselineStatus;
  /** Heading used on the report, where the reader wants a verdict. */
  verdict: string;
  /** Full Baseline term: the catalog heading and the badge's long label. */
  formal: string;
  /** Short badge label, used wherever space is tight. */
  short: string;
  note: string;
  /** .badge modifier classes: base tier colour and glyph shape. */
  cssTier: string;
  cssGlyph: string;
}

export const TIERS: readonly TierMeta[] = [
  {
    status: "widely",
    verdict: "Safe today",
    formal: "Baseline widely available",
    short: "Widely available",
    note: "In every major engine for years. Use these without a fallback.",
    cssTier: "tier-widely",
    cssGlyph: "is-widely",
  },
  {
    status: "newly",
    verdict: "Newly available",
    formal: "Baseline newly available",
    short: "Newly available",
    note: "In every major engine, but recently. Check your support target.",
    cssTier: "tier-newly",
    cssGlyph: "is-newly",
  },
  {
    status: "limited",
    verdict: "Bleeding edge",
    formal: "Limited availability",
    short: "Limited availability",
    note: "Missing from at least one engine. These need a fallback.",
    cssTier: "tier-limited",
    cssGlyph: "is-limited",
  },
  {
    status: "unknown",
    verdict: "Unverified",
    formal: "Support unverified",
    short: "Unverified",
    note: "The catalog could not resolve support for these.",
    cssTier: "tier-unknown",
    cssGlyph: "is-unknown",
  },
];

export const TIERS_BY_STATUS: Readonly<Record<BaselineStatus, TierMeta>> =
  Object.fromEntries(TIERS.map((tier) => [tier.status, tier])) as Record<
    BaselineStatus,
    TierMeta
  >;
