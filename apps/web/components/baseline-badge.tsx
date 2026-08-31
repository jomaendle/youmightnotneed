import type { BaselineStatus } from "@jomae/catalog";
import { TIERS_BY_STATUS } from "@/lib/tiers";

/**
 * The support badge. Every finding renders one.
 *
 * Colour is never the only cue: each tier also gets a different glyph shape
 * from the .badge rules in globals.css, and the label is always spelled out.
 */
export function BaselineBadge({
  status,
  short = false,
}: {
  status: BaselineStatus;
  short?: boolean;
}) {
  const tier = TIERS_BY_STATUS[status];
  return (
    <span className={`badge ${tier.cssTier} ${tier.cssGlyph}`}>
      {short ? tier.short : tier.formal}
    </span>
  );
}
