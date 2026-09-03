import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/** 14px monoline icons, one per primary nav link. Wayfinding, not ornament. */
function RulesIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 4v5" />
    </svg>
  );
}

function SiteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18M3 12h18" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5v-1.75c-2.78.62-3.37-1.36-3.37-1.36-.46-1.2-1.11-1.53-1.11-1.53-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.66.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9v2.82c0 .28.18.61.69.5A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

const NAV = [
  { href: "/rules", label: "Rules", icon: RulesIcon },
  { href: "/native", label: "This site", icon: SiteIcon },
] as const;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh">
        <header className="sticky top-0 z-40 border-border border-b bg-bg/85 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3.5 sm:gap-6 sm:px-6">
            <Link
              href="/"
              className="plain flex shrink-0 items-center gap-2 whitespace-nowrap font-medium font-mono text-[0.9375rem] tracking-tight no-underline"
            >
              <span className="text-fg-faint" aria-hidden="true">
                {"</>"}
              </span>
              youmightnotneed
            </Link>
            <ul className="flex items-center gap-1 text-metadata sm:gap-5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="plain flex items-center gap-1.5 whitespace-nowrap p-1.5 text-fg-muted no-underline hover:text-fg sm:p-0"
                  >
                    <item.icon />
                    <span className="sr-only sm:not-sr-only">{item.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={site.repo}
                  className="plain flex items-center gap-1.5 whitespace-nowrap p-1.5 text-fg-muted no-underline hover:text-fg sm:p-0"
                  target="_blank"
                  rel="noreferrer"
                >
                  <GitHubIcon />
                  <span className="sr-only sm:not-sr-only">GitHub</span>
                </a>
              </li>
            </ul>
          </nav>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-14">{children}</main>

        <footer className="mx-auto max-w-4xl px-6 pt-10 pb-16">
          <div className="hairline space-y-2 pt-6 text-fg-faint text-metadata">
            <p>
              Support data comes from{" "}
              <a
                href="https://github.com/web-platform-dx/web-features"
                target="_blank"
                rel="noreferrer"
              >
                web-features
              </a>
              , the dataset behind Baseline. It is resolved at build time, never
              written by hand.
            </p>
            <p>
              Built by{" "}
              <a href={site.authorUrl} target="_blank" rel="noreferrer">
                {site.author}
              </a>
              . The catalog is MIT and{" "}
              <a href={site.repo} target="_blank" rel="noreferrer">
                takes pull requests
              </a>
              .
            </p>
          </div>
        </footer>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
