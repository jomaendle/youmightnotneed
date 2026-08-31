/**
 * Explains the three support tiers.
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
          <div>
            <dt className="badge tier-widely is-widely font-medium">
              Baseline widely available
            </dt>
            <dd className="mt-1 text-fg-muted">
              In every major engine for at least two and a half years. Safe.
            </dd>
          </div>
          <div>
            <dt className="badge tier-newly is-newly font-medium">
              Baseline newly available
            </dt>
            <dd className="mt-1 text-fg-muted">
              In every major engine, but recently. Check your support target.
            </dd>
          </div>
          <div>
            <dt className="badge tier-limited is-limited font-medium">
              Limited availability
            </dt>
            <dd className="mt-1 text-fg-muted">
              Missing from at least one engine. Needs a fallback.
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
