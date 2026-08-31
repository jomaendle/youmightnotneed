import type { BaselineStatus } from "@jomae/catalog";

/**
 * The support badge. Every finding renders one.
 *
 * Colour is never the only cue: each tier also gets a different glyph shape
 * from the .badge rules in globals.css, and the label is always spelled out.
 */

const TIERS: Record<
  BaselineStatus,
  { label: string; short: string; tier: string; glyph: string }
> = {
  widely: {
    label: "Baseline widely available",
    short: "Widely available",
    tier: "tier-widely",
    glyph: "is-widely",
  },
  newly: {
    label: "Baseline newly available",
    short: "Newly available",
    tier: "tier-newly",
    glyph: "is-newly",
  },
  limited: {
    label: "Limited availability",
    short: "Limited availability",
    tier: "tier-limited",
    glyph: "is-limited",
  },
  unknown: {
    label: "Support unverified",
    short: "Unverified",
    tier: "tier-unknown",
    glyph: "is-unknown",
  },
};

export function BaselineBadge({
  status,
  short = false,
}: {
  status: BaselineStatus;
  short?: boolean;
}) {
  const tier = TIERS[status];
  return (
    <span className={`badge ${tier.tier} ${tier.glyph}`}>
      {short ? tier.short : tier.label}
    </span>
  );
}
