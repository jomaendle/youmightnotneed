import type {
  BaselineHistoryEntry,
  BaselineStatus,
  TierShare,
} from "@jomae/catalog";
import { tierShareOf } from "@jomae/catalog";
import { BaselineBadge } from "@/components/baseline-badge";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const name = MONTH_NAMES[Number(monthNum) - 1] ?? month;
  return `${name} ${year}`;
}

const WIDTH = 480;
const HEIGHT = 96;
const PADDING = 4;

/**
 * One line per tier. Each gets a dash pattern as well as a colour, because
 * the rest of the site never lets colour carry a tier on its own (the badges
 * give each one a different glyph shape), and these three colours are the
 * green, amber and red that are hardest to tell apart.
 */
const LINES = [
  {
    status: "widely",
    stroke: "var(--c-widely)",
    dash: undefined,
    pick: (share: TierShare) => share.widely,
  },
  {
    status: "newly",
    stroke: "var(--c-newly)",
    dash: "6 3",
    pick: (share: TierShare) => share.newly,
  },
  {
    status: "limited",
    stroke: "var(--c-limited)",
    dash: "2 3",
    pick: (share: TierShare) => share.limited,
  },
] as const satisfies readonly {
  status: BaselineStatus;
  stroke: string;
  dash: string | undefined;
  pick: (share: TierShare) => number;
}[];

function points(
  entries: readonly BaselineHistoryEntry[],
  pick: (share: ReturnType<typeof tierShareOf>) => number,
): string {
  const usableWidth = WIDTH - PADDING * 2;
  const usableHeight = HEIGHT - PADDING * 2;
  return entries
    .map((entry, index) => {
      const x =
        entries.length === 1
          ? PADDING
          : PADDING + (index / (entries.length - 1)) * usableWidth;
      const share = pick(tierShareOf(entry));
      const y = PADDING + usableHeight * (1 - share / 100);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Homepage-only sparkline of Baseline tier share over the tracked months. */
export function TierHistorySparkline({
  entries,
}: {
  entries: readonly BaselineHistoryEntry[];
}) {
  if (entries.length === 0) return null;

  const latest = entries[entries.length - 1];
  if (!latest) return null;
  const latestShare = tierShareOf(latest);

  if (entries.length === 1) {
    return (
      <div className="mt-6">
        <p className="text-compact text-fg-muted">
          {Math.round(latestShare.widely)}% widely available,{" "}
          {Math.round(latestShare.newly)}% newly available,{" "}
          {Math.round(latestShare.limited)}% limited.
        </p>
        <p className="mt-1 text-fg-faint text-metadata">
          Tracking started in {formatMonth(latest.month)}. Check back next month
          for a trend.
        </p>
      </div>
    );
  }

  const first = entries[0];
  if (!first) return null;

  // Named by the range it actually covers rather than a count of months: the
  // refresh runs monthly, but a skipped run would make "over N months" a
  // claim the data does not support.
  const ariaLabel = `Baseline tier share, ${formatMonth(first.month)} to ${formatMonth(latest.month)}: currently ${Math.round(latestShare.widely)}% widely available, ${Math.round(latestShare.newly)}% newly available, ${Math.round(latestShare.limited)}% limited.`;

  return (
    <div className="mt-6">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-24 w-full max-w-[480px]"
      >
        {LINES.map((line) => (
          <polyline
            key={line.status}
            points={points(entries, line.pick)}
            fill="none"
            stroke={line.stroke}
            strokeWidth="2"
            strokeDasharray={line.dash}
          />
        ))}
      </svg>

      {/* Each row pairs a swatch drawn with its line's own dash pattern with
          the badge's glyph shape and spelled-out label, so a reader can match
          a line to a tier without telling the three colours apart. */}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {LINES.map((line) => (
          <li key={line.status} className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 2"
              className="h-0.5 w-6 flex-none"
            >
              <line
                x1="0"
                y1="1"
                x2="24"
                y2="1"
                stroke={line.stroke}
                strokeWidth="2"
                strokeDasharray={line.dash}
              />
            </svg>
            <BaselineBadge status={line.status} short={true} />
          </li>
        ))}
      </ul>

      <p className="mt-2 text-fg-faint text-metadata">
        Tracked since {formatMonth(first.month)}.
      </p>
    </div>
  );
}
