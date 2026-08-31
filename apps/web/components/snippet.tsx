import { codeToHtml } from "shiki";

/**
 * A code block, syntax highlighted at build time. This runs in a Server
 * Component and never ships to the browser: every rule page is static
 * (generateStaticParams), so the highlighted markup is plain HTML by the
 * time it reaches a visitor. Shiki itself never enters the client bundle.
 */
export async function Snippet({
  code,
  label,
}: {
  code: string;
  label?: string;
}) {
  const lang = code.trimStart().startsWith("<") ? "html" : "css";
  const html = await codeToHtml(code, {
    lang,
    theme: "github-dark-default",
  });

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-bg-subtle">
      {label === undefined ? null : (
        <figcaption className="border-border border-b px-4 py-2 font-mono text-fg-faint text-metadata">
          {label}
        </figcaption>
      )}
      <div
        className="snippet-shiki overflow-x-auto p-4 text-compact leading-relaxed"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output, generated at build time from our own rule data, never from user input.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  );
}
