import { rules } from "@youmightnotneed/catalog";
import Link from "next/link";
import { ScanForm } from "@/components/scan-form";
import { site } from "@/lib/site";

export default function HomePage() {
  const packageCount = new Set(rules.flatMap((r) => r.replaces)).size;

  return (
    <div className="space-y-12">
      <section>
        <p className="mb-2 font-mono text-link text-sm">{site.tagline}</p>
        <h1 className="mb-4 font-semibold text-3xl tracking-tight sm:text-4xl">
          Find the CSS that replaces your dependencies
        </h1>
        <p className="max-w-xl text-muted leading-relaxed">
          Some of what you installed a library for is now in the platform. Paste
          a package.json and see which of your dependencies have a native
          equivalent, how much they weigh, and how well the replacement is
          supported.
        </p>
      </section>

      <section>
        <ScanForm />
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface/50 p-5">
        <h2 className="font-semibold text-base">How to read a report</h2>
        <p className="text-muted text-sm leading-relaxed">
          A dependency being in your package.json is not proof of what you use
          it for. Someone installs Framer Motion for layout animations, not for
          fade-ins. So every finding here is a conditional, and it comes with
          the cases where the library is still the right call. Read those before
          you change anything.
        </p>
        <p className="text-muted text-sm leading-relaxed">
          Support status is derived from{" "}
          <a
            href="https://github.com/web-platform-dx/web-features"
            target="_blank"
            rel="noreferrer"
          >
            web-features
          </a>
          , the dataset behind Baseline, and refreshed rather than written by
          hand. When a feature is Chromium-only, the badge says so.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-base">
          {rules.length} rules, covering {packageCount} packages
        </h2>
        <p className="mb-4 text-muted text-sm">
          Every rule has a snippet you can copy and a list of conditions where
          it does not apply.
        </p>
        <Link href="/rules" className="text-sm">
          Browse the catalog
        </Link>
      </section>

      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-2 font-semibold text-base">Or run it in your repo</h2>
        <pre className="overflow-x-auto rounded-lg bg-surface p-3 font-mono text-sm">
          <code>npx youmightnotneed</code>
        </pre>
        <p className="mt-2 text-faint text-sm">
          Same catalog, same output, no paste required.
        </p>
      </section>
    </div>
  );
}
