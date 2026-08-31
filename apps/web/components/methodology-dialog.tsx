import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * How the numbers are produced.
 *
 * There is no JavaScript here at all. The button opens the dialog with an
 * invoker command (`command="show-modal"`), which is Baseline newly available,
 * and `closedby="any"` gives light dismiss so a backdrop click closes it
 * without the click handler the dialog rule warns you would otherwise need.
 *
 * The top layer, the backdrop, the focus trap, focus restore, Escape and the
 * inert background are all the platform. The enter and exit transitions are
 * @starting-style and transition-behavior: allow-discrete in globals.css.
 *
 * Fallback: a browser without invoker commands leaves the button inert. The
 * provenance that matters most, the data dates and the web-features version,
 * is printed in the page footer either way.
 */

/** React does not type these HTML attributes yet. */
type InvokerButtonProps = DetailedHTMLProps<
  HTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & { command?: string; commandfor?: string; type?: "button" };

type LightDismissDialogProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDialogElement>,
  HTMLDialogElement
> & { closedby?: string; open?: boolean };

const InvokerButton = "button" as unknown as React.FC<InvokerButtonProps>;
const Dialog = "dialog" as unknown as React.FC<LightDismissDialogProps>;

const DIALOG_ID = "methodology";

export function MethodologyDialog({
  baselineOn,
  webFeaturesVersion,
  sizesOn,
}: {
  baselineOn: string;
  webFeaturesVersion: string;
  sizesOn: string;
}) {
  return (
    <>
      <InvokerButton
        type="button"
        command="show-modal"
        commandfor={DIALOG_ID}
        className="cursor-pointer text-fg-faint text-metadata underline decoration-dotted underline-offset-4 hover:text-fg"
      >
        How this is measured
      </InvokerButton>

      <Dialog id={DIALOG_ID} closedby="any" aria-labelledby="methodology-title">
        <div className="p-6">
          <h2
            id="methodology-title"
            className="mb-4 text-section tracking-tight"
          >
            How this is measured
          </h2>

          <div className="space-y-3 text-compact text-fg-muted">
            <p>
              Your dependency names are matched against the catalog. Version
              ranges are ignored, nothing else in the file is read, and nothing
              is stored: the report is encoded in its own URL.
            </p>
            <p>
              Support status is resolved from web-features@{webFeaturesVersion},
              captured {baselineOn}. A rule reports the status of its
              least-supported required feature, so a rule needing two features
              is only as available as the worse one.
            </p>
            <p>
              Sizes are minified and gzipped, from bundlephobia, captured{" "}
              {sizesOn}. They describe a whole package, so a total assumes a
              full replacement. That is why every figure says "up to".
            </p>
            <p>
              A dependency being installed is not proof of what it is used for.
              Read each finding's conditions before changing anything.
            </p>
          </div>

          <div className="mt-6">
            <InvokerButton
              type="button"
              command="close"
              commandfor={DIALOG_ID}
              className="cursor-pointer rounded-md border border-border-strong px-3 py-1.5 text-compact hover:border-fg-faint"
            >
              Close
            </InvokerButton>
          </div>
        </div>
      </Dialog>
    </>
  );
}
