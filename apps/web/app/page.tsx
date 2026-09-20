import {
  BASELINE_DATA_DATE,
  baselineHistory,
  packageSizes,
  resolveBaseline,
  rules,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyPrompt } from "@/components/copy-prompt";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { JsonLd } from "@/components/json-ld";
import { MethodologyDialog } from "@/components/methodology-dialog";
import { ScanForm } from "@/components/scan-form";
import { SwapDiff } from "@/components/swap-diff";
import { TierHelp } from "@/components/tier-help";
import { TierHistorySparkline } from "@/components/tier-history-sparkline";
import { AGENT_PROMPT, AGENT_PROMPT_SUMMARY } from "@/lib/agent-prompt";
import { demos } from "@/lib/demos";
import { EXAMPLE_REPORT_PAYLOAD } from "@/lib/example-report";
import { site } from "@/lib/site";
import { CLI_VERSION, MCP_VERSION } from "@/lib/versions";

/*
 * The .vercel.app domain is still attached so old links resolve, which means
 * two hostnames serve identical pages. The canonical is what stops them
 * competing for the same search results. It is set per route rather than in
 * the layout, because a canonical in a layout is inherited by every child and
 * would declare each of them a duplicate of one page.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function weight(rule: (typeof rules)[number]): number {
  return rule.replaces.reduce(
    (total, pkg) => total + (packageSizes.sizes[pkg]?.gzip ?? 0),
    0,
  );
}

/**
 * The rules with a live example behind them read best as the first
 * impression. That means lib/demos.ts, which almost every rule has an entry
 * in. rule.human.demoUrl is a different field, an external write-up that two
 * rules carry, so filtering on it would leave the homepage with a handful.
 */
function featured() {
  return [...rules]
    .filter((rule) => demos[rule.id] !== undefined)
    .sort((a, b) => weight(b) - weight(a))
    .slice(0, 6);
}

