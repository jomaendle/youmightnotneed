import type { BaselineHistoryEntry } from "@jomae/catalog";
import { tierShareOf } from "@jomae/catalog";

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
        <polyline
          points={points(entries, (share) => share.widely)}
          fill="none"
          stroke="var(--c-widely)"
          strokeWidth="2"
        />
        <polyline
          points={points(entries, (share) => share.newly)}
          fill="none"
          stroke="var(--c-newly)"
          strokeWidth="2"
        />
        <polyline
          points={points(entries, (share) => share.limited)}
          fill="none"
          stroke="var(--c-limited)"
          strokeWidth="2"
        />
      </svg>
      <p className="mt-2 text-fg-faint text-metadata">
        Tracked since {formatMonth(first.month)}.
      </p>
    </div>
  );
}
