import type { Demo } from "@/lib/demos";

/**
 * Renders a hand-authored demo in a sandboxed iframe so it never touches
 * this page's DOM or styles. allow-scripts and allow-modals are scoped to
 * demos we wrote ourselves, never to anything a visitor supplies.
 * allow-modals is required for <dialog>.showModal() specifically: without
 * it the sandboxed-modals flag silently blocks the call.
 */
export function LiveDemo({ demo, title }: { demo: Demo; title: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-bg-subtle">
      <figcaption className="border-border border-b px-4 py-2 text-fg-faint text-metadata">
        Live example
      </figcaption>
      <iframe
        srcDoc={demo.html}
        title={`Live example: ${title}`}
        sandbox={["allow-scripts", "allow-modals", demo.extraSandbox]
          .filter(Boolean)
          .join(" ")}
        allow={demo.allow}
        loading="lazy"
        style={{ height: demo.height }}
        className="w-full"
      />
    </figure>
  );
}
