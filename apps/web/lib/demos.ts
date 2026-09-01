import { wrapDemo } from "./demo-theme";

export interface Demo {
  /** iframe srcdoc, already wrapped with the shared dark theme. */
  html: string;
  /** Fixed iframe height in pixels. Demos are small, so a fixed height avoids a layout jump. */
  height: number;
}

/** A small solid placeholder image, so lazy-loading has something real to defer. */
const SOLID =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%233b6ea5'/%3E%3C/svg%3E";

/**
 * Hand-authored live demos, keyed by rule id. Not every rule has one: a demo
 * is only worth writing when seeing it beats reading the snippet. Most are
 * genuinely interactive (click, type, drag-resize, scroll); a few (masonry,
 * text-box-trim, lazy-loading) are a static before/after or an honest label
 * rather than a faked effect, because the payoff (a layout algorithm, a
 * deferred network fetch) is not something a visitor operates or a tiny
 * frame can show truthfully.
 */
export const demos: Partial<Record<string, Demo>> = {
  "aspect-ratio": {
    height: 180,
    html: wrapDemo(
      `
<div style="display:flex; gap:1.25rem; flex-wrap:wrap; justify-content:center;">
  <div class="box demo-swatch" style="width:180px; aspect-ratio:16/9;">16 / 9</div>
  <div class="box demo-swatch" style="width:110px; aspect-ratio:1;">1 / 1</div>
</div>
`,
      `
.box { border-radius:0.5rem; display:flex; align-items:center; justify-content:center; font-size:0.75rem; color:var(--c-fg-muted); }
`,
    ),
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
<div class="scroller demo-scroll">
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
.scroller { width:240px; height:180px; }
.sticky-header { position:sticky; top:0; background:var(--c-accent); color:var(--c-bg); padding:0.5rem 0.75rem; font-size:0.8125rem; font-weight:600; }
`,
    ),
  },

  "text-wrap-balance": {
    height: 200,
    html: wrapDemo(`
<div style="display:flex; gap:2rem; flex-wrap:wrap; justify-content:center; max-width:480px;">
  <div style="width:200px;">
    <p class="demo-hint" style="margin-bottom:0.5rem;">default wrapping</p>
    <h3 style="margin:0; font-size:1.25rem; line-height:1.25;">Find the CSS that replaces your JavaScript dependency</h3>
  </div>
  <div style="width:200px;">
    <p class="demo-hint" style="margin-bottom:0.5rem;">text-wrap: balance</p>
    <h3 style="margin:0; font-size:1.25rem; line-height:1.25; text-wrap:balance;">Find the CSS that replaces your JavaScript dependency</h3>
  </div>
</div>
`),
  },

  "carousel-scroll-markers": {
    height: 200,
    html: wrapDemo(
      `
<div>
  <div class="carousel">
    <div class="slide demo-swatch">1</div>
    <div class="slide demo-swatch">2</div>
    <div class="slide demo-swatch">3</div>
    <div class="slide demo-swatch">4</div>
  </div>
  <p class="demo-hint" style="margin-top:0.5rem; text-align:center;">Drag or scroll horizontally &rarr;</p>
</div>
`,
      `
.carousel { display:flex; gap:0.75rem; overflow-x:auto; scroll-snap-type:x mandatory; width:240px; padding-bottom:0.25rem; }
.slide { flex:0 0 200px; height:110px; border-radius:0.5rem; scroll-snap-align:center; display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:var(--c-fg); }
`,
    ),
  },

  "css-color-functions": {
    height: 260,
    html: wrapDemo(
      `
<div style="display:flex; flex-direction:column; align-items:center; gap:1rem;">
  <div style="display:flex; gap:1.5rem;">
    <label style="display:flex; flex-direction:column; align-items:center; gap:0.375rem; font-size:0.75rem; color:var(--c-fg-muted);">
      Color A
      <input type="color" id="color-a" value="#3b82f6" style="width:44px; height:32px; border:none; background:none; cursor:pointer;">
    </label>
    <label style="display:flex; flex-direction:column; align-items:center; gap:0.375rem; font-size:0.75rem; color:var(--c-fg-muted);">
      Color B
      <input type="color" id="color-b" value="#f97316" style="width:44px; height:32px; border:none; background:none; cursor:pointer;">
    </label>
  </div>
  <div id="mix" class="swatch"></div>
  <p class="demo-hint" style="font-family:var(--font-mono, monospace);">color-mix(in oklch, A 50%, B)</p>
</div>
<script>
  const a = document.getElementById("color-a");
  const b = document.getElementById("color-b");
  const mix = document.getElementById("mix");
  function update() {
    mix.style.background = "color-mix(in oklch, " + a.value + " 50%, " + b.value + ")";
  }
  a.addEventListener("input", update);
  b.addEventListener("input", update);
  update();
</script>
`,
      `
.swatch { width:180px; height:60px; border-radius:0.5rem; border:1px solid var(--c-border); }
`,
    ),
  },

  "container-queries": {
    height: 200,
    html: wrapDemo(
      `
<div>
  <div class="resizer demo-resizer">
    <div class="card">Card content</div>
  </div>
  <p class="demo-hint" style="margin-top:0.5rem;">Drag the corner to resize &#8600;</p>
</div>
`,
      `
.resizer { width:150px; min-width:110px; max-width:280px; height:70px; padding:0.5rem; }
.card { background:var(--c-bg); border:1px solid var(--c-border); border-radius:0.375rem; padding:0.5rem; font-size:0.8125rem; height:100%; box-sizing:border-box; display:flex; align-items:center; }
@container (min-width: 220px) { .card { background:var(--c-accent); color:var(--c-bg); font-weight:600; border-color:var(--c-accent); } }
`,
    ),
  },

  "discrete-transitions": {
    height: 160,
    html: wrapDemo(
      `
<div>
  <button id="toggle-toast">Toggle</button>
  <div id="toast" class="toast" hidden>Enter and exit, no JS animation</div>
</div>
<script>
  const toast = document.getElementById("toast");
  document.getElementById("toggle-toast").addEventListener("click", () => {
    toast.hidden = !toast.hidden;
  });
</script>
`,
      `
.toast { margin-top:0.75rem; padding:0.5rem 0.75rem; border-radius:0.375rem; background:var(--c-accent); color:var(--c-bg); font-size:0.8125rem; opacity:1; translate:0 0; transition: opacity 0.3s, translate 0.3s, display 0.3s allow-discrete; }
@starting-style { .toast:not([hidden]) { opacity:0; translate:0 0.5rem; } }
.toast[hidden] { display:none; opacity:0; translate:0 0.5rem; }
`,
    ),
  },

  "field-sizing": {
    height: 160,
    html: wrapDemo(
      `
<textarea class="autosize" placeholder="Type to see it grow">Field-sizing: content</textarea>
`,
      `
.autosize { field-sizing:content; min-height:2.25rem; max-height:8rem; width:220px; padding:0.5rem 0.75rem; border-radius:0.375rem; border:1px solid var(--c-border); background:var(--c-bg); color:var(--c-fg); font:inherit; resize:none; }
`,
    ),
  },

  "fluid-type-clamp": {
    height: 180,
    html: wrapDemo(
      `
<div>
  <div class="resizer demo-resizer">
    <p class="fluid">Fluid headline</p>
  </div>
  <p class="demo-hint" style="margin-top:0.5rem;">Drag the corner to resize &#8600;</p>
</div>
`,
      `
.resizer { width:260px; min-width:140px; max-width:360px; height:70px; padding:0.5rem 0.75rem; display:flex; align-items:center; }
.fluid { margin:0; font-size:clamp(1.1rem, 0.85rem + 2cqi, 2.25rem); font-weight:700; line-height:1.15; }
`,
    ),
  },

  "height-auto-animation": {
    height: 180,
    html: wrapDemo(
      `
<div>
  <button id="toggle-panel">Toggle details</button>
  <div id="panel" class="panel">
    <div class="panel-inner">This animates from 0 to its natural height and back. No JS measures anything.</div>
  </div>
</div>
<script>
  document.getElementById("toggle-panel").addEventListener("click", () => {
    document.getElementById("panel").toggleAttribute("data-open");
  });
</script>
`,
      `
:root { interpolate-size: allow-keywords; }
.panel { height:0; overflow:hidden; transition:height 0.3s ease; }
.panel[data-open] { height:auto; }
.panel-inner { padding-top:0.75rem; font-size:0.8125rem; color:var(--c-fg-muted); width:220px; }
`,
    ),
  },

  "css-masonry": {
    height: 220,
    html: wrapDemo(
      `
<div class="masonry">
  <div class="item demo-swatch" style="height:50px;"></div>
  <div class="item demo-swatch" style="height:85px;"></div>
  <div class="item demo-swatch" style="height:40px;"></div>
  <div class="item demo-swatch" style="height:70px;"></div>
</div>
`,
      `
.masonry { display:grid; grid-template-columns:repeat(2, 100px); grid-template-rows:masonry; gap:0.625rem; }
.item { border-radius:0.375rem; }
/* Masonry has near-zero browser support today, so without this fallback
   the live example renders as a plain grid with dead space under the
   shorter item in each row, which reads as a bug rather than a demo. */
@supports not (grid-template-rows: masonry) {
  .masonry { display:block; columns:100px 2; column-gap:0.625rem; }
  .item { break-inside:avoid; margin-bottom:0.625rem; }
}
`,
    ),
  },

  "popover-anchor-positioning": {
    height: 160,
    html: wrapDemo(
      `
<button popovertarget="menu" id="trigger">Open</button>
<div popover id="menu">Anchored content</div>
`,
      `
#trigger { anchor-name: --trigger; }
#menu {
  margin: 0;
  position: absolute;
  position-anchor: --trigger;
  top: anchor(bottom);
  left: anchor(left);
  margin-top: 0.5rem;
  position-try-fallbacks: flip-block;
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  background: var(--c-bg-subtle);
  color: var(--c-fg);
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
}
`,
    ),
  },

  "scroll-driven-animations": {
    height: 220,
    html: wrapDemo(
      `
<div class="scroller demo-scroll">
  <div class="spacer-top">Scroll down &darr;</div>
  <div class="reveal">I fade and rise as I enter view</div>
  <div class="spacer-bottom"></div>
</div>
`,
      `
.scroller { width:240px; height:180px; }
.spacer-top { height:130px; display:flex; align-items:center; justify-content:center; color:var(--c-fg-faint); font-size:0.8125rem; }
.reveal { margin:1rem; padding:1rem; background:var(--c-accent); color:var(--c-bg); border-radius:0.5rem; text-align:center; font-size:0.8125rem; animation: rise linear both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
.spacer-bottom { height:120px; }
@keyframes rise { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
`,
    ),
  },

  "overscroll-behavior": {
    height: 200,
    html: wrapDemo(
      `
<div>
  <div class="drawer demo-scroll">
    <p style="margin:0 0 0.5rem;">Scroll to the end</p>
    <p>Row one</p><p>Row two</p><p>Row three</p><p>Row four</p><p>Row five</p>
  </div>
  <p class="demo-hint" style="margin-top:0.5rem;">overscroll-behavior: contain stops the scroll chaining to the page behind</p>
</div>
`,
      `
.drawer { width:220px; height:120px; overscroll-behavior:contain; padding:0.5rem 0.75rem; font-size:0.8125rem; color:var(--c-fg-muted); }
.drawer p { margin:0.5rem 0; }
`,
    ),
  },

  "customizable-select": {
    height: 160,
    html: wrapDemo(
      `
<select>
  <button>
    <selectedcontent></selectedcontent>
  </button>
  <option value="de"><span aria-hidden="true">DE</span> Germany</option>
  <option value="at"><span aria-hidden="true">AT</span> Austria</option>
  <option value="ch"><span aria-hidden="true">CH</span> Switzerland</option>
</select>
`,
      `
select, select::picker(select) { appearance: base-select; }
select { border:1px solid var(--c-border); border-radius:0.375rem; background:var(--c-bg-subtle); color:var(--c-fg); padding:0.375rem 0.625rem; font:inherit; }
select::picker(select) { border-radius:0.5rem; padding:0.25rem; border:1px solid var(--c-border); background:var(--c-bg-subtle); }
option { padding:0.375rem 0.5rem; border-radius:0.25rem; }
option:checked { background:var(--c-accent); color:var(--c-bg); }
`,
    ),
  },

  "styled-scrollbars": {
    height: 200,
    html: wrapDemo(
      `
<div class="scroller demo-scroll">
  <p>Row one</p><p>Row two</p><p>Row three</p><p>Row four</p><p>Row five</p><p>Row six</p><p>Row seven</p>
</div>
`,
      `
.scroller { width:200px; height:160px; scrollbar-width:thin; scrollbar-color:var(--c-accent) var(--c-bg-subtle); padding:0.5rem 0.75rem; font-size:0.8125rem; color:var(--c-fg-muted); }
.scroller p { margin:0.5rem 0; }
`,
    ),
  },

  "smooth-scroll": {
    height: 220,
    html: wrapDemo(
      `
<div style="width:240px;">
  <nav class="tabs">
    <a href="#s1">One</a>
    <a href="#s2">Two</a>
    <a href="#s3">Three</a>
  </nav>
  <div class="scroller demo-scroll">
    <section id="s1">Section one</section>
    <section id="s2">Section two</section>
    <section id="s3">Section three</section>
  </div>
</div>
`,
      `
.tabs { display:flex; gap:0.5rem; margin-bottom:0.5rem; }
.tabs a { padding:0.25rem 0.625rem; border:1px solid var(--c-border); border-radius:999px; font-size:0.75rem; text-decoration:none; color:var(--c-fg-muted); }
.tabs a:hover { color:var(--c-fg); border-color:var(--c-accent); }
.scroller { height:120px; scroll-behavior:smooth; }
.scroller section { height:120px; scroll-margin-top:0.5rem; display:flex; align-items:center; justify-content:center; font-size:0.8125rem; color:var(--c-fg-muted); }
.scroller section:nth-child(odd) { background:var(--c-bg-subtle); }
`,
    ),
  },

  "text-box-trim": {
    height: 200,
    html: wrapDemo(`
<div style="display:flex; gap:2rem; flex-wrap:wrap; justify-content:center;">
  <div style="width:170px;">
    <p class="demo-hint" style="margin-bottom:0.5rem;">default leading</p>
    <h3 style="margin:0; padding:0.5rem; background:var(--c-bg); outline:1px dashed var(--c-border); font-size:1.5rem; line-height:1.2;">Fixed aspect ratios</h3>
  </div>
  <div style="width:170px;">
    <p class="demo-hint" style="margin-bottom:0.5rem;">text-box-trim: both</p>
    <h3 style="margin:0; padding:0.5rem; background:var(--c-bg); outline:1px dashed var(--c-border); font-size:1.5rem; line-height:1.2; text-box-trim:both; text-box-edge:cap alphabetic;">Fixed aspect ratios</h3>
  </div>
</div>
`),
  },

  "view-transitions": {
    height: 200,
    html: wrapDemo(
      `
<div>
  <button id="swap">Swap</button>
  <div id="stage" class="stage">
    <div class="tile tile-a">A</div>
  </div>
</div>
<script>
  let showingA = true;
  const stage = document.getElementById("stage");
  document.getElementById("swap").addEventListener("click", () => {
    const render = () => {
      showingA = !showingA;
      stage.innerHTML = showingA
        ? '<div class="tile tile-a">A</div>'
        : '<div class="tile tile-b">B</div>';
    };
    if (document.startViewTransition) {
      document.startViewTransition(render);
    } else {
      render();
    }
  });
</script>
`,
      `
.stage { margin-top:0.75rem; }
.tile { width:120px; height:80px; border-radius:0.5rem; display:flex; align-items:center; justify-content:center; font-size:1.25rem; color:var(--c-fg); view-transition-name:tile; }
.tile-a { background:linear-gradient(135deg, var(--c-accent), var(--c-bg-subtle)); }
.tile-b { background:linear-gradient(135deg, var(--c-bg-subtle), var(--c-accent)); }
`,
    ),
  },

  "lazy-loading": {
    height: 220,
    html: wrapDemo(
      `
<div class="scroller demo-scroll">
  <p class="demo-hint" style="margin-bottom:0.75rem;">Scroll down. Each image below carries loading="lazy".</p>
  <img class="ph" loading="eager" src="${SOLID}" alt="Above the fold, loads eagerly" />
  <img class="ph" loading="lazy" src="${SOLID}" alt="Deferred" />
  <img class="ph" loading="lazy" src="${SOLID}" alt="Deferred" />
  <img class="ph" loading="lazy" src="${SOLID}" alt="Deferred" />
  <p class="demo-hint" style="margin-bottom:0.75rem;">This frame is too small to show a fetch deferring.
  Open devtools on a live page to see it wait.</p>
</div>
`,
      `
.scroller { width:240px; height:180px; padding:0.75rem; }
.ph { display:block; width:100%; height:70px; border-radius:0.375rem; margin-bottom:0.75rem; }
`,
    ),
  },
};
