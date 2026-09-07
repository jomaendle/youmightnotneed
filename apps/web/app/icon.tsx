import { ImageResponse } from "next/og";
import { MARK_PATH, MARK_VIEWBOX } from "@/components/logo";

/**
 * The browser-tab icon: the same brace as the header, on the brand tile.
 *
 * Satori draws this rather than a browser. The geometry still comes from
 * components/logo.tsx, so the tab and the header cannot drift apart.
 *
 * The stroke is heavier than the header's. At 32px, scaled down to 16 by the
 * browser, the header weight thins out to nothing.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const BG = "#0d1017";
const ACCENT = "#2997ff";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BG,
        borderRadius: 7,
      }}
    >
      <svg
        width={24}
        height={24}
        viewBox={MARK_VIEWBOX}
        fill="none"
        stroke={ACCENT}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={MARK_PATH} />
      </svg>
    </div>,
    size,
  );
}
