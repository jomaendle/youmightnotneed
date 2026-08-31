import {
  analyze,
  BASELINE_DATA_DATE,
  type BaselineStatus,
  formatBytes,
  packageSizes,
  WEB_FEATURES_VERSION,
} from "@youmightnotneed/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { FindingCard } from "@/components/finding-card";
import { decodeReport, toPackageJsonLike } from "@/lib/permalink";
import { site } from "@/lib/site";

interface PageProps {
  searchParams: Promise<{ d?: string }>;
}

const TIER_ORDER: { status: BaselineStatus; heading: string; note: string }[] =
  [
    {
      status: "widely",
      heading: "Safe today",
      note: "Baseline widely available. These work across current browsers.",
    },
    {
      status: "newly",
      heading: "Newly available",
      note: "In every engine, but recently. Check against your support target.",
    },
    {
      status: "limited",
      heading: "Bleeding edge",
      note: "Not in every engine yet. These need a fallback, or more patience.",
    },
    {
      status: "unknown",
      heading: "Unverified",
      note: "The catalog could not resolve support for these.",
    },
  ];

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const payload = decodeReport((await searchParams).d);
  if (!payload) return { title: "Report" };

  const { summary } = analyze(toPackageJsonLike(payload));
  const headline =
    summary.packageCount === 0
      ? "No replaceable dependencies found"
      : `Up to ${formatBytes(summary.replaceableBytes)} replaceable`;

  const ogParams = new URLSearchParams({
    bytes: String(summary.replaceableBytes),
    count: String(summary.packageCount),
  });
  if (payload.projectName) ogParams.set("project", payload.projectName);

  return {
    title: headline,
    description: payload.projectName
      ? `${payload.projectName}: ${summary.findingCount} of its dependencies have a native CSS or HTML equivalent.`
      : site.description,
    openGraph: {
      title: headline,
      description: `${summary.findingCount} rules matched. Support status derived from web-features.`,
      images: [{ url: `/api/og?${ogParams}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ReportPage({ searchParams }: PageProps) {
  const payload = decodeReport((await searchParams).d);

  if (!payload) {
    return (
      <div className="space-y-4">
        <h1 className="font-semibold text-2xl">That link did not decode</h1>
        <p className="text-muted">
          Report links carry their whole payload, so a truncated one cannot be
          recovered. Run the check again.
        </p>
        <Link href="/">Start over</Link>
      </div>
    );
  }

  const { findings, summary } = analyze(toPackageJsonLike(payload));

  return (
    <div className="space-y-10">
      <header>
        {payload.projectName !== undefined && (
          <p className="mb-2 font-mono text-faint text-sm">
            {payload.projectName}
          </p>
        )}

        {summary.packageCount === 0 ? (
          <>
            <h1 className="mb-3 font-semibold text-2xl tracking-tight sm:text-3xl">
              Nothing here that CSS covers yet
            </h1>
            <p className="max-w-xl text-muted leading-relaxed">
              None of these dependencies matched a rule in the catalog. That is
              a real result, not a failure. The catalog only covers cases where
              CSS or HTML genuinely replaces a library.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-3 font-semibold text-3xl tracking-tight sm:text-4xl">
              Up to{" "}
              <span className="text-link">
                {formatBytes(summary.replaceableBytes)}
              </span>{" "}
              that CSS now does natively
            </h1>
            <p className="max-w-xl text-muted leading-relaxed">
              Across {summary.packageCount}{" "}
              {summary.packageCount === 1 ? "dependency" : "dependencies"} in{" "}
              {summary.findingCount}{" "}
              {summary.findingCount === 1 ? "category" : "categories"}. Minified
              and gzipped. It says "up to" because having a package installed is
              not proof of how you use it.
            </p>
            {summary.hasUnknownSizes ? (
              <p className="mt-2 text-faint text-sm">
                Some matched packages have no published size, so the real figure
                is a little higher.
              </p>
            ) : null}
          </>
        )}
      </header>

      {TIER_ORDER.map((tier) => {
        const inTier = findings.filter(
          (f) => f.baseline.status === tier.status,
        );
        if (inTier.length === 0) return null;

        return (
          <section key={tier.status} className="space-y-4">
            <div>
              <h2 className="font-semibold text-xl tracking-tight">
                {tier.heading}
              </h2>
              <p className="text-muted text-sm">{tier.note}</p>
            </div>
            <div className="space-y-4">
              {inTier.map((finding) => (
                <FindingCard key={finding.rule.id} finding={finding} />
              ))}
            </div>
          </section>
        );
      })}

      <footer className="space-y-2 border-border border-t pt-6 text-faint text-sm">
        <p>
          Baseline from web-features@{WEB_FEATURES_VERSION}, captured{" "}
          {BASELINE_DATA_DATE}. Sizes from bundlephobia, captured{" "}
          {packageSizes.fetchedOn}.
        </p>
        <p>
          This whole report is encoded in its URL. Copy the address bar to share
          it. Nothing was stored.
        </p>
        <p>
          <Link href="/">Check another package.json</Link>
        </p>
      </footer>
    </div>
  );
}
