import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import "./globals.css";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <header className="border-border/60 border-b">
          <nav className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
            <Link
              href="/"
              className="font-mono font-semibold text-sm text-text no-underline hover:text-link"
            >
              {site.name}
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link
                href="/rules"
                className="text-muted no-underline hover:text-link"
              >
                Rules
              </Link>
              <a
                href={site.repo}
                className="text-muted no-underline hover:text-link"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-3xl px-5 py-10">{children}</main>

        <footer className="mx-auto max-w-3xl px-5 pt-8 pb-14 text-faint text-sm">
          <p className="mb-2">
            Baseline data comes from{" "}
            <a
              href="https://github.com/web-platform-dx/web-features"
              target="_blank"
              rel="noreferrer"
            >
              web-features
            </a>
            , the dataset behind Baseline. Support status is never hardcoded.
          </p>
          <p>
            Built by{" "}
            <a
              href="https://www.jomaendle.com"
              target="_blank"
              rel="noreferrer"
            >
              {site.author}
            </a>
            . The rule catalog is MIT licensed and{" "}
            <a href={site.repo} target="_blank" rel="noreferrer">
              open to pull requests
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  );
}
