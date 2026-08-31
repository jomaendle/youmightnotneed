import type { BaselineStatus } from "@youmightnotneed/catalog";

/**
 * The support badge. Every finding renders one, always. The first reply to any
 * post about this tool will be "but Safari", so the answer sits next to the
 * claim rather than in a footnote.
 */

const STYLES: Record<
  BaselineStatus,
  { label: string; short: string; className: string }
> = {
  widely: {
    label: "Baseline widely available",
    short: "Widely available",
    className: "bg-widely-dim text-widely",
  },
  newly: {
    label: "Baseline newly available",
    short: "Newly available",
    className: "bg-newly-dim text-newly",
  },
  limited: {
    label: "Limited availability",
    short: "Limited",
    className: "bg-limited-dim text-limited",
  },
  unknown: {
    label: "Support unverified",
    short: "Unverified",
    className: "bg-unknown-dim text-unknown",
  },
};

export function BaselineBadge({
  status,
  short = false,
}: {
  status: BaselineStatus;
  short?: boolean;
}) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-xs ${style.className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {short ? style.short : style.label}
    </span>
  );
}

export function baselineTierLabel(status: BaselineStatus): string {
  return STYLES[status].label;
}
