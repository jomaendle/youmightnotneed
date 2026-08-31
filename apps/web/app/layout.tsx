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

const NAV = [
  { href: "/rules", label: "Rules" },
  { href: "/native", label: "This site" },
] as const;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh">
        <header className="sticky top-0 z-40 border-border border-b bg-bg/85 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-6 py-3.5">
            <Link
              href="/"
              className="plain font-medium text-[0.9375rem] tracking-tight no-underline"
            >
              youmightnotneed
            </Link>
            <ul className="flex items-center gap-5 text-metadata">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="plain text-fg-muted no-underline hover:text-fg"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={site.repo}
                  className="plain text-fg-muted no-underline hover:text-fg"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
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
      </body>
    </html>
  );
}
