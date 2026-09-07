import { formatBytes, rules, rulesById } from "@jomae/catalog";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { MARK_PATH, MARK_VIEWBOX } from "@/components/logo";
import { ruleCardText } from "@/lib/og-card";
import { OG_PALETTE as C, tierColor } from "@/lib/og-palette";
import { ALL_PACKAGES } from "@/lib/packages";
import { site } from "@/lib/site";

/**
 * Every share card the site produces.
 *
 * Three layouts behind one route, chosen by which params arrive: a rule card
 * (?rule=), a report card (?bytes=&count=), and the default otherwise. One
 * route because they share the frame, the palette and the mark, and three
 * routes would drift apart the first time the frame changed.
 *
 * Satori lays this out, not a browser. Every container declares display flex
 * and a direction explicitly, and there are no fragments, because implicit
 * blocks and fragments do not resolve the way they would in CSS.
 */
export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: C.bg,
        color: C.fg,
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      {children}
    </div>
  );
}

/** The mark and the domain, on every card. */
function Masthead({ note }: { note?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg
          width={40}
          height={40}
          viewBox={MARK_VIEWBOX}
          fill="none"
          stroke={C.accent}
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={MARK_PATH} />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: C.accent,
            marginLeft: 10,
          }}
        >
          {site.domain}
        </div>
      </div>
      {note === undefined ? null : (
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: C.fgMuted,
            marginTop: 8,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

/** A tier dot and its label, matching the badges on the site. */
function TierLine({
  status,
  label,
  trailing,
}: {
  status: string;
  label: string;
  trailing?: string | null;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: 28 }}>
      <div
        style={{
          display: "flex",
          width: 16,
          height: 16,
          borderRadius: 8,
          background: tierColor(status),
        }}
      />
      <div style={{ display: "flex", color: C.fgMuted, marginLeft: 12 }}>
        {label}
        {trailing ? ` · ${trailing}` : ""}
      </div>
    </div>
  );
}

function ruleCard(id: string) {
  const rule = rulesById.get(id);
  if (!rule) return null;

  // The words come from lib/og-card.ts, which the tests hold to a length
  // budget. Satori reports no overflow, so that budget is the only guard.
  const card = ruleCardText(rule);

  return (
    <Frame>
      <Masthead note={card.title} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 38,
            color: C.fgMuted,
            lineHeight: 1.25,
          }}
        >
          {card.packages}
        </div>

        {/* Drawn rather than typed: a ↓ depends on the fallback font
            carrying the glyph, and a missing one renders as tofu. */}
        <svg
          width={34}
          height={34}
          viewBox="0 0 24 24"
          fill="none"
          stroke={C.accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginTop: 14, marginBottom: 6 }}
          aria-hidden="true"
        >
          <path d="M12 4v15M6 13l6 6 6-6" />
        </svg>

        <div
          style={{
            display: "flex",
            fontSize: 62,
            color: C.accent,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginTop: 6,
          }}
        >
          {card.native}
        </div>
      </div>

      <TierLine
        status={card.status}
        label={card.tierLabel}
        trailing={card.size}
      />
    </Frame>
  );
}

function reportCard(bytes: number, count: number, project: string | undefined) {
  return (
    <Frame>
      <Masthead note={project ?? site.tagline} />

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
            Nothing here the
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            platform covers yet
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 44, color: C.fgMuted }}>
            up to
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 150,
              lineHeight: 1.05,
              letterSpacing: "-0.045em",
              color: C.accent,
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
            that the platform now does natively
          </div>
        </div>
      )}

      <div style={{ display: "flex", fontSize: 26, color: C.fgMuted }}>
        {count === 0
          ? "Checked against the whole rule catalog"
          : `Across ${count} ${count === 1 ? "dependency" : "dependencies"} · minified and gzipped`}
      </div>
    </Frame>
  );
}

function defaultCard() {
  return (
    <Frame>
      <Masthead note={site.tagline} />

      {/* One wrapping line rather than two hand-split ones: the sentence is
          longer than the card is wide, so a hand-split second line wrapped
          anyway and the break was decided twice. */}
      <div
        style={{
          display: "flex",
          fontSize: 76,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          maxWidth: 950,
        }}
      >
        Find the native feature that replaces your dependencies
      </div>

      <div style={{ display: "flex", fontSize: 28, color: C.fgMuted }}>
        {`${rules.length} rules · ${ALL_PACKAGES.length} packages · support derived from web-features`}
      </div>
    </Frame>
  );
}

/** A non-negative integer from a query param, 0 for anything else. */
function positiveInt(value: string | null): number {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function pickCard(params: URLSearchParams) {
  const ruleId = params.get("rule");
  if (ruleId) {
    // An unknown id falls back rather than erroring: a share card is the
    // wrong place to surface a 500, and a stale link should still render.
    return ruleCard(ruleId) ?? defaultCard();
  }

  if (params.has("bytes") || params.has("count")) {
    return reportCard(
      positiveInt(params.get("bytes")),
      positiveInt(params.get("count")),
      params.get("project")?.slice(0, 60) ?? undefined,
    );
  }

  return defaultCard();
}

export function GET(request: NextRequest) {
  return new ImageResponse(pickCard(request.nextUrl.searchParams), SIZE);
}