export default function HomePage() {
  const packageCount = new Set(rules.flatMap((r) => r.replaces)).size;
  // Only count what a status actually says. An unknown rule is a data error
  // the catalog tests fail on, and it is not the same as needing a fallback.
  const tally = { widely: 0, newly: 0, limited: 0 };
  for (const rule of rules) {
    const status = resolveBaseline(rule).status;
    if (status === "widely") tally.widely += 1;
    else if (status === "newly") tally.newly += 1;
    else if (status === "limited") tally.limited += 1;
  }

  return (
    <div className="space-y-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: site.name,
              url: site.url,
              description: site.description,
              potentialAction: {
                "@type": "SearchAction",
                target: `${site.url}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "SoftwareApplication",
              name: site.name,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              description: site.description,
              url: site.url,
              codeRepository: site.repo,
              license: "https://opensource.org/license/mit",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              author: {
                "@type": "Person",
                name: site.author,
                url: site.authorUrl,
              },
            },
          ],
        }}
      />
      {/*
        The hero is a diff because the product is a deletion, and this
        audience reads diffs without needing a caption. The panel on the right
        is the demonstration and every number in it is derived from the
        catalog; the column on the left is where you do it to your own file.
      */}
      <section className="hero grid items-center gap-x-14 gap-y-10">
        <div>
          <p className="mb-4 font-mono text-accent text-metadata">
            Is it CSS yet?
          </p>
          <h1 className="mb-5 text-display">
            Your <span className="strike">node_modules</span> has a browser in
            it
          </h1>
          <p className="max-w-[42ch] text-fg-muted text-lede">
            Paste a package.json, or name a public repo. Every line the platform
            can delete, what it weighs, and whether it is safe yet.
          </p>
        </div>

        <SwapDiff />
      </section>

      {/* Reading width, so it keeps its own column rather than stretching. */}
      <section className="max-w-[52rem]">
        <ScanForm examplePayload={EXAMPLE_REPORT_PAYLOAD} />
      </section>

      <section className="hairline pt-10">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-section">Where the catalog stands</h2>
          <TierHelp />
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <Stat value={String(rules.length)} label="rules" />
          <Stat value={String(packageCount)} label="packages covered" />
          <Stat
            value={String(tally.widely)}
            label="safe today"
            tier="tier-widely"
          />
          <Stat
            value={String(tally.limited)}
            label="need a fallback"
            tier="tier-limited"
          />
        </dl>

        <TierHistorySparkline entries={baselineHistory.entries} />
      </section>

      <section>
        <h2 className="mb-1.5 text-section">Start here</h2>
        <p className="mb-5 max-w-[58ch] text-fg-muted">
          The rules with a worked demo behind them.
        </p>
        <FeaturedCarousel rules={featured()} />
        <p className="mt-5">
          <Link href="/rules" className="text-compact">
            All {rules.length} rules
          </Link>
        </p>
      </section>

      <section className="hairline pt-10">
        <h2 className="mb-3 text-section">What this does not claim</h2>
        <div className="max-w-[62ch] space-y-3 text-fg-muted">
          <p>
            A dependency being in your package.json is not proof of what you use
            it for. Someone installs Framer Motion for layout animations, not
            for fade-ins. So every finding here is a conditional, and it arrives
            with the cases where the library is still the better choice.
          </p>
          <p>
            Sizes describe the whole package, so a total assumes a full
            replacement that may not apply to you. That is why the number always
            says "up to".
          </p>
        </div>
        <div className="mt-4">
          <MethodologyDialog
            baselineOn={BASELINE_DATA_DATE}
            webFeaturesVersion={WEB_FEATURES_VERSION}
            sizesOn={packageSizes.fetchedOn}
          />
        </div>
      </section>

      <section className="hairline pt-10">
        <h2 className="mb-3 text-section">Or run it where the code is</h2>
        <div className="flex flex-wrap items-center gap-3">
          <pre className="w-fit rounded-md border border-border bg-bg-subtle px-4 py-2.5 font-mono text-compact">
            <code>npx youmightnotneed</code>
          </pre>
          <span className="font-mono text-fg-faint text-metadata tabular-nums">
            v{CLI_VERSION}
          </span>
        </div>
        <p className="mt-3 max-w-[58ch] text-compact text-fg-muted">
          Same catalog, same conditions, no paste. Add <code>--verbose</code> to
          print every condition, or <code>--json</code> for scripts and agents.
        </p>
      </section>

      <section className="hairline pt-10">
        <h2 className="mb-3 text-section">Or hand it to an agent</h2>
        <p className="mb-5 max-w-[58ch] text-compact text-fg-muted">
          Paste this into Claude Code, Cursor, Copilot or anything that runs
          commands. Matching is exact, so nothing guesses at what your packages
          do.
        </p>
        <CopyPrompt text={AGENT_PROMPT} />
        <p className="mt-3 max-w-[58ch] text-fg-faint text-metadata">
          {AGENT_PROMPT_SUMMARY}
        </p>
        <p className="mt-5 max-w-[58ch] text-compact text-fg-muted">
          Or install it for good. MCP server v{MCP_VERSION}, or the skill:
        </p>
        <pre className="mt-3 w-fit overflow-x-auto rounded-md border border-border bg-bg-subtle px-4 py-2.5 font-mono text-compact">
          <code>
            claude mcp add youmightnotneed -- npx -y youmightnotneed-mcp
            {"\n"}
            npx skills add jomaendle/youmightnotneed
          </code>
        </pre>
      </section>
    </div>
  );
}

function Stat({
  value,
  label,
  tier,
}: {
  value: string;
  label: string;
  tier?: string;
}) {
  return (
    // dt before dd is the order HTML requires and the order a screen reader
    // announces it. column-reverse keeps the number on top visually.
    <div className={`flex flex-col-reverse ${tier ?? ""}`}>
      <dt className="mt-0.5 text-fg-faint text-metadata">{label}</dt>
      <dd
        className="text-page-title tabular-nums"
        style={tier === undefined ? undefined : { color: "var(--tier)" }}
      >
        {value}
      </dd>
    </div>
  );
}
