import {
  type Finding,
  formatBytes,
  formatConditional,
  formatList,
} from "@youmightnotneed/catalog";
import Link from "next/link";
import { BaselineBadge } from "./baseline-badge";

/**
 * One finding. Renders the Baseline badge and the `unless` conditions every
 * time, without a disclosure to hide them behind. A replacement shown without
 * its caveats is the thing most likely to make this tool wrong in public.
 */
export function FindingCard({ finding }: { finding: Finding }) {
  const { rule, baseline, matched, replaceableBytes } = finding;
  const names = matched.map((m) => m.name);

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-semibold text-lg">
          <Link
            href={`/rules/${rule.id}`}
            className="no-underline hover:underline"
          >
            {rule.title}
          </Link>
        </h3>
        <div className="flex items-center gap-2">
          <BaselineBadge status={baseline.status} short />
          <span className="font-mono text-faint text-xs">
            {replaceableBytes === null
              ? "size unknown"
              : formatBytes(replaceableBytes)}
          </span>
        </div>
      </header>

      <p className="mb-3 text-muted text-sm leading-relaxed">
        {formatConditional(names, rule.agent.when, rule.native)}
      </p>

      <dl className="mb-4 grid gap-1 text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="text-faint">You have</dt>
          <dd className="font-mono text-link">{formatList(names)}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-faint">Native</dt>
          <dd className="font-mono">{rule.native}</dd>
        </div>
        {baseline.limitedBy !== null && (
          <div className="flex flex-wrap gap-2">
            <dt className="text-faint">Capped by</dt>
            <dd className="text-muted">
              {baseline.limitedBy.name}, which is{" "}
              {baseline.limitedBy.status === "limited"
                ? "limited availability"
                : "less widely supported than the rest"}
            </dd>
          </div>
        )}
      </dl>

      <details className="group">
        <summary className="cursor-pointer text-muted text-sm hover:text-text">
          Keep {names.length === 1 ? "it" : "them"} if any of these apply (
          {rule.agent.unless.length})
        </summary>
        <ul className="mt-3 space-y-2 border-border border-l-2 pl-4 text-faint text-sm leading-relaxed">
          {rule.agent.unless.map((condition) => (
            <li key={condition}>{condition}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}
