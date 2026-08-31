/**
 * A code block. Deliberately not syntax highlighted: a highlighter is one of
 * the heavier dependencies the catalog gets asked about, and shipping one here
 * to display CSS would be a poor look.
 */
export function Snippet({ code, label }: { code: string; label?: string }) {
  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-border bg-surface">
      {label !== undefined && (
        <figcaption className="border-border border-b px-4 py-2 font-mono text-faint text-xs">
          {label}
        </figcaption>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </figure>
  );
}
