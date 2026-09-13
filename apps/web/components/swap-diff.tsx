import {
  formatBytes,
  packageSizes,
  resolveBaseline,
  rules,
} from "@jomae/catalog";
import { TIERS_BY_STATUS } from "@/lib/tiers";

interface Swap {
  id: string;
  pkg: string;
  /** Already formatted, by the same function the report uses. */
  size: string;
  bytes: number;
  native: string;
  status: ReturnType<typeof resolveBaseline>["status"];
}

/**
 * The rows, heaviest first.
 *
 * Ranked on the package actually shown rather than on the rule's total across
 * everything it replaces. Ranking on the total and then printing one package
 * put the sizes out of order on screen, which reads as a sorting bug: the
 * numbers a reader can see have to be the numbers the order came from.
 *
 * One row per rule, so a rule claiming ten carousel libraries cannot fill the
 * panel on its own and the range of what the platform covers is what shows.
 *
 * A package with no size in the snapshot is dropped, not treated as weighing
 * nothing. Six packages are in that state today. Sorting them as zero would
 * push them out of view, which is the failure hiding itself; printing them
 * would put "0.0 kB" next to a real package name in the largest type on the
 * page and undercount the total beside it.
 */
function topSwaps(count: number): Swap[] {
  return rules
    .map((rule) => {
      const sized = rule.replaces
        .map((pkg) => ({ pkg, bytes: packageSizes.sizes[pkg]?.gzip }))
        .filter(
          (entry): entry is { pkg: string; bytes: number } =>
            entry.bytes !== undefined,
        )
        .sort((a, b) => b.bytes - a.bytes)[0];

      if (!sized) return null;

      return {
        id: rule.id,
        pkg: sized.pkg,
        size: formatBytes(sized.bytes),
        bytes: sized.bytes,
        native: rule.native,
        status: resolveBaseline(rule).status,
      };
    })
    .filter((swap): swap is Swap => swap !== null)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, count);
}

/**
 * The hero's demonstration: a diff of a package.json against the platform.
 *
 * The product is a deletion, and this audience reads diffs all day, so the
 * form needs no caption. Minus lines carry what leaves and what it weighed,
 * plus lines what the browser already has and whether it is safe yet.
 *
 * Every value is derived: the packages and sizes come from the committed
 * bundlephobia snapshot, formatted by the same formatBytes the report uses so
 * the two cannot disagree, and the tier from resolveBaseline.
 *
 * `rows` is six because that is what balances the panel against the headline
 * column beside it. Nothing else calls this.
 */
export function SwapDiff({ rows = 6 }: { rows?: number }) {
  const swaps = topSwaps(rows);
  const total = swaps.reduce((sum, swap) => sum + swap.bytes, 0);

  return (
    <figure className="swap-diff overflow-hidden rounded-lg border border-border bg-bg-subtle font-mono text-compact">
      <figcaption className="flex items-baseline justify-between border-border border-b px-4 py-2 text-fg-faint text-metadata">
        <span>package.json</span>
        {/*
          "up to", because having a package installed is not proof of how it
          is used, and three of these rows need a fallback anyway. Every other
          surface phrases a size this way and this is the most prominent one
          on the site.
        */}
        <span className="tabular-nums">up to {formatBytes(total)}</span>
      </figcaption>

      <ul>
        {swaps.map((swap) => (
          <li key={swap.id} className="swap-diff-pair">
            <p className="swap-diff-line swap-diff-minus">
              {/*
                The +/- glyphs are decoration for anyone who cannot see the
                colour, so each line says in words which half it is. Without
                this a screen reader reads a package name and a feature name
                with nothing marking which one leaves.
              */}
              <span aria-hidden="true" className="swap-diff-sign">
                {"−"}
              </span>
              <span className="sr-only">Remove</span>
              <span
                title={swap.pkg}
                className="swap-diff-text line-through decoration-1"
              >
                "{swap.pkg}"
              </span>
              <span className="swap-diff-meta tabular-nums">{swap.size}</span>
            </p>
            <p className="swap-diff-line swap-diff-plus">
              <span aria-hidden="true" className="swap-diff-sign">
                +
              </span>
              <span className="sr-only">Use instead</span>
              {/* Truncated on purpose, so the full name needs somewhere to live. */}
              <span title={swap.native} className="swap-diff-text">
                {swap.native}
              </span>
              <span className={`swap-diff-meta tier-${swap.status}`}>
                <span aria-hidden="true" className="tier-dot" />{" "}
                {TIERS_BY_STATUS[swap.status].verdict}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </figure>
  );
}
