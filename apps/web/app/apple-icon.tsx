import { ImageResponse } from "next/og";
import { MARK_PATH, MARK_VIEWBOX } from "@/components/logo";

/**
 * The same mark, scaled up for iOS home-screen bookmarks. iOS applies its own
 * corner radius, so this tile is square. The stroke is lighter than the
 * favicon's: nothing is shrinking this one, so it can carry the header's
 * proportions.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BG = "#0d1017";
const ACCENT = "#2997ff";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BG,
      }}
    >
      <svg
        width={124}
        height={124}
        viewBox={MARK_VIEWBOX}
        fill="none"
        stroke={ACCENT}
        strokeWidth={2.1}
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
