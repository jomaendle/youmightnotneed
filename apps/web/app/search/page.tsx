import {
  formatBytes,
  packageSizes,
  resolveBaseline,
  rules,
  type SearchResult,
  searchRules,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { BaselineBadge } from "@/components/baseline-badge";
import { SearchField } from "@/components/search-field";
import { site } from "@/lib/site";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

/** Package names people are most likely to recognise, one per area. */
const EXAMPLES = [
  "swiper",
  "uuid",
  "axios",
  "copy-to-clipboard",
  "@floating-ui/react",
] as const;

const packageCount = new Set(rules.flatMap((rule) => rule.replaces)).size;

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const query = (await searchParams).q?.trim();

  return {
    title: query ? `Search: ${query}` : "Search",
    description: `Look up one of the ${packageCount} npm packages in the catalog and see which native feature covers it.`,
    /*
     * A result page per query is thin, near-duplicate content, and the query
     * string is open to anything a crawler cares to invent. The rule pages
     * are what should be indexed, and they already are.
     */
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = ((await searchParams).q ?? "").trim();
  const results = searchRules(query);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-page-title">
          {query === "" ? (
            "Search the catalog"
          ) : (
            <Headline query={query} count={results.length} />
          )}
        </h1>
        <SearchField variant="page" defaultValue={query} />
      </header>

      <Body query={query} results={results} />
    </div>
  );
}

function Body({
  query,
  results,
}: {
  query: string;
  results: readonly SearchResult[];
}) {
  if (query === "") return <Prompt />;
  if (results.length === 0) return <NoMatch query={query} />;

  return (
    /*
     * One column, unlike /rules. The divider in .rule-columns follows
     * reading order, which is right for a long list and reads as a stray
     * line above the second column when a search returns three results.
     */
    <ul className="rule-list max-w-[52rem]">
      {results.map((result) => (
        <Result key={result.rule.id} result={result} />
      ))}
    </ul>
  );
}

function Headline({ query, count }: { query: string; count: number }) {
  if (count === 0) return <>Nothing matches {query}</>;
  return (
    <>
      {count} {count === 1 ? "rule" : "rules"} for {query}
    </>
  );
}

function Prompt() {
  return (
    <div className="space-y-5">
      <p className="max-w-[58ch] text-fg-muted text-lede">
        {packageCount} package names across {rules.length} rules. Type one you
        have installed, or the feature you are looking for.
      </p>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-2 text-metadata">
        <span className="text-fg-faint">Try</span>
        {EXAMPLES.map((name) => (
          <Link
            key={name}
            // A UrlObject rather than a template literal: typed routes do not
            // accept a query string spliced into the path.
            href={{ pathname: "/search", query: { q: name } }}
            className="plain font-mono text-fg-muted no-underline hover:text-fg hover:underline"
          >
            {name}
          </Link>
        ))}
      </p>
    </div>
  );
}

function NoMatch({ query }: { query: string }) {
  return (
    <div className="max-w-[58ch] space-y-3 text-fg-muted">
      <p>
        The catalog has {packageCount} package names in it and{" "}
        <span className="font-mono text-fg">{query}</span> is not one of them.
        That is a gap in the catalog rather than a verdict on the package.
      </p>
      <p>
        A rule gets written once there is a native feature that covers the same
        ground, with the cases where the package is still the better choice
        written next to it. If you know of one,{" "}
        <a href={site.repo} target="_blank" rel="noreferrer">
          the catalog takes pull requests
        </a>
        .
      </p>
      <p>
        <Link href="/rules" className="text-compact">
          Browse all {rules.length} rules
        </Link>
      </p>
    </div>
  );
}

function Result({ result }: { result: SearchResult }) {
  const { rule, packages } = result;
  const bytes = packages.reduce(
    (total, name) => total + (packageSizes.sizes[name]?.gzip ?? 0),
    0,
  );

  return (
    <li>
      <Link
        href={`/rules/${rule.id}`}
        className="plain group flex flex-col gap-y-1 py-3.5 no-underline"
      >
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="group-hover:underline">{rule.title}</span>
          <BaselineBadge status={resolveBaseline(rule).status} short={true} />
        </span>
        <span className="block font-mono text-accent text-metadata">
          {rule.native}
        </span>
        {packages.length === 0 ? null : (
          <span className="block font-mono text-fg-faint text-metadata">
            {packages.join(", ")}
            {bytes > 0 ? ` · up to ${formatBytes(bytes)}` : ""}
          </span>
        )}
      </Link>
    </li>
  );
}
