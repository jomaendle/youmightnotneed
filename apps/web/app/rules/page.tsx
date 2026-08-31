import {
  type BaselineStatus,
  formatBytes,
  packageSizes,
  resolveBaseline,
  rules,
} from "@youmightnotneed/catalog";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rules",
  description:
    "Every CSS and HTML replacement in the catalog, grouped by how well it is supported.",
};

const TIERS: { status: BaselineStatus; heading: string; note: string }[] = [
  {
    status: "widely",
    heading: "Baseline widely available",
    note: "Safe to use today.",
  },
  {
    status: "newly",
    heading: "Baseline newly available",
    note: "In every engine, but recently. Check your support target.",
  },
  {
    status: "limited",
    heading: "Limited availability",
    note: "Not in every engine. Needs a fallback.",
  },
  { status: "unknown", heading: "Unverified", note: "Could not be resolved." },
];

/** Rough weight of a rule: what its packages would cost if you had them all. */
function ruleWeight(replaces: readonly string[]): number {
  return replaces.reduce(
    (total, pkg) => total + (packageSizes.sizes[pkg]?.gzip ?? 0),
    0,
  );
}

export default function RulesPage() {
  const withBaseline = rules.map((rule) => ({
    rule,
    baseline: resolveBaseline(rule),
  }));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="mb-3 font-semibold text-3xl tracking-tight">
          The rule catalog
        </h1>
        <p className="max-w-xl text-muted leading-relaxed">
          {rules.length} rules. Each one maps a set of npm packages to the
          native approach that covers the same ground, and states the conditions
          where the package is still the better choice.
        </p>
      </header>

      {TIERS.map((tier) => {
        const inTier = withBaseline
          .filter((entry) => entry.baseline.status === tier.status)
          .sort(
            (a, b) => ruleWeight(b.rule.replaces) - ruleWeight(a.rule.replaces),
          );
        if (inTier.length === 0) return null;

        return (
          <section key={tier.status} className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 className="font-semibold text-xl tracking-tight">
                {tier.heading}
              </h2>
              <p className="text-muted text-sm">{tier.note}</p>
            </div>

            <ul className="space-y-2">
              {inTier.map(({ rule }) => (
                <li key={rule.id}>
                  <Link
                    href={`/rules/${rule.id}`}
                    className="block rounded-lg border border-border bg-surface p-4 no-underline transition-colors hover:border-link/50"
                  >
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-medium text-text">{rule.title}</h3>
                      <span className="font-mono text-faint text-xs">
                        {rule.replaces.length}{" "}
                        {rule.replaces.length === 1 ? "package" : "packages"}
                        {ruleWeight(rule.replaces) > 0 &&
                          `, up to ${formatBytes(ruleWeight(rule.replaces))}`}
                      </span>
                    </div>
                    <p className="font-mono text-link text-sm">{rule.native}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="rounded-xl border border-border bg-surface/50 p-5">
        <h2 className="mb-2 font-semibold text-base">A note on the tiers</h2>
        <p className="text-muted text-sm leading-relaxed">
          A rule sits in the tier of its least-supported required feature. A
          tooltip needs both the Popover API and anchor positioning, and anchor
          positioning has not reached Baseline, so the whole rule reads as
          limited even though half of it is available everywhere. That is
          deliberate: the weakest link decides whether you can ship it.
        </p>
      </section>
    </div>
  );
}
