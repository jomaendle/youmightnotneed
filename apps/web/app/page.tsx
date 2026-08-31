import {
  BASELINE_DATA_DATE,
  packageSizes,
  resolveBaseline,
  rules,
  WEB_FEATURES_VERSION,
} from "@youmightnotneed/catalog";
import Link from "next/link";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { MethodologyDialog } from "@/components/methodology-dialog";
import { ScanForm } from "@/components/scan-form";
import { TierHelp } from "@/components/tier-help";

/** The rules with a demo behind them read best as the first impression. */
function featured() {
  const withDemo = rules.filter((rule) => rule.human.demoUrl !== undefined);
  const heaviest = [...rules]
    .filter((rule) => !withDemo.includes(rule))
    .sort(
      (a, b) =>
        b.replaces.reduce((t, p) => t + (packageSizes.sizes[p]?.gzip ?? 0), 0) -
        a.replaces.reduce((t, p) => t + (packageSizes.sizes[p]?.gzip ?? 0), 0),
    );
  return [...withDemo, ...heaviest].slice(0, 6);
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
      <section>
        <p className="mb-3 font-mono text-accent text-metadata">
          Is it CSS yet?
        </p>
        <h1 className="mb-5 max-w-[22ch] text-display">
          Find the CSS that replaces your dependencies
        </h1>
        <p className="max-w-[58ch] text-fg-muted text-lede">
          Some of what you installed a library for is now in the platform. Paste
          a package.json to see which of your dependencies have a native
          equivalent, what they weigh, and how well the replacement is
          supported.
        </p>
      </section>

      <section>
        <ScanForm />
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
        <p className="mt-4">
          <MethodologyDialog
            baselineOn={BASELINE_DATA_DATE}
            webFeaturesVersion={WEB_FEATURES_VERSION}
            sizesOn={packageSizes.fetchedOn}
          />
        </p>
      </section>

      <section className="hairline pt-10">
        <h2 className="mb-3 text-section">Or run it where the code is</h2>
        <pre className="w-fit rounded-md border border-border bg-bg-subtle px-4 py-2.5 font-mono text-compact">
          <code>npx youmightnotneed</code>
        </pre>
        <p className="mt-3 max-w-[58ch] text-compact text-fg-muted">
          Same catalog, same conditions, no paste. Add <code>--verbose</code> to
          print every condition, or <code>--json</code> for scripts and agents.
        </p>
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
