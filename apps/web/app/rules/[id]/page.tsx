import {
  baselineLabel,
  formatBytes,
  packageSizes,
  resolveBaseline,
  rules,
  rulesById,
} from "@youmightnotneed/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BaselineBadge } from "@/components/baseline-badge";
import { Snippet } from "@/components/snippet";

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
    description: `${rule.native}. Replaces ${rule.replaces.slice(0, 3).join(", ")}.`,
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

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/rules"
          className="text-faint text-sm no-underline hover:text-link"
        >
          Back to the catalog
        </Link>
        <h1 className="font-semibold text-3xl tracking-tight">{rule.title}</h1>
        <p className="font-mono text-lg text-link">{rule.native}</p>
        <div className="flex flex-wrap items-center gap-3">
          <BaselineBadge status={baseline.status} />
          {baseline.source === "web-features" && (
            <span className="text-faint text-xs">
              derived from web-features, captured {baseline.dataDate}
            </span>
          )}
        </div>
      </header>

      <section>
        <p className="text-muted leading-relaxed">{rule.human.explainer}</p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-lg">When this applies</h2>
        <p className="text-muted">
          {rule.agent.when.charAt(0).toUpperCase() + rule.agent.when.slice(1)}.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-lg">The native approach</h2>
        <Snippet code={rule.human.snippet} label={rule.native} />
        {rule.human.demoUrl !== undefined && (
          <p className="text-sm">
            <a href={rule.human.demoUrl} target="_blank" rel="noreferrer">
              See it working, with an explanation
            </a>
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-lg">
          When the dependency is still right
        </h2>
        <p className="mb-3 text-muted text-sm">
          An answer that is always "use CSS" is worse than no answer. These are
          the cases where it does not hold.
        </p>
        <ul className="space-y-2 border-border border-l-2 pl-4">
          {rule.agent.unless.map((condition) => (
            <li key={condition} className="text-muted text-sm leading-relaxed">
              {condition}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-lg">Packages this covers</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[...rule.replaces]
            .sort(
              (a, b) =>
                (packageSizes.sizes[b]?.gzip ?? 0) -
                (packageSizes.sizes[a]?.gzip ?? 0),
            )
            .map((pkg) => {
              const size = packageSizes.sizes[pkg];
              return (
                <li
                  key={pkg}
                  className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <a
                    href={`https://www.npmjs.com/package/${pkg}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm"
                  >
                    {pkg}
                  </a>
                  <span className="font-mono text-faint text-xs">
                    {size ? formatBytes(size.gzip) : "unknown"}
                  </span>
                </li>
              );
            })}
        </ul>
        <p className="mt-2 text-faint text-xs">
          Minified and gzipped, captured {packageSizes.fetchedOn}.
        </p>
      </section>

      {baseline.features.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-lg">Features it needs</h2>
          <ul className="space-y-2">
            {baseline.features.map((feature) => (
              <li
                key={feature.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="text-sm">
                  {feature.spec ? (
                    <a href={feature.spec} target="_blank" rel="noreferrer">
                      {feature.name}
                    </a>
                  ) : (
                    feature.name
                  )}
                  {feature.since !== null && (
                    <span className="ml-2 text-faint text-xs">
                      since {feature.since}
                    </span>
                  )}
                </span>
                <span className="text-faint text-xs">
                  {baselineLabel(feature.status)}
                </span>
              </li>
            ))}
          </ul>
          {baseline.limitedBy !== null && (
            <p className="mt-2 text-faint text-sm">
              This rule reads as {baselineLabel(baseline.status).toLowerCase()}{" "}
              because of {baseline.limitedBy.name}. The other features are
              better supported.
            </p>
          )}
        </section>
      )}
    </article>
  );
}
