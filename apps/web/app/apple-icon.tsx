import { ImageResponse } from "next/og";

/** Same mark as icon.tsx, scaled up for iOS home-screen bookmarks. */
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
      <div
        style={{
          display: "flex",
          fontSize: 130,
          fontWeight: 700,
          color: ACCENT,
          fontFamily: "sans-serif",
        }}
      >
        {"{}"}
      </div>
    </div>,
    size,
  );
}
