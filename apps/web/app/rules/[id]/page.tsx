import {
  baselineLabel,
  CATEGORIES_BY_ID,
  combinedSupport,
  formatBytes,
  GUIDE_SOURCE,
  packageSizes,
  type ResolvedGuide,
  resolveBaseline,
  resolveGuides,
  rules,
  rulesById,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BaselineBadge } from "@/components/baseline-badge";
import { BrowserSupport } from "@/components/browser-support";
import { LiveDemo } from "@/components/live-demo";
import { Snippet } from "@/components/snippet";
import { demos } from "@/lib/demos";

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
    },
  };
}

export default async function RulePage({ params }: PageProps) {
  const rule = rulesById.get((await params).id);
  if (!rule) notFound();

  const baseline = resolveBaseline(rule);
  const demo = demos[rule.id];

  return (
    <>
      {/* Driven by animation-timeline: scroll(), so no scroll listener. */}
      <div className="progress-bar" aria-hidden="true" />

      <article className="space-y-11">
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
          {baseline.features.length === 0 ? null : (
            <div className="mt-4">
              <BrowserSupport support={combinedSupport(baseline.features)} />
            </div>
          )}
        </header>

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

        <PackageTable replaces={rule.replaces} />
      </article>
    </>
  );
}

/** "carousel-snap-highlights" reads as "Carousel snap highlights". */
function guideTitle(id: string): string {
  const words = id.split("-").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The long-form guides for this rule. The catalog answers which dependency has
 * a native equivalent and stops there, so the implementation is a link out.
 */
function GuideList({ guides }: { guides: readonly ResolvedGuide[] }) {
  const linkable = guides.filter((guide) => guide.url !== null);
  if (linkable.length === 0) return null;

  return (
    <section className="hairline pt-8">
      <h2 className="mb-2 text-section">Building it</h2>
      <p className="mb-4 max-w-[62ch] text-compact text-fg-muted">
        This catalog stops at the swap. These guides go through the
        implementation and the fallbacks. They come from Google Chrome's{" "}
        <a href={GUIDE_SOURCE.repo} target="_blank" rel="noreferrer">
          modern-web-guidance
        </a>
        , Apache-2.0.
      </p>
      <ul className="max-w-[68ch] space-y-2">
        {linkable.map((guide) => (
          <li key={guide.id} className="flex flex-wrap items-baseline gap-x-3">
            <a href={guide.url ?? undefined} target="_blank" rel="noreferrer">
              {guideTitle(guide.id)}
            </a>
            <span className="text-compact text-fg-muted">{guide.category}</span>
          </li>
        ))}
      </ul>
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
  features: readonly {
    id: string;
    name: string;
    status: Parameters<typeof baselineLabel>[0];
    since: string | null;
    spec: string | null;
  }[];
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
              {feature.since === null ? null : (
                <span className="ml-2 text-fg-faint text-metadata">
                  since {feature.since}
                </span>
              )}
            </span>
            <BaselineBadge status={feature.status} short={true} />
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
