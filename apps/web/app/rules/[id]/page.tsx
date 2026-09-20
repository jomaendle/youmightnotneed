import {
  baselineLabel,
  CATEGORIES_BY_ID,
  combinedSupport,
  featureSince,
  formatBytes,
  GUIDE_SOURCE,
  hasNoVersions,
  packageSizes,
  type ResolvedFeature,
  type ResolvedGuide,
  type Rule,
  resolveBaseline,
  resolveGuides,
  resolveRuleLint,
  rules,
  rulesById,
  unpublishedSupport,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BaselineBadge } from "@/components/baseline-badge";
import { BrowserSupport } from "@/components/browser-support";
import { JsonLd } from "@/components/json-ld";
import { LiveDemo } from "@/components/live-demo";
import { PartialSupportNote } from "@/components/partial-support";
import { Snippet } from "@/components/snippet";
import { demos } from "@/lib/demos";
import { site } from "@/lib/site";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return rules.map((rule) => ({ id: rule.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const rule = rulesById.get((await params).id);
  if (!rule) return { title: "Not found" };

  return {
    title: rule.title,
    description: `${rule.native}. Covers ${rule.replaces.slice(0, 3).join(", ")}.`,
    openGraph: {
      title: `${rule.title}: ${rule.native}`,
      description: rule.agent.when,
      images: [{ url: `/api/og?rule=${rule.id}`, width: 1200, height: 630 }],
    },
    alternates: { canonical: `/rules/${rule.id}` },
  };
}

export default async function RulePage({ params }: PageProps) {
  const rule = rulesById.get((await params).id);
  if (!rule) notFound();

  const baseline = resolveBaseline(rule);
  const demo = demos[rule.id];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "TechArticle",
              headline: `${rule.title}: ${rule.native}`,
              description: rule.agent.when,
              url: `${site.url}/rules/${rule.id}`,
              author: {
                "@type": "Person",
                name: site.author,
                url: site.authorUrl,
              },
              isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Rules",
                  item: `${site.url}/rules`,
                },
                { "@type": "ListItem", position: 2, name: rule.title },
              ],
            },
          ],
        }}
      />
      {/* Driven by animation-timeline: scroll(), so no scroll listener. */}
      <div className="progress-bar" aria-hidden="true" />

      <article className="space-y-11">
        <RuleHeader rule={rule} baseline={baseline} />

        {baseline.features.length === 0 ? null : (
          <FeatureTable
            features={baseline.features}
            cappedBy={baseline.limitedBy?.name ?? null}
            status={baseline.status}
          />
        )}

        <section>
          <p className="max-w-[64ch] text-fg-muted text-lede">
            {rule.human.explainer}
          </p>
        </section>

        <section className="hairline pt-8">
          <h2 className="mb-2 text-section">When this applies</h2>
          <p className="max-w-[62ch] text-fg-muted">
            {rule.agent.when.charAt(0).toUpperCase() + rule.agent.when.slice(1)}
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-section">The native approach</h2>
          <Snippet code={rule.human.snippet} label={rule.native} />
          {demo === undefined ? null : (
            <div className="mt-4">
              <LiveDemo demo={demo} title={rule.title} />
            </div>
          )}
          {rule.human.mdnUrl === undefined &&
          rule.human.demoUrl === undefined ? null : (
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-compact">
              {rule.human.mdnUrl === undefined ? null : (
                <a href={rule.human.mdnUrl} target="_blank" rel="noreferrer">
                  MDN reference
                </a>
              )}
              {rule.human.demoUrl === undefined ? null : (
                <a href={rule.human.demoUrl} target="_blank" rel="noreferrer">
                  See it working, with an explanation
                </a>
              )}
            </p>
          )}
        </section>

        <section className="hairline pt-8">
          <h2 className="mb-2 text-section">
            When the dependency is still right
          </h2>
          <p className="mb-4 max-w-[62ch] text-compact text-fg-muted">
            An answer that always says "the platform covers it" is worse than no
            answer. These are the cases where this one does not hold.
          </p>
          <ul className="max-w-[68ch] space-y-2.5 border-border border-l pl-5">
            {rule.agent.unless.map((condition) => (
              <li key={condition} className="text-fg-muted">
                {condition}
              </li>
            ))}
          </ul>
        </section>

        <GuideList guides={resolveGuides(rule)} />

        <HandRolled shapes={rule.agent.handRolled ?? []} />

        <LintRule rule={rule} />

        <PackageTable replaces={rule.replaces} />
      </article>
    </>
  );
}

/**
 * The title block: what the rule replaces, how well supported it is, and,
 * on a hand-verified rule, why its tier was not derived.
 */
