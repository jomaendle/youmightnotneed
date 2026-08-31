import {
  type Finding,
  formatBytes,
  formatConditional,
  formatList,
} from "@jomae/catalog";
import Link from "next/link";
import { BaselineBadge } from "./baseline-badge";

/**
 * One finding.
 *
 * The `unless` conditions are always present in the markup, inside a <details>
 * so they do not drown the page. A replacement shown without its caveats is
 * how a tool like this ends up wrong in public.
 *
 * The layout reflows on the container's width via a container query, not the
 * viewport, so a finding reads correctly in a narrow column too.
 */
export function FindingCard({ finding }: { finding: Finding }) {
  const { rule, baseline, matched, replaceableBytes } = finding;
  const names = matched.map((m) => m.name);

  return (
    <article className="finding-scope py-6">
      <div className="finding-head mb-2.5">
        <h3 className="text-subsection">
          <Link
            href={`/rules/${rule.id}`}
            className="plain no-underline hover:underline"
          >
            {rule.title}
          </Link>
        </h3>
        <div className="finding-meta mt-1.5 flex items-center gap-3">
          <BaselineBadge status={baseline.status} short={true} />
          <span className="font-mono text-fg-faint text-metadata">
            {replaceableBytes === null
              ? "size unknown"
              : formatBytes(replaceableBytes)}
          </span>
        </div>
      </div>

      <p className="mb-3 max-w-[62ch] text-fg-muted">
        {formatConditional(names, rule.agent.when, rule.native)}
      </p>

      <dl className="mb-3 space-y-1 text-compact">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-fg-faint">You have</dt>
          <dd className="font-mono">{formatList(names)}</dd>
        </div>
        {baseline.limitedBy === null ? null : (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-fg-faint">Held back by</dt>
            <dd className="text-fg-muted">{baseline.limitedBy.name}</dd>
          </div>
        )}
      </dl>

      <details className="disclosure">
        <summary className="text-fg-muted text-metadata">
          Keep {names.length === 1 ? "it" : "them"} if any of these apply
          <span className="text-fg-faint"> ({rule.agent.unless.length})</span>
        </summary>
        <ul className="mt-3 max-w-[68ch] space-y-2 border-border border-l pl-4 text-compact text-fg-muted">
          {rule.agent.unless.map((condition) => (
            <li key={condition}>{condition}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}
