import {
  formatBytes,
  packageSizes,
  resolveBaseline,
  rules,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { BaselineBadge } from "@/components/baseline-badge";
import { TierHelp } from "@/components/tier-help";
import { TIERS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Rules",
  description:
    "Every native replacement in the catalog, grouped by how well it is supported.",
};

function weight(replaces: readonly string[]): number {
  return replaces.reduce(
    (total, pkg) => total + (packageSizes.sizes[pkg]?.gzip ?? 0),
    0,
  );
}

const FILTERS = [
  { id: "filter-all", label: "All" },
  { id: "filter-widely", label: "Safe today" },
  { id: "filter-newly", label: "Newly available" },
  { id: "filter-limited", label: "Bleeding edge" },
] as const;

export default function RulesPage() {
  const withBaseline = rules.map((rule) => ({
    rule,
    status: resolveBaseline(rule).status,
  }));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="mb-4 text-page-title">The rule catalog</h1>
        <p className="max-w-[60ch] text-fg-muted text-lede">
          {rules.length} rules. Each maps a set of npm packages to the native
          approach that covers the same ground, and states where the package is
          still the better choice.
        </p>
      </header>

      {/*
        The filter is radios plus :has() in globals.css. It ships no
        JavaScript, and it keeps working with JavaScript disabled.
      */}
      <div className="catalog">
        <fieldset className="hairline flex flex-wrap items-center gap-2 pt-6 pb-2">
          <legend className="sr-only">Filter by support tier</legend>
          {FILTERS.map((filter, index) => (
            <span key={filter.id} className="relative">
              <input
                type="radio"
                name="tier-filter"
                id={filter.id}
                className="filter-input"
                defaultChecked={index === 0}
              />
              <label htmlFor={filter.id} className="filter-label">
                {filter.label}
              </label>
            </span>
          ))}
          <span className="ml-auto">
            <TierHelp />
          </span>
        </fieldset>

        {TIERS.map((tier) => {
          const inTier = withBaseline
            .filter((entry) => entry.status === tier.status)
            .sort((a, b) => weight(b.rule.replaces) - weight(a.rule.replaces));
          if (inTier.length === 0) return null;

          return (
            <section
              key={tier.status}
              data-tier-group={tier.status}
              className="pt-10"
            >
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
                <h2 className="text-section">{tier.verdict}</h2>
                <BaselineBadge status={tier.status} short={true} />
              </div>
              <p className="mb-2 max-w-[60ch] text-compact text-fg-muted">
                {tier.note}
              </p>

              <ul className="rule-list">
                {inTier.map(({ rule, status }) => (
                  <li key={rule.id} data-tier={status}>
                    <Link
                      href={`/rules/${rule.id}`}
                      className="plain group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5 no-underline"
                    >
                      <span className="flex-1 basis-64">
                        <span className="block group-hover:underline">
                          {rule.title}
                        </span>
                        <span className="block font-mono text-accent text-metadata">
                          {rule.native}
                        </span>
                      </span>
                      <span className="text-fg-faint text-metadata tabular-nums">
                        {rule.replaces.length}{" "}
                        {rule.replaces.length === 1 ? "package" : "packages"}
                        {weight(rule.replaces) > 0
                          ? ` · up to ${formatBytes(weight(rule.replaces))}`
                          : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="hairline pt-8">
        <h2 className="mb-2 text-subsection">Why a rule sits in a tier</h2>
        <p className="max-w-[62ch] text-compact text-fg-muted">
          A rule is only as available as its least-supported required feature. A
          tooltip needs the Popover API and CSS anchor positioning, and anchor
          positioning has not reached Baseline, so the whole rule reads as
          limited even though half of it is available everywhere. The weakest
          link is what decides whether you can ship it.
        </p>
      </section>
    </div>
  );
}
