import { TIERS } from "@/lib/tiers";

/**
 * Explains the three support tiers a visitor can actually choose between.
 * "unknown" is a catalog data gap, not a tier a reader picks, so it is left
 * out here even though TIERS carries it for the report and the badge.
 *
 * Uses the Popover API for the top layer, light dismiss and Escape handling,
 * with CSS anchor positioning to tether it to the trigger. No JavaScript, and
 * no positioning library. Anchor positioning is not Baseline yet, so where it
 * is missing the popover still opens, just centred rather than tethered.
 */
export function TierHelp() {
  return (
    <>
      <button
        type="button"
        popoverTarget="tier-help"
        className="anchor-trigger cursor-pointer text-fg-faint text-metadata underline decoration-dotted underline-offset-4 hover:text-fg"
      >
        What do the tiers mean?
      </button>

      <div id="tier-help" popover="auto" className="anchor-popover">
        <dl className="space-y-2.5">
          {TIERS.filter((tier) => tier.status !== "unknown").map((tier) => (
            <div key={tier.status}>
              <dt
                className={`badge ${tier.cssTier} ${tier.cssGlyph} font-medium`}
              >
                {tier.formal}
              </dt>
              <dd className="mt-1 text-fg-muted">{tier.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
