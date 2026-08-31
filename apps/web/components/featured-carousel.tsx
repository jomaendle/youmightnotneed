import { formatBytes, packageSizes, type Rule } from "@jomae/catalog";
import Link from "next/link";

/**
 * A horizontal set of rules, built the way the carousel rule recommends.
 *
 * scroll-snap does the snapping everywhere. Where ::scroll-button() and
 * ::scroll-marker() are supported the browser generates the arrows and dots,
 * and wires up their scrolling, disabled states, focus order and accessible
 * names. Where they are not, this degrades to a plain snapping scroll
 * container with a thin scrollbar, which is still a usable carousel.
 *
 * No JavaScript is shipped for any of it.
 */
export function FeaturedCarousel({ rules }: { rules: readonly Rule[] }) {
  return (
    <div className="carousel-frame">
      {/*
        A scrollable region has to be focusable or it cannot be scrolled from
        the keyboard, and a <section> with an accessible name is already a
        region landmark. Where ::scroll-marker() is supported the dots become
        real tab stops on top of this.
      */}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: WAI's scrollable-region pattern requires tabindex="0" on the scroll container so keyboard users can scroll it. Removing it would be the accessibility regression, not the fix. */}
      <section className="carousel" aria-label="Featured rules" tabIndex={0}>
        {rules.map((rule) => (
          <CarouselCard key={rule.id} rule={rule} />
        ))}
      </section>
    </div>
  );
}

function CarouselCard({ rule }: { rule: Rule }) {
  const weight = rule.replaces.reduce(
    (total, pkg) => total + (packageSizes.sizes[pkg]?.gzip ?? 0),
    0,
  );

  return (
    <Link
      href={`/rules/${rule.id}`}
      className="carousel-item plain flex h-full flex-col gap-2 rounded-lg border border-border bg-bg-subtle p-4 no-underline transition-colors hover:border-border-strong"
    >
      <span className="text-subsection">{rule.title}</span>
      <span className="font-mono text-accent text-metadata">{rule.native}</span>
      <span className="mt-auto pt-2 text-fg-faint text-metadata">
        {rule.replaces.length}{" "}
        {rule.replaces.length === 1 ? "package" : "packages"}
        {weight > 0 ? `, up to ${formatBytes(weight)}` : ""}
      </span>
    </Link>
  );
}
