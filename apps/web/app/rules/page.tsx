import {
  CATEGORIES,
  formatBytes,
  packageSizes,
  resolveBaseline,
  rules,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { BaselineBadge } from "@/components/baseline-badge";
import { TierHelp } from "@/components/tier-help";
import { TIERS, TIERS_BY_STATUS } from "@/lib/tiers";

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

/** The statuses a reader can actually filter by. "unknown" is a data gap,
 * not a choice, so it is left out, matching TierHelp. */
const FILTERABLE_STATUSES = ["widely", "newly", "limited"] as const;

export default function RulesPage() {
  const withBaseline = rules.map((rule) => ({
    rule,
    status: resolveBaseline(rule).status,
  }));

  const tierCounts = new Map<string, number>();
  for (const entry of withBaseline) {
    tierCounts.set(entry.status, (tierCounts.get(entry.status) ?? 0) + 1);
  }

  const categoryCounts = new Map<string, number>();
  for (const rule of rules) {
    categoryCounts.set(
      rule.category,
      (categoryCounts.get(rule.category) ?? 0) + 1,
    );
  }

  /*
   * Tier and category filter independently, so some pairs select nothing at
   * all and the page would otherwise go blank with no explanation. CSS
   * cannot ask "is anything still visible", but the pairs that come up empty
   * are known here, so the empty state is revealed by naming them. Derived
   * from the rules rather than hardcoded, so it stays right as the catalog
   * grows.
   */
  const emptyPairs = FILTERABLE_STATUSES.flatMap((status) =>
    CATEGORIES.filter(
      (category) =>
        !withBaseline.some(
          (entry) =>
            entry.status === status && entry.rule.category === category.id,
        ),
    ).map(
      (category) =>
        `.catalog:has(#filter-${status}:checked):has(#cat-filter-${category.id}:checked) .catalog-empty`,
    ),
  );

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
          The filter is radios plus :has() in globals.css, scoped to the
          .catalog wrapper below. It ships no JavaScript, and it keeps
          working with JavaScript disabled.
        */}
      {emptyPairs.length === 0 ? null : (
        <style>{`${emptyPairs.join(",")}{display:block}`}</style>
      )}

      <div className="catalog rules-shell">
        <aside className="rules-sidebar">
          <fieldset className="sidebar-group">
            <legend className="sidebar-heading">Support tier</legend>
            <div className="sidebar-options">
              <div className="relative">
                <input
                  type="radio"
                  name="tier-filter"
                  id="filter-all"
                  className="filter-input"
                  defaultChecked={true}
                />
                <label htmlFor="filter-all" className="sidebar-row">
                  <span className="sidebar-row-label">All tiers</span>
                  <span className="sidebar-row-count">{rules.length}</span>
                </label>
              </div>
              {FILTERABLE_STATUSES.map((status) => {
                const tier = TIERS_BY_STATUS[status];
                return (
                  <div key={status} className="relative">
                    <input
                      type="radio"
                      name="tier-filter"
                      id={`filter-${status}`}
                      className="filter-input"
                    />
                    <label htmlFor={`filter-${status}`} className="sidebar-row">
                      <span
                        className={`sidebar-row-dot ${tier.cssTier}`}
                        aria-hidden="true"
                      />
                      <span className="sidebar-row-label">{tier.verdict}</span>
                      <span className="sidebar-row-count">
                        {tierCounts.get(status) ?? 0}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="sidebar-aside">
              <TierHelp />
            </div>
          </fieldset>

          <fieldset className="sidebar-group">
            <legend className="sidebar-heading">Category</legend>
            <div className="sidebar-options">
              <div className="relative">
                <input
                  type="radio"
                  name="cat-filter"
                  id="cat-filter-all"
                  className="filter-input"
                  defaultChecked={true}
                />
                <label htmlFor="cat-filter-all" className="sidebar-row">
                  <span className="sidebar-row-label">All categories</span>
                  <span className="sidebar-row-count">{rules.length}</span>
                </label>
              </div>
              {CATEGORIES.map((category) => (
                <div key={category.id} className="relative">
                  <input
                    type="radio"
                    name="cat-filter"
                    id={`cat-filter-${category.id}`}
                    className="filter-input"
                  />
                  <label
                    htmlFor={`cat-filter-${category.id}`}
                    className="sidebar-row"
                  >
                    <span className="sidebar-row-label">{category.name}</span>
                    <span className="sidebar-row-count">
                      {categoryCounts.get(category.id) ?? 0}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </aside>

        {/*
            A flex gap rather than padding on each group. Both filters hide
            groups with display: none, which takes them out of flex layout
            altogether, so the space only ever falls between two groups that
            are actually on screen. Padding could not tell the difference.
          */}
        <div className="flex flex-col gap-10">
          <p className="catalog-empty max-w-[52ch] text-fg-muted">
            No rule sits in both of those. Widen either filter to see the rest
            of the catalog.
          </p>

          {TIERS.map((tier) => {
            const inTier = withBaseline
              .filter((entry) => entry.status === tier.status)
              .sort(
                (a, b) => weight(b.rule.replaces) - weight(a.rule.replaces),
              );
            if (inTier.length === 0) return null;

            return (
              <section key={tier.status} data-tier-group={tier.status}>
                <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
                  <h2 className="text-section">{tier.verdict}</h2>
                  <BaselineBadge status={tier.status} short={true} />
                </div>
                <p className="mb-2 max-w-[60ch] text-compact text-fg-muted">
                  {tier.note}
                </p>

                <ul className="rule-list rule-columns">
                  {inTier.map(({ rule, status }) => (
                    <li
                      key={rule.id}
                      data-tier={status}
                      data-category={rule.category}
                    >
                      <Link
                        href={`/rules/${rule.id}`}
                        className="plain group flex flex-col gap-y-1 py-3.5 no-underline"
                      >
                        <span className="block group-hover:underline">
                          {rule.title}
                        </span>
                        <span className="block font-mono text-accent text-metadata">
                          {rule.native}
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
