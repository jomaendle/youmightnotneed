import { packageSizes, resolveBaseline, rules } from "@jomae/catalog";
import { TIERS_BY_STATUS } from "@/lib/tiers";

/**
 * The hero's demonstration: a diff of a package.json against the platform.
 *
 * The product is a deletion, and this audience reads diffs all day, so the
 * form needs no caption. Minus lines carry what leaves and what it weighed,
 * plus lines carry what the browser already has and whether it is safe yet.
 *
 * Every value is real and derived. The rules are the heaviest in the catalog,
 * the sizes come from the committed bundlephobia snapshot, and the tier comes
 * from resolveBaseline, so this cannot drift from what the report would say.
 */

function weight(rule: (typeof rules)[number]): number {
  return rule.replaces.reduce(
    (total, pkg) => total + (packageSizes.sizes[pkg]?.gzip ?? 0),
    0,
  );
}

interface Swap {
  id: string;
  pkg: string;
  kb: number;
  native: string;
  status: ReturnType<typeof resolveBaseline>["status"];
}

/**
 * The heaviest package each of the top rules can replace.
 *
 * One row per rule rather than per package: a rule claiming ten carousel
 * libraries would otherwise fill the panel on its own, and the point is the
 * range of things the platform covers.
 */
function topSwaps(count: number): Swap[] {
  return [...rules]
    .sort((a, b) => weight(b) - weight(a))
    .slice(0, count)
    .map((rule) => {
      const pkg = [...rule.replaces].sort(
        (a, b) =>
          (packageSizes.sizes[b]?.gzip ?? 0) -
          (packageSizes.sizes[a]?.gzip ?? 0),
      )[0] as string;

      return {
        id: rule.id,
        pkg,
        kb: (packageSizes.sizes[pkg]?.gzip ?? 0) / 1024,
        native: rule.native,
        status: resolveBaseline(rule).status,
      };
    });
}

export function SwapDiff({ rows = 6 }: { rows?: number }) {
  const swaps = topSwaps(rows);
  const total = swaps.reduce((sum, swap) => sum + swap.kb, 0);

  return (
    <figure className="swap-diff overflow-hidden rounded-lg border border-border bg-bg-subtle font-mono text-compact">
      <figcaption className="flex items-baseline justify-between border-border border-b px-4 py-2 text-fg-faint text-metadata">
        <span>package.json</span>
        <span className="tabular-nums">
          {"−"}
          {total.toFixed(1)} kB
        </span>
      </figcaption>

      <ul>
        {swaps.map((swap) => (
          <li key={swap.id} className="swap-diff-pair">
            <p className="swap-diff-line swap-diff-minus">
              <span aria-hidden="true" className="swap-diff-sign">
                {"−"}
              </span>
              <span className="swap-diff-text line-through decoration-1">
                "{swap.pkg}"
              </span>
              <span className="swap-diff-meta tabular-nums">
                {swap.kb.toFixed(1)} kB
              </span>
            </p>
            <p className="swap-diff-line swap-diff-plus">
              <span aria-hidden="true" className="swap-diff-sign">
                +
              </span>
              <span className="swap-diff-text">{swap.native}</span>
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
