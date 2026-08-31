import { ImageResponse } from "next/og";

/**
 * Generated, not drawn: a curly brace, the one character every CSS rule on
 * this site actually needs. Same palette as the OG card in api/og/route.tsx.
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
      <div
        style={{
          display: "flex",
          fontSize: 24,
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
