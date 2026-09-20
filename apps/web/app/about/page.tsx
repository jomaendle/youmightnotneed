import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  openGraph: {
    title: "About",
    description: "Who makes this, how it works, and what it will not do.",
    url: "/about",
  },
  alternates: { canonical: "/about" },
  title: "About",
  description: "Who makes this, how it works, and what it will not do.",
};

export default function AboutPage() {
  return (
    <div className="max-w-[62ch] space-y-8">
      <header>
        <h1 className="mb-4 text-page-title">About</h1>
        <p className="text-fg-muted text-lede">
          I build for the web, and I got tired of seeing packages installed for
          things the browser already does. This site is a lookup table from
          those packages to what replaces them.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-section">How it works</h2>
        <p>
          Each rule maps npm package names to a CSS feature, an HTML element or
          a Web API. Matching is exact, against the names in your package.json.
          No model reads your code, so nothing here guesses what a package is
          used for.
        </p>
        <p>
          Every rule also lists the cases where the package is still the right
          call. A match is a place to look, and the conditions on the rule page
          say whether the platform covers your case.
        </p>
        <p>
          Support tiers come from{" "}
          <a
            href="https://github.com/web-platform-dx/web-features"
            target="_blank"
            rel="noreferrer"
          >
            web-features
          </a>{" "}
          and are resolved at build time. No browser version in the catalog is
          written by hand.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-section">Who</h2>
        <p>
          Made by{" "}
          <a href={site.authorUrl} target="_blank" rel="noreferrer">
            {site.author}
          </a>
          . The catalog and the site are MIT licensed and live in{" "}
          <a href={site.repo} target="_blank" rel="noreferrer">
            one repository
          </a>
          , along with the CLI, the MCP server and the agent skill.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-section">What it will not do</h2>
        <p>
          It has no accounts, no hosted API with state and no paste-your-code
          mode. It stores nothing you send. See{" "}
          <Link href="/privacy">privacy</Link> for the detail, or{" "}
          <Link href="/contact">get in touch</Link> if a rule is wrong.
        </p>
      </section>
    </div>
  );
}
