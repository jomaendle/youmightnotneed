import {
  analyze,
  BASELINE_DATA_DATE,
  formatBytes,
  packageSizes,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { FindingCard } from "@/components/finding-card";
import { MethodologyDialog } from "@/components/methodology-dialog";
import { TierHelp } from "@/components/tier-help";
import { decodeReport, toPackageJsonLike } from "@/lib/permalink";
import { site } from "@/lib/site";
import { TIERS } from "@/lib/tiers";

interface PageProps {
  searchParams: Promise<{ d?: string }>;
}

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
  if (payload.projectName !== undefined) {
    ogParams.set("project", payload.projectName);
  }

  return {
    title: headline,
    description:
      payload.projectName === undefined
        ? site.description
        : `${payload.projectName}: ${summary.findingCount} of its dependencies have a native CSS or HTML equivalent.`,
    openGraph: {
      title: headline,
      description: `${summary.findingCount} rules matched. Support derived from web-features.`,
      images: [{ url: `/api/og?${ogParams}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ReportPage({ searchParams }: PageProps) {
  const payload = decodeReport((await searchParams).d);
  if (!payload) return <BadLink />;

  const { findings, summary } = analyze(toPackageJsonLike(payload));

  return (
    <div className="space-y-12">
      <header>
        {payload.projectName === undefined ? null : (
          <p className="mb-3 font-mono text-fg-faint text-metadata">
            {payload.projectName}
          </p>
        )}
        {summary.packageCount === 0 ? (
          <EmptyHeadline />
        ) : (
          <Headline
            bytes={summary.replaceableBytes}
            packages={summary.packageCount}
            categories={summary.findingCount}
            unknown={summary.hasUnknownSizes}
          />
        )}
      </header>

      {findings.length === 0 ? null : (
        <div className="hairline pt-2">
          <div className="flex justify-end py-3">
            <TierHelp />
          </div>
          {TIERS.map((tier) => {
            const inTier = findings.filter(
              (f) => f.baseline.status === tier.status,
            );
            if (inTier.length === 0) return null;

            return (
              <section key={tier.status} className="hairline pt-8 pb-2">
                <h2 className="text-section">{tier.verdict}</h2>
                <p className="max-w-[60ch] text-compact text-fg-muted">
                  {tier.note}
                </p>
                <div className="rule-list mt-2">
                  {inTier.map((finding) => (
                    <FindingCard key={finding.rule.id} finding={finding} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <footer className="hairline space-y-2 pt-6 text-fg-faint text-metadata">
        <p>
          web-features@{WEB_FEATURES_VERSION} captured {BASELINE_DATA_DATE}.
          Sizes captured {packageSizes.fetchedOn}.
        </p>
        <p>
          This report is encoded entirely in its URL. Copy the address bar to
          share it. Nothing was stored.
        </p>
        <p className="flex flex-wrap gap-x-4 pt-1">
          <MethodologyDialog
            baselineOn={BASELINE_DATA_DATE}
            webFeaturesVersion={WEB_FEATURES_VERSION}
            sizesOn={packageSizes.fetchedOn}
          />
          <Link href="/" className="text-metadata">
            Check another package.json
          </Link>
        </p>
      </footer>
    </div>
  );
}

function Headline({
  bytes,
  packages,
  categories,
  unknown,
}: {
  bytes: number;
  packages: number;
  categories: number;
  unknown: boolean;
}) {
  return (
    <>
      <p className="mb-2 text-fg-faint text-metadata">up to</p>
      <h1 className="mb-5 text-hero tabular-nums">{formatBytes(bytes)}</h1>
      <p className="max-w-[56ch] text-fg-muted text-lede">
        that CSS now does natively, across {packages}{" "}
        {packages === 1 ? "dependency" : "dependencies"} in {categories}{" "}
        {categories === 1 ? "category" : "categories"}. Minified and gzipped. It
        says "up to" because having a package installed is not proof of how you
        use it.
      </p>
      {unknown ? (
        <p className="mt-2 text-fg-faint text-metadata">
          Some matched packages have no published size, so the real figure is a
          little higher.
        </p>
      ) : null}
    </>
  );
}

function EmptyHeadline() {
  return (
    <>
      <h1 className="mb-4 max-w-[26ch] text-page-title">
        Nothing here that CSS covers yet
      </h1>
      <p className="max-w-[58ch] text-fg-muted text-lede">
        None of these dependencies matched a rule. That is a real result, not a
        failure: the catalog only covers cases where CSS or HTML genuinely
        replaces a library.
      </p>
    </>
  );
}

function BadLink() {
  return (
    <div className="space-y-4">
      <h1 className="text-page-title">That link did not decode</h1>
      <p className="max-w-[58ch] text-fg-muted">
        Report links carry their whole payload, so a truncated one cannot be
        recovered. Run the check again.
      </p>
      <Link href="/">Start over</Link>
    </div>
  );
}
