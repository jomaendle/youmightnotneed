import {
  CATEGORIES,
  formatBytes,
  packageSizes,
  resolveBaseline,
  resolveGuides,
  rules,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { BaselineBadge } from "@/components/baseline-badge";
import { TierHelp } from "@/components/tier-help";
import { ALL_PACKAGES } from "@/lib/packages";
import {
  countMatching,
  emptyCombinations,
  type FilterEntry,
  GUIDE_STATES,
} from "@/lib/rules-filter";
import { TIERS, TIERS_BY_STATUS } from "@/lib/tiers";

export const metadata: Metadata = {
  openGraph: {
    title: "The rule catalog",
    description:
      "Every native replacement in the catalog, grouped by how well it is supported.",
    url: "/rules",
  },
  alternates: { canonical: "/rules" },
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
    /*
     * Linkable rather than merely declared. A rule whose only guide ID has
     * lost its URL shows nothing on its own page, so filtering it in under
     * "has a guide" would send the reader somewhere with nothing to read.
     */
    hasGuide: resolveGuides(rule).some((guide) => guide.url !== null),
  }));

  const entries: FilterEntry[] = withBaseline.map((entry) => ({
    tier: entry.status,
    category: entry.rule.category,
    hasGuide: entry.hasGuide,
  }));

  const categoryStates = ["all", ...CATEGORIES.map((c) => c.id)];
  const tierStates = ["all", ...FILTERABLE_STATUSES];

  const count = (tier: string, category: string, guide: string) =>
    countMatching(entries, { tier, category, guide });

  /*
   * See lib/rules-filter.ts for why the counts are keyed this way. A row in
   * one group carries one span per combination of the other two groups, and
   * the selectors below reveal whichever one is currently true.
   */
  const countVisibility = [
    ".sidebar-row-count[data-count-cg],.sidebar-row-count[data-count-tg],.sidebar-row-count[data-count-tc]{display:none}",
    ...categoryStates.flatMap((category) =>
      GUIDE_STATES.map(
        (guide) =>
          `.catalog:has(#cat-filter-${category}:checked):has(#guide-filter-${guide}:checked) .sidebar-row-count[data-count-cg="${category}|${guide}"]{display:inline}`,
      ),
    ),
    ...tierStates.flatMap((tier) =>
      GUIDE_STATES.map(
        (guide) =>
          `.catalog:has(#filter-${tier}:checked):has(#guide-filter-${guide}:checked) .sidebar-row-count[data-count-tg="${tier}|${guide}"]{display:inline}`,
      ),
    ),
    ...tierStates.flatMap((tier) =>
      categoryStates.map(
        (category) =>
          `.catalog:has(#filter-${tier}:checked):has(#cat-filter-${category}:checked) .sidebar-row-count[data-count-tc="${tier}|${category}"]{display:inline}`,
      ),
    ),
  ].join("");

  /*
   * The combinations that select nothing, named so the empty state can be
   * revealed for them. Adding a third filter is what made this worth deriving
   * over the full cross product: "all tiers, this category, has a guide" is
   * reachable and empty, and the old pairwise version could not see it.
   */
  const emptySelectors = emptyCombinations(
    entries,
    tierStates,
    categoryStates,
  ).map(
    ({ tier, category, guide }) =>
      `.catalog:has(#filter-${tier}:checked):has(#cat-filter-${category}:checked):has(#guide-filter-${guide}:checked) .catalog-empty`,
  );

  /*
   * The guide filter's own hiding, generated rather than written out in
   * globals.css because it has to compose with the category filter and that
   * is one selector per category.
   *
   * The divider needs the same care the category filter already takes: a
   * hidden rule is still a DOM sibling, so `li + li` draws a border over
   * nothing once the first rule in a group is filtered out. Reset it, then
   * restate it as "has an earlier sibling that also survives", spelled out
   * per category because CSS cannot express the conjunction any other way.
   */
  const guideFiltering = [
    '.catalog:has(#guide-filter-has:checked) [data-guides="none"]{display:none}',
    `.catalog:has(#cat-filter-all:checked):has(#guide-filter-has:checked) [data-tier-group]:not(:has([data-guides="has"])){display:none}`,
    ...CATEGORIES.map(
      (category) =>
        `.catalog:has(#cat-filter-${category.id}:checked):has(#guide-filter-has:checked) [data-tier-group]:not(:has([data-category="${category.id}"][data-guides="has"])){display:none}`,
    ),
    ".catalog:has(#guide-filter-has:checked) .rule-list > li{border-block-start:0}",
    /*
     * The category filter's own restatement in globals.css carries two
     * attribute selectors, so it out-specifies the blanket reset above and
     * kept drawing a divider over the first surviving rule. Reset again in
     * the same shape, which the extra :has() lifts over it.
     */
    ...CATEGORIES.map(
      (category) =>
        `.catalog:has(#cat-filter-${category.id}:checked):has(#guide-filter-has:checked) .rule-list > li[data-category="${category.id}"] ~ li[data-category="${category.id}"]{border-block-start:0}`,
    ),
    '.catalog:has(#cat-filter-all:checked):has(#guide-filter-has:checked) .rule-list > li[data-guides="has"] ~ li[data-guides="has"]{border-block-start:1px solid var(--c-border)}',
    ...CATEGORIES.map(
      (category) =>
        `.catalog:has(#cat-filter-${category.id}:checked):has(#guide-filter-has:checked) .rule-list > li[data-category="${category.id}"][data-guides="has"] ~ li[data-category="${category.id}"][data-guides="has"]{border-block-start:1px solid var(--c-border)}`,
    ),
  ].join("");

  return (
    <div className="space-y-10">
      <header>
        <h1 className="mb-4 text-page-title">The rule catalog</h1>
        <p className="max-w-[60ch] text-fg-muted text-lede">
          {rules.length} rules. Each maps a set of npm packages to the native
          approach that covers the same ground, and states where the package is
          still the better choice.
        </p>
        <p className="mt-3 text-compact">
          <Link href="/packages">
            Or browse the {ALL_PACKAGES.length} package names
          </Link>
        </p>
      </header>

      {/*
          The filter is radios plus :has() in globals.css, scoped to the
          .catalog wrapper below. It ships no JavaScript, and it keeps
          working with JavaScript disabled.
        */}
      <style>
        {emptySelectors.length === 0
          ? `${countVisibility}${guideFiltering}`
          : `${emptySelectors.join(",")}{display:block}${countVisibility}${guideFiltering}`}
      </style>

      <div className="catalog rules-shell">
        <Sidebar
          categoryStates={categoryStates}
          tierStates={tierStates}
          count={count}
        />

        {/*
            A flex gap rather than padding on each group. Every filter hides
            groups with display: none, which takes them out of flex layout
            altogether, so the space only ever falls between two groups that
            are actually on screen. Padding could not tell the difference.
          */}
        <div className="flex flex-col gap-10">
          <p className="catalog-empty max-w-[52ch] text-fg-muted">
            Nothing matches that combination. Widen one of the filters to see
            the rest of the catalog.
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
                  {inTier.map(({ rule, status, hasGuide }) => (
                    <li
                      key={rule.id}
                      data-tier={status}
                      data-category={rule.category}
                      data-guides={hasGuide ? "has" : "none"}
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

type Count = (tier: string, category: string, guide: string) => number;

/*
 * A row's count depends on the two filters it does not belong to, so each
 * carries one span per combination of those two and CSS reveals the one that
 * is currently true. Three helpers rather than one generic component: the
 * data attribute has to be written literally for JSX to type it.
 */
function TierRowCounts({
  tier,
  categoryStates,
  count,
}: {
  tier: string;
  categoryStates: readonly string[];
  count: Count;
}) {
  return categoryStates.flatMap((category) =>
    GUIDE_STATES.map((guide) => (
      <span
        key={`${category}|${guide}`}
        className="sidebar-row-count"
        data-count-cg={`${category}|${guide}`}
      >
        {count(tier, category, guide)}
      </span>
    )),
  );
}

function CategoryRowCounts({
  category,
  tierStates,
  count,
}: {
  category: string;
  tierStates: readonly string[];
  count: Count;
}) {
  return tierStates.flatMap((tier) =>
    GUIDE_STATES.map((guide) => (
      <span
        key={`${tier}|${guide}`}
        className="sidebar-row-count"
        data-count-tg={`${tier}|${guide}`}
      >
        {count(tier, category, guide)}
      </span>
    )),
  );
}

function GuideRowCounts({
  guide,
  tierStates,
  categoryStates,
  count,
}: {
  guide: string;
  tierStates: readonly string[];
  categoryStates: readonly string[];
  count: Count;
}) {
  return tierStates.flatMap((tier) =>
    categoryStates.map((category) => (
      <span
        key={`${tier}|${category}`}
        className="sidebar-row-count"
        data-count-tc={`${tier}|${category}`}
      >
        {count(tier, category, guide)}
      </span>
    )),
  );
}

/**
 * The three filters. Every row's number stays true as the reader narrows
 * down, because it is really one number per combination of the other two
 * filters with CSS choosing between them. See countVisibility above.
 */
function Sidebar({
  categoryStates,
  tierStates,
  count,
}: {
  categoryStates: readonly string[];
  tierStates: readonly string[];
  count: Count;
}) {
  return (
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
              <TierRowCounts
                tier="all"
                categoryStates={categoryStates}
                count={count}
              />
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
                  <TierRowCounts
                    tier={status}
                    categoryStates={categoryStates}
                    count={count}
                  />
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
              <CategoryRowCounts
                category="all"
                tierStates={tierStates}
                count={count}
              />
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
                <CategoryRowCounts
                  category={category.id}
                  tierStates={tierStates}
                  count={count}
                />
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="sidebar-group">
        <legend className="sidebar-heading">Deeper guides</legend>
        <div className="sidebar-options">
          <div className="relative">
            <input
              type="radio"
              name="guide-filter"
              id="guide-filter-all"
              className="filter-input"
              defaultChecked={true}
            />
            <label htmlFor="guide-filter-all" className="sidebar-row">
              <span className="sidebar-row-label">All rules</span>
              <GuideRowCounts
                guide="all"
                tierStates={tierStates}
                categoryStates={categoryStates}
                count={count}
              />
            </label>
          </div>
          <div className="relative">
            <input
              type="radio"
              name="guide-filter"
              id="guide-filter-has"
              className="filter-input"
            />
            <label htmlFor="guide-filter-has" className="sidebar-row">
              <span className="sidebar-row-label">Has a guide</span>
              <GuideRowCounts
                guide="has"
                tierStates={tierStates}
                categoryStates={categoryStates}
                count={count}
              />
            </label>
          </div>
        </div>
        <p className="sidebar-aside text-fg-faint text-metadata">
          Long-form write-ups from modern-web-guidance, linked on the rule.
        </p>
      </fieldset>
    </aside>
  );
}
