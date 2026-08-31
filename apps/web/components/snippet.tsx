/**
 * A code block. Deliberately not syntax highlighted: a highlighter is one of
 * the heavier dependencies people ask this tool about, and shipping one here
 * to render CSS would be a poor look.
 */
export function Snippet({ code, label }: { code: string; label?: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-bg-subtle">
      {label === undefined ? null : (
        <figcaption className="border-border border-b px-4 py-2 font-mono text-fg-faint text-metadata">
          {label}
        </figcaption>
      )}
      <pre className="overflow-x-auto p-4 text-compact leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </figure>
  );
}
