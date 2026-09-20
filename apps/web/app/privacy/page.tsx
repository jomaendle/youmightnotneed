import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  openGraph: {
    title: "Privacy",
    description: "What this site collects, and what it never stores.",
    url: "/privacy",
  },
  alternates: { canonical: "/privacy" },
  title: "Privacy",
  description: "What this site collects, and what it never stores.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-[62ch] space-y-8">
      <header>
        <h1 className="mb-4 text-page-title">Privacy</h1>
        <p className="text-fg-muted text-lede">
          There are no accounts and no database. What follows is everything this
          site records.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-section">Your package.json</h2>
        <p>
          A pasted package.json is matched against the catalog and never stored.
          The report you get back is encoded in its own URL, and only the names
          of packages that matched a rule go into it. Anyone you send that link
          to sees what the link says. Nothing sits on a server waiting to be
          looked up.
        </p>
        <p>
          The CLI and the MCP server run on your machine and send nothing
          anywhere.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-section">Cookies</h2>
        <p>This site sets no cookies of its own.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-section">Analytics</h2>
        <p>
          The site runs{" "}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            Vercel Web Analytics
          </a>
          . Per Vercel, it uses no third-party cookies. A visitor is identified
          by a hash created from the incoming request, and that session is
          discarded after 24 hours. Each page view stores the URL, referrer,
          country and region, browser, operating system and device type.
        </p>
        <p>
          It also runs{" "}
          <a
            href="https://vercel.com/docs/speed-insights/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            Vercel Speed Insights
          </a>
          . Per Vercel, its data points are anonymous and cannot be used to
          follow a visit across pages or identify a person. Each one stores the
          route, network speed, browser, device, country and a Core Web Vital.
        </p>
        <p>
          Both are described in Vercel&apos;s words. I have no access to
          anything beyond the aggregated dashboards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-section">Questions</h2>
        <p>
          <a href={`${site.repo}/issues`} target="_blank" rel="noreferrer">
            Open an issue
          </a>{" "}
          on GitHub.
        </p>
      </section>
    </div>
  );
}
