import {
  hasNoVersions,
  type ResolvedFeature,
  resolveFeature,
  rulesById,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { BaselineBadge } from "@/components/baseline-badge";
import { BrowserSupport } from "@/components/browser-support";
import { NATIVE_USAGE, type Usage } from "@/lib/native-usage";

export const metadata: Metadata = {
  openGraph: {
    title: "What this site uses",
    description:
      "The platform features this site runs on, and what each one replaced.",
    url: "/native",
  },
  alternates: { canonical: "/native" },
  title: "What this site uses",
  description:
    "This site is built from the same catalog it publishes. Here is which native feature does what, and where the fallback is.",
};

export default function NativePage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="mb-4 text-page-title">What this site uses</h1>
        <p className="max-w-[62ch] text-fg-muted text-lede">
          This site is built from the catalog it publishes. Every feature below
          is doing real work here, and every one that is not Baseline sits
          behind an @supports check with a stated fallback, which is what the
          rules themselves ask you to do.
        </p>
      </header>

      <section className="hairline pt-8">
        <h2 className="mb-2 text-section">The one it does not use</h2>
        <p className="max-w-[62ch] text-compact text-fg-muted">
          View transitions. Next.js drives navigation through its client router,
          so the cross-document version of the API never fires, and wiring up
          the same-document one would be a claim about this site that is not
          true yet. The <Link href="/rules/view-transitions">rule</Link> is in
          the catalog on its merits, not because this site ships it.
        </p>
      </section>

      <section className="hairline pt-8">
        <h2 className="mb-5 text-section">
          {NATIVE_USAGE.length} features in use
        </h2>
        <ul className="rule-list">
          {NATIVE_USAGE.map((usage) => (
            <UsageRow key={`${usage.featureId}-${usage.where}`} usage={usage} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function UsageRow({ usage }: { usage: Usage }) {
  const feature = resolveFeature(usage.featureId);
  const rule =
    usage.ruleId === undefined ? undefined : rulesById.get(usage.ruleId);

  return (
    <li className="py-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-mono text-subsection">{feature.name}</h3>
        <BaselineBadge status={feature.status} short={true} />
      </div>

      <div className="mb-3">
        <UsageSupport feature={feature} />
      </div>

      <dl className="max-w-[66ch] space-y-1.5 text-compact">
        <div className="flex flex-wrap gap-x-2">
          <dt className="shrink-0 text-fg-faint">Here</dt>
          <dd className="text-fg-muted">{usage.where}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="shrink-0 text-fg-faint">Instead of</dt>
          <dd className="text-fg-muted">{usage.instead}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="shrink-0 text-fg-faint">Without it</dt>
          <dd className="text-fg-muted">{usage.fallback}</dd>
        </div>
      </dl>

      {rule === undefined ? null : (
        <p className="mt-2.5 text-metadata">
          <Link href={`/rules/${rule.id}`}>{rule.title}</Link>
        </p>
      )}
    </li>
  );
}

/**
 * The version row for one feature. Rendering `feature.support` unconditionally
 * is wrong for the handful of features web-features publishes no aggregate
 * for, because one small part of them has not shipped anywhere: the row comes
 * out as four dashes, which reads as "no engine has this" when the part this
 * site is actually built on shipped in Chrome years ago. Anchor positioning
 * and ::scroll-button are both in that state. So when the aggregate is empty
 * and a part stands in for it, show the part's versions and name the part,
 * which is what the rule pages already do.
 */
function UsageSupport({ feature }: { feature: ResolvedFeature }) {
  if (!hasNoVersions(feature.support)) {
    return <BrowserSupport support={feature.support} />;
  }

  if (feature.partialSupport === null) {
    return (
      <p className="max-w-[62ch] text-fg-muted text-metadata">
        web-features tracks no browser versions for {feature.name} yet.
      </p>
    );
  }

  return (
    <div>
      <BrowserSupport support={feature.partialSupport.support} />
      <p className="mt-2 max-w-[62ch] text-fg-muted text-metadata">
        Versions are for{" "}
        <code className="font-mono">{feature.partialSupport.key}</code>, the
        part this site is built on. web-features publishes no single version for{" "}
        {feature.name} as a whole.
      </p>
    </div>
  );
}
