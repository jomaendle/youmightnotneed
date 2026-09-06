import { rules } from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchField } from "@/components/search-field";
import {
  ALL_PACKAGES,
  groupByInitial,
  type PackageGroup,
} from "@/lib/packages";

export const metadata: Metadata = {
  title: "Packages",
  description: `Every npm package the catalog covers, ${ALL_PACKAGES.length} of them, and the native feature that replaces each one.`,
};

const GROUPS = groupByInitial(ALL_PACKAGES);

export default function PackagesPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-page-title">Every package covered</h1>
        <p className="max-w-[60ch] text-fg-muted text-lede">
          {ALL_PACKAGES.length} names across {rules.length} rules. A rule is
          named after the feature that replaces it, so this is the list to scan
          if you know the dependency but not what the platform calls its
          replacement.
        </p>
        <SearchField variant="page" />
      </header>

      {GROUPS.map((group) => (
        <Group key={group.letter} group={group} />
      ))}
    </div>
  );
}

function Group({ group }: { group: PackageGroup }) {
  return (
    <section>
      <h2 className="mb-2 font-mono text-accent text-metadata">
        {group.letter}
      </h2>
      {/* Same column treatment as the rules index: a long list reflows, and
          the divider follows reading order rather than geometry. */}
      <ul className="rule-list rule-columns">
        {group.entries.map(({ name, rule }) => (
          <li key={name}>
            <Link
              href={`/rules/${rule.id}`}
              className="plain group flex flex-col gap-y-0.5 py-2.5 no-underline"
            >
              <span className="block font-mono text-compact group-hover:underline">
                {name}
              </span>
              <span className="block text-fg-faint text-metadata">
                {rule.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
