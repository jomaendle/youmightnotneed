/**
 * A live demo renders in a sandboxed iframe, so it never inherits this
 * site's stylesheet. This is the shared base every demo is wrapped in: a
 * reset plus the same dark palette as `app/globals.css`, kept as literal
 * values rather than re-importing the site's Tailwind theme into an
 * isolated document.
 */
const BASE_CSS = `
  :root {
    color-scheme: dark;
    --c-bg: oklch(15% 0.005 260);
    --c-bg-subtle: oklch(18% 0.006 260);
    --c-fg: oklch(96% 0.002 260);
    --c-fg-muted: oklch(74% 0.008 260);
    --c-border: oklch(26% 0.008 260);
    --c-accent: oklch(70% 0.16 250);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    min-height: 100%;
    background: var(--c-bg);
    color: var(--c-fg);
    font: 15px/1.5 ui-sans-serif, system-ui, sans-serif;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  button {
    font: inherit;
    color: var(--c-fg);
    background: var(--c-bg-subtle);
    border: 1px solid var(--c-border);
    border-radius: 0.375rem;
    padding: 0.5rem 0.875rem;
    cursor: pointer;
  }
  button:hover { border-color: var(--c-accent); }
`;

/** Wraps a demo's body markup and CSS into a full document for iframe srcdoc. */
export function wrapDemo(bodyHtml: string, extraCss = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${BASE_CSS}
${extraCss}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
