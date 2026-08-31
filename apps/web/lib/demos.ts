import { wrapDemo } from "./demo-theme";

export interface Demo {
  /** iframe srcdoc, already wrapped with the shared dark theme. */
  html: string;
  /** Fixed iframe height in pixels. Demos are small, so a fixed height avoids a layout jump. */
  height: number;
}

/**
 * Hand-authored live demos, keyed by rule id. Not every rule has one: a demo
 * is only worth writing when seeing it beats reading the snippet, and only
 * for the cases that render without a real browser environment (no
 * scroll-driven or gesture demos here, since an embedded iframe can't fake
 * the user's own scrolling in a way that reads as real).
 */
export const demos: Partial<Record<string, Demo>> = {
  "aspect-ratio": {
    height: 180,
    html: wrapDemo(`
<div style="display:flex; gap:1.25rem; flex-wrap:wrap; justify-content:center;">
  <div style="width:180px; aspect-ratio:16/9; background:linear-gradient(135deg, var(--c-accent), var(--c-bg-subtle)); border-radius:0.5rem; display:flex; align-items:center; justify-content:center; font-size:0.75rem; color:var(--c-fg-muted);">16 / 9</div>
  <div style="width:110px; aspect-ratio:1; background:linear-gradient(135deg, var(--c-accent), var(--c-bg-subtle)); border-radius:0.5rem; display:flex; align-items:center; justify-content:center; font-size:0.75rem; color:var(--c-fg-muted);">1 / 1</div>
</div>
`),
  },

  "dialog-element": {
    // Tall enough to fit the opened dialog too, not just the trigger
    // button: an iframe clips its content to its own box, so a dialog
    // that pops open taller than the iframe would get cut off.
    height: 260,
    html: wrapDemo(
      `
<div>
  <button id="open">Delete this project?</button>
  <dialog id="confirm">
    <form method="dialog" style="display:flex; flex-direction:column; gap:0.75rem; min-width:220px; margin:0;">
      <p style="margin:0;">Delete this project?</p>
      <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
        <button value="cancel">Cancel</button>
        <button value="confirm" style="background:var(--c-accent); border-color:var(--c-accent); color:var(--c-bg);">Delete</button>
      </div>
    </form>
  </dialog>
</div>
<script>
  document.getElementById("open").addEventListener("click", () => {
    document.getElementById("confirm").showModal();
  });
</script>
`,
      `
dialog { border:1px solid var(--c-border); border-radius:0.5rem; background:var(--c-bg-subtle); color:var(--c-fg); padding:1.25rem; }
dialog::backdrop { background: rgb(0 0 0 / 0.5); backdrop-filter: blur(2px); }
`,
    ),
  },

  "exclusive-accordion": {
    height: 280,
    html: wrapDemo(
      `
<div style="width:260px; display:flex; flex-direction:column; gap:0.5rem;">
  <details name="demo-group" open>
    <summary>What is Baseline?</summary>
    <p>A shared set of features every major browser supports.</p>
  </details>
  <details name="demo-group">
    <summary>Why CSS over JS?</summary>
    <p>Less code shipped, and the browser already does the work.</p>
  </details>
  <details name="demo-group">
    <summary>Is this a polyfill?</summary>
    <p>No. This is the browser's own behavior for the name attribute.</p>
  </details>
</div>
`,
      `
details { border:1px solid var(--c-border); border-radius:0.375rem; padding:0.5rem 0.75rem; background:var(--c-bg-subtle); }
summary { cursor:pointer; }
details p { margin: 0.5rem 0 0; color: var(--c-fg-muted); font-size: 0.875rem; }
`,
    ),
  },

  "sticky-positioning": {
    height: 220,
    html: wrapDemo(
      `
<div class="scroller">
  <div class="sticky-header">Scroll me &darr;</div>
  <div style="padding:0.75rem; display:flex; flex-direction:column; gap:0.75rem; color:var(--c-fg-muted); font-size:0.875rem;">
    <p style="margin:0;">Row one</p>
    <p style="margin:0;">Row two</p>
    <p style="margin:0;">Row three</p>
    <p style="margin:0;">Row four</p>
    <p style="margin:0;">Row five</p>
    <p style="margin:0;">Row six</p>
    <p style="margin:0;">Row seven</p>
  </div>
</div>
`,
      `
.scroller { width:240px; height:180px; overflow-y:auto; border:1px solid var(--c-border); border-radius:0.5rem; }
.sticky-header { position:sticky; top:0; background:var(--c-accent); color:var(--c-bg); padding:0.5rem 0.75rem; font-size:0.8125rem; font-weight:600; }
`,
    ),
  },

  "text-wrap-balance": {
    height: 200,
    html: wrapDemo(`
<div style="display:flex; gap:2rem; flex-wrap:wrap; justify-content:center; max-width:480px;">
  <div style="width:200px;">
    <p style="font-size:0.75rem; color:var(--c-fg-muted); margin:0 0 0.5rem;">default wrapping</p>
    <h3 style="margin:0; font-size:1.25rem; line-height:1.25;">Find the CSS that replaces your JavaScript dependency</h3>
  </div>
  <div style="width:200px;">
    <p style="font-size:0.75rem; color:var(--c-fg-muted); margin:0 0 0.5rem;">text-wrap: balance</p>
    <h3 style="margin:0; font-size:1.25rem; line-height:1.25; text-wrap:balance;">Find the CSS that replaces your JavaScript dependency</h3>
  </div>
</div>
`),
  },
};
