/**
 * The mark: a single curly brace, drawn rather than typeset.
 *
 * One brace and not a pair, because a favicon at 16px affords about two
 * strokes and `{}` or `</>` closes up into a smudge at that size. Drawn as an
 * explicit path so the weight, the curvature and the nib stay the same at
 * 16px and at 180px, which a font glyph does not promise across platforms.
 *
 * The geometry is exported alongside the component because the favicon, the
 * apple icon and the OG cards render through Satori rather than the DOM, and
 * they all have to draw the same shape.
 */

export const MARK_VIEWBOX = "0 0 24 24";

/**
 * Arms sweep out to x=16 and the nib reaches in to x=8.1, so the ink centres
 * on the 24-unit box even though a brace is an asymmetric shape. The halves
 * mirror around y=12.
 *
 * The nib depth is the one measurement that matters. Chosen against a sheet
 * of variants rendered at 180, 64, 32 and 16px: a shallower pinch reads fine
 * large and closes up into a plain bar in a browser tab, which is the size
 * that decides whether a favicon works at all.
 */
export const MARK_PATH =
  "M16 2.6C13.1 2.6 12.1 4.3 12.1 7L12.1 9.6C12.1 11.2 10.8 12 8.1 12C10.8 12 12.1 12.8 12.1 14.4L12.1 17C12.1 19.7 13.1 21.4 16 21.4";

/**
 * The header weight. Not exported: the favicon and the OG cards each pick
 * their own, because a stroke that reads at 180px disappears at 16.
 */
const MARK_STROKE_WIDTH = 2.1;

export function Mark({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={MARK_VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={MARK_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={MARK_PATH} />
    </svg>
  );
}