function RuleHeader({
  rule,
  baseline,
}: {
  rule: Rule;
  baseline: ReturnType<typeof resolveBaseline>;
}) {
  return (
    <header>
      <Link
        href="/rules"
        className="plain text-fg-faint text-metadata no-underline hover:text-fg"
      >
        Back to the catalog
      </Link>
      <h1 className="mt-4 mb-3 text-page-title">{rule.title}</h1>
      <p className="mb-1 text-fg-faint text-metadata">
        {CATEGORIES_BY_ID[rule.category]?.name}
      </p>
      <p className="mb-4 font-mono text-accent text-lede">{rule.native}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <BaselineBadge status={baseline.status} />
        {baseline.source === "web-features" ? (
          <span className="text-fg-faint text-metadata">
            derived from web-features, captured {baseline.dataDate}
          </span>
        ) : (
          <span className="text-fg-faint text-metadata">
            verified by hand on {baseline.dataDate}
          </span>
        )}
      </div>
      {baseline.note === null ? null : (
        <p className="mt-4 max-w-[68ch] border-border border-l-2 pl-4 text-fg-muted text-metadata">
          {baseline.note}
        </p>
      )}
      <HeaderSupport features={baseline.features} />
    </header>
  );
}

/**
 * The one-line version row for the whole rule: the highest minimum across its
 * features. It goes missing entirely when any feature has no published
 * versions, because a row of dashes there reads as "no engine has this" when
 * the truth is "web-features publishes no number for the feature as a whole".
 * The feature table below says which part is missing and what it needs.
 */
function HeaderSupport({ features }: { features: readonly ResolvedFeature[] }) {
  if (features.length === 0) return null;

  const combined = combinedSupport(features);
  if (!hasNoVersions(combined)) {
    return (
      <div className="mt-4">
        <BrowserSupport support={combined} />
      </div>
    );
  }

  const unpublished = unpublishedSupport(features);
  return (
    <p className="mt-4 max-w-[62ch] text-fg-muted text-metadata">
      {unpublished.length === 0
        ? "web-features tracks no browser versions for this feature yet."
        : `web-features publishes no single version for ${listNames(unpublished)}, so there is no one row for this rule. The versions its parts do have are below.`}
    </p>
  );
}

