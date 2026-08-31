import { formatBytes } from "@jomae/catalog";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/**
 * The OG card. The headline number and the project name are the distribution,
 * so this stays plain: one big figure, the hedge next to it, and the domain.
 *
 * Satori lays this out, not a browser. Every container declares display flex
 * and a direction explicitly, and there are no fragments, because implicit
 * blocks and fragments do not resolve the way they would in CSS.
 */
export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

const BG = "#0d1017";
const TEXT = "#eff1f5";
const MUTED = "#8b93a7";
const ACCENT = "#2997ff";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parsedBytes = Number.parseInt(params.get("bytes") ?? "0", 10);
  const parsedCount = Number.parseInt(params.get("count") ?? "0", 10);
  const project = params.get("project")?.slice(0, 60);

  const bytes =
    Number.isFinite(parsedBytes) && parsedBytes > 0 ? parsedBytes : 0;
  const count =
    Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BG,
        color: TEXT,
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 30, color: ACCENT }}>
          youmightnotneed.dev
        </div>
        <div
          style={{ display: "flex", fontSize: 26, color: MUTED, marginTop: 8 }}
        >
          {project ?? "Is it CSS yet?"}
        </div>
      </div>

      {count === 0 ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            Nothing here that CSS
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            covers yet
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 44, color: MUTED }}>
            up to
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 150,
              lineHeight: 1.05,
              letterSpacing: "-0.045em",
              color: ACCENT,
              marginTop: 4,
            }}
          >
            {formatBytes(bytes)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 50,
              letterSpacing: "-0.02em",
              marginTop: 10,
            }}
          >
            that CSS now does natively
          </div>
        </div>
      )}

      <div style={{ display: "flex", fontSize: 26, color: MUTED }}>
        {count === 0
          ? "Checked against the whole rule catalog"
          : `Across ${count} ${count === 1 ? "dependency" : "dependencies"} · minified and gzipped`}
      </div>
    </div>,
    SIZE,
  );
}
