import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  openGraph: {
    title: "Contact",
    description: "Report a wrong rule or suggest a new one.",
    url: "/contact",
  },
  alternates: { canonical: "/contact" },
  title: "Contact",
  description: "Report a wrong rule or suggest a new one.",
};

export default function ContactPage() {
  return (
    <div className="max-w-[62ch] space-y-8">
      <header>
        <h1 className="mb-4 text-page-title">Contact</h1>
        <p className="text-fg-muted text-lede">
          Everything goes through GitHub issues, so the answer is public and the
          next person with the same question can find it.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-section">What to open an issue for</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>A rule that overstates what the platform covers.</li>
          <li>A package that should match a rule and does not.</li>
          <li>A condition for keeping the dependency that is missing.</li>
          <li>A new rule. Say which package and what replaces it.</li>
        </ul>
        <p>
          <a href={`${site.repo}/issues`} target="_blank" rel="noreferrer">
            Open an issue on GitHub
          </a>
          . Pull requests are welcome too.
        </p>
      </section>
    </div>
  );
}