function listNames(features: readonly ResolvedFeature[]): string {
  const names = features.map((feature) => feature.name);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** "carousel-snap-highlights" reads as "Carousel snap highlights". */
function guideTitle(id: string): string {
  // Object.hasOwn, per the rest of the codebase: a plain-object lookup on an
  // id like "constructor" otherwise reads off Object.prototype.
  const spelled = Object.hasOwn(UPPERCASE_GUIDE_IDS, id)
    ? (UPPERCASE_GUIDE_IDS[id] ?? id)
    : id;
  const words = spelled.split("-").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A handful of upstream IDs are acronyms, and sentence case turns them into
 * "Css" and "Html". They are whole-category guides rather than use cases, so
 * there are few of them and naming them here beats guessing at capitalisation.
 */
const UPPERCASE_GUIDE_IDS: Record<string, string> = {
  css: "CSS",
  "css-layout": "CSS layout",
  html: "HTML",
};

/**
 * Provenance for the guide set, stated rather than implied.
 *
 * The trust here is not a logo. It is that every field is checkable: a named
 * owner, a licence, a pinned version and the date this project snapshotted
 * the index. `pnpm refresh:guides` moves the last two and the freshness check
 * rejects an ID that stopped existing upstream, so a dead link fails CI
 * instead of shipping.
 */
function GuideSource() {
  const facts = [
    GUIDE_SOURCE.licence,
    `v${GUIDE_SOURCE.version}`,
    `indexed ${GUIDE_SOURCE.fetchedOn}`,
  ];

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-metadata">
      <span className="text-fg-muted">From</span>
      <a
        href={GUIDE_SOURCE.repo}
        target="_blank"
        rel="noreferrer"
        className="plain font-medium text-fg no-underline hover:text-accent"
      >
        {GUIDE_SOURCE.owner}
        <span className="text-fg-faint"> / </span>
        <span className="font-mono">{GUIDE_SOURCE.name}</span>
      </a>
      {facts.map((fact) => (
        <span key={fact} className="text-fg-faint">
          <span aria-hidden="true" className="pr-2.5">
            ·
          </span>
          {fact}
        </span>
      ))}
    </div>
  );
}

/**
 * The long-form guides for this rule. The catalog answers which dependency has
 * a native equivalent and stops there, so the implementation is a link out.
 *
 * Sits above the hand-rolled shapes and the package table because it is the
 * next thing a reader who has accepted the swap actually needs, and below the
 * conditions because recommending an implementation before stating the limits
 * would invert the point of the conditions.
 */
function GuideList({ guides }: { guides: readonly ResolvedGuide[] }) {
  const linkable = guides.filter((guide) => guide.url !== null);
  if (linkable.length === 0) return null;

  return (
    <section className="hairline pt-8">
      <h2 className="mb-2 text-section">Building it</h2>
      <p className="mb-4 max-w-[62ch] text-compact text-fg-muted">
        This catalog stops at the swap. These guides go through the
        implementation and the fallbacks, and each one reads in the terminal
        through its own command.
      </p>

      <GuideSource />

      <ul className="grid gap-3 sm:grid-cols-2">
        {linkable.map((guide) => (
          <li key={guide.id}>
            <GuideCard guide={guide} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * One guide. The command is the reason this is a card rather than a link: it
 * is already in the catalog data, it is how an agent reads the guide without
 * a browser, and the old list threw it away.
 */
function GuideCard({ guide }: { guide: ResolvedGuide }) {
  return (
    <div className="group flex h-full flex-col gap-2 rounded-lg border border-border bg-bg-subtle p-4 transition-colors hover:border-border-strong">
      {guide.category === guide.id ? null : (
        <span className="font-mono text-fg-faint text-metadata uppercase tracking-wider">
          {guide.category}
        </span>
      )}
      <a
        href={guide.url ?? undefined}
        target="_blank"
        rel="noreferrer"
        className="plain text-subsection no-underline transition-colors group-hover:text-accent"
      >
        {guideTitle(guide.id)}
      </a>
      {/* Wraps rather than scrolling. These commands are longer than a card is
          wide, and a horizontal scrollbar inside a small card hides the end of
          the string behind a gesture most people will not try. */}
      <code className="mt-auto break-all pt-2 font-mono text-fg-muted text-metadata">
        {guide.command}
      </code>
    </div>
  );
}

/**
 * The shapes people write instead of using the native feature.
 *
 * The half of the problem `replaces` cannot show: nothing is installed for
 * any of these, so no package.json scan can ever surface them. Placed after
 * the conditions on purpose, because a shape matching is a starting point and
 * the conditions are what decide.
 */
function HandRolled({ shapes }: { shapes: readonly string[] }) {
  if (shapes.length === 0) return null;

  return (
    <section className="hairline pt-8">
      <h2 className="mb-3 text-section">Signs it was hand-rolled</h2>
      <p className="mb-4 max-w-[62ch] text-compact text-fg-muted">
        No package is involved in any of these, so nothing would match in a
        package.json. If the code looks like one of them, this rule applies
        anyway, and the conditions above still decide.
      </p>
      <ul className="max-w-[68ch] space-y-2.5 border-border border-l pl-5">
        {shapes.map((shape) => (
          <li key={shape} className="text-fg-muted">
            {shape}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Where a linter already checks the shape, name it instead of restating it. */
function LintRule({ rule }: { rule: Rule }) {
  const lint = resolveRuleLint(rule);
  if (!lint?.url) return null;

  return (
    <section className="hairline pt-8">
      <h2 className="mb-3 text-section">Already checked by a linter</h2>
      <p className="max-w-[62ch] text-compact text-fg-muted">
        <a href={lint.url} target="_blank" rel="noreferrer">
          <code className="font-mono">{lint.name}</code>
        </a>{" "}
        finds this mechanically, so it belongs in CI rather than in a review.{" "}
        <Link href="/checks">Every rule a linter covers</Link> is on one page,
        with a config you can paste.
      </p>
    </section>
  );
}

function PackageTable({ replaces }: { replaces: readonly string[] }) {
  const sorted = [...replaces].sort(
    (a, b) =>
      (packageSizes.sizes[b]?.gzip ?? 0) - (packageSizes.sizes[a]?.gzip ?? 0),
  );

  return (
    <section className="hairline pt-8">
      <h2 className="mb-3 text-section">Packages this covers</h2>
      <ul className="rule-list">
        {sorted.map((pkg) => {
          const size = packageSizes.sizes[pkg];
          return (
            <li
              key={pkg}
              className="flex items-baseline justify-between gap-4 py-2.5"
            >
              <a
                href={`https://www.npmjs.com/package/${pkg}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-compact"
              >
                {pkg}
              </a>
              <span className="text-fg-faint text-metadata tabular-nums">
                {size ? formatBytes(size.gzip) : "unknown"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-fg-faint text-metadata">
        Minified and gzipped, captured {packageSizes.fetchedOn}.
      </p>
    </section>
  );
}

function FeatureTable({
  features,
  cappedBy,
  status,
}: {
  features: readonly ResolvedFeature[];
  cappedBy: string | null;
  status: Parameters<typeof baselineLabel>[0];
}) {
  return (
    <section className="hairline pt-8">
      <h2 className="mb-3 text-section">Features it needs</h2>
      <ul className="rule-list">
        {features.map((feature) => (
          <li
            key={feature.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
          >
            <span className="text-compact">
              {feature.spec === null ? (
                feature.name
              ) : (
                <a href={feature.spec} target="_blank" rel="noreferrer">
                  {feature.name}
                </a>
              )}
              {featureSince(feature) === null ? null : (
                <span className="ml-2 text-fg-faint text-metadata">
                  since {featureSince(feature)}
                </span>
              )}
            </span>
            <BaselineBadge status={feature.status} short={true} />
            <PartialSupportNote feature={feature} subject="rule" />
          </li>
        ))}
      </ul>
      {cappedBy === null ? null : (
        <p className="mt-3 max-w-[62ch] text-fg-muted text-metadata">
          This rule reads as {baselineLabel(status).toLowerCase()} because of{" "}
          {cappedBy}. The other features are better supported.
        </p>
      )}
    </section>
  );
}
