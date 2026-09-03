import { wrapDemo } from "./demo-theme";

export interface Demo {
  /** iframe srcdoc, already wrapped with the shared dark theme. */
  html: string;
  /** Fixed iframe height in pixels. Demos are small, so a fixed height avoids a layout jump. */
  height: number;
  /**
   * Permissions-Policy grant for this demo's iframe, e.g. "fullscreen" or
   * "screen-wake-lock". Most demos need nothing here: the API either needs no
   * grant (clipboard-write's default allowlist is "*") or can't be granted
   * meaningfully in a nested, sandboxed, cross-origin frame at all (bluetooth,
   * microphone), in which case the demo uses the honest-fallback pattern
   * instead of asking for a permission that would still fail.
   */
  allow?: string;
  /**
   * Extra sandbox token(s) beyond the default "allow-scripts allow-modals",
   * e.g. "allow-fullscreen". The Fullscreen API is suppressed in a sandboxed
   * iframe without this token even when Permissions-Policy allows it.
   */
  extraSandbox?: string;
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

  "abort-controller": {
    height: 170,
    html: wrapDemo(
      `
<div style="display:flex; flex-direction:column; align-items:center; gap:0.875rem;">
  <div style="display:flex; gap:0.5rem;">
    <button id="start">Start task</button>
    <button id="cancel" disabled>Cancel</button>
  </div>
  <p id="status" class="demo-hint" data-state="idle">idle</p>
</div>
<script>
  const startBtn = document.getElementById("start");
  const cancelBtn = document.getElementById("cancel");
  const status = document.getElementById("status");
  let controller = null;

  function setStatus(text, state) {
    status.textContent = text;
    status.dataset.state = state;
  }

  function run() {
    controller = new AbortController();
    const signal = controller.signal;
    startBtn.disabled = true;
    cancelBtn.disabled = false;

    let remaining = 3;
    setStatus("pending, " + remaining + "s left", "pending");
    const tick = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) setStatus("pending, " + remaining + "s left", "pending");
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(tick);
      setStatus("done", "done");
      startBtn.disabled = false;
      cancelBtn.disabled = true;
    }, 3000);

    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      clearInterval(tick);
      setStatus("cancelled", "cancelled");
      startBtn.disabled = false;
      cancelBtn.disabled = true;
    });
  }

  startBtn.addEventListener("click", run);
  cancelBtn.addEventListener("click", () => controller && controller.abort());
</script>
`,
      `
button:disabled { opacity: 0.4; cursor: default; border-color: var(--c-border); }
#status { font-family: ui-monospace, monospace; font-size: 0.8125rem; min-height: 1.25rem; }
#status[data-state="pending"] { color: var(--c-accent); }
#status[data-state="done"] { color: var(--c-fg); }
#status[data-state="cancelled"] { color: var(--c-fg-muted); }
`,
    ),
  },

  "broadcast-channel": {
    height: 220,
    html: wrapDemo(
      `
<div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem;">
  <div class="tabs">
    <div class="tab">
      <span class="tab-label">Tab A</span>
      <span class="count" id="count-a">0</span>
      <button id="add-a">Add to cart</button>
    </div>
    <div class="tab">
      <span class="tab-label">Tab B</span>
      <span class="count" id="count-b">0</span>
      <button id="add-b">Add to cart</button>
    </div>
  </div>
  <p class="demo-hint" style="text-align:center;">Two separate BroadcastChannel instances, same channel name</p>
</div>
<script>
  let valueA = 0;
  let valueB = 0;
  const displayA = document.getElementById("count-a");
  const displayB = document.getElementById("count-b");
  const channelA = new BroadcastChannel("cart-updates");
  const channelB = new BroadcastChannel("cart-updates");

  document.getElementById("add-a").addEventListener("click", () => {
    valueA++;
    displayA.textContent = valueA;
    channelA.postMessage({ itemCount: valueA });
  });
  document.getElementById("add-b").addEventListener("click", () => {
    valueB++;
    displayB.textContent = valueB;
    channelB.postMessage({ itemCount: valueB });
  });
  channelB.onmessage = (event) => {
    valueB = event.data.itemCount;
    displayB.textContent = valueB;
  };
  channelA.onmessage = (event) => {
    valueA = event.data.itemCount;
    displayA.textContent = valueA;
  };
</script>
`,
      `
.tabs { display:flex; gap:0.875rem; }
.tab { width:130px; border:1px solid var(--c-border); border-radius:0.5rem; padding:0.875rem 0.75rem; display:flex; flex-direction:column; align-items:center; gap:0.625rem; background:var(--c-bg-subtle); }
.tab-label { font-size:0.6875rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--c-fg-muted); }
.count { font-size:1.75rem; font-weight:700; font-variant-numeric:tabular-nums; }
`,
    ),
  },

  "structured-clone": {
    height: 260,
    html: wrapDemo(
      `
<div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem;">
  <div style="display:flex; gap:0.5rem;">
    <button id="clone">structuredClone()</button>
    <button id="mutate">Push to original.tags</button>
  </div>
  <div class="panels">
    <div class="panel">
      <p class="demo-hint" style="margin-bottom:0.375rem;">original</p>
      <pre id="original" class="json"></pre>
    </div>
    <div class="panel">
      <p class="demo-hint" style="margin-bottom:0.375rem;">clone</p>
      <pre id="clone-out" class="json" data-empty="true">not cloned yet</pre>
    </div>
  </div>
</div>
<script>
  const original = { name: "cart", tags: ["sale"] };
  let clone = null;
  const originalEl = document.getElementById("original");
  const cloneEl = document.getElementById("clone-out");

  function render() {
    originalEl.textContent = JSON.stringify(original, null, 2);
    if (clone) {
      cloneEl.textContent = JSON.stringify(clone, null, 2);
      cloneEl.dataset.empty = "false";
    } else {
      cloneEl.textContent = "not cloned yet";
      cloneEl.dataset.empty = "true";
    }
  }

  document.getElementById("clone").addEventListener("click", () => {
    clone = structuredClone(original);
    render();
  });
  document.getElementById("mutate").addEventListener("click", () => {
    original.tags.push("new");
    render();
  });
  render();
</script>
`,
      `
.panels { display:flex; gap:0.875rem; }
.panel { width:150px; border:1px solid var(--c-border); border-radius:0.5rem; padding:0.625rem 0.75rem; background:var(--c-bg-subtle); }
.json { margin:0; font-family:ui-monospace, monospace; font-size:0.75rem; color:var(--c-fg-muted); white-space:pre-wrap; word-break:break-word; min-height:3.5rem; }
#clone-out[data-empty="true"] { color: var(--c-fg-muted); font-style: italic; }
`,
    ),
  },

  "content-visibility": {
    height: 280,
    html: wrapDemo(
      `
<div>
  <div class="scroller demo-scroll">
    <div class="row">Row 1</div>
    <div class="row">Row 2</div>
    <div class="row">Row 3</div>
    <div class="row">Row 4</div>
    <div class="row">Row 5</div>
    <div class="row">Row 6</div>
    <div class="row">Row 7</div>
    <div class="row">Row 8</div>
    <div class="row">Row 9</div>
    <div class="row">Row 10</div>
    <div class="row">Row 11</div>
    <div class="row">Row 12</div>
  </div>
  <p class="demo-hint" style="margin-top:0.5rem;">Each row below carries content-visibility: auto. Off-screen rows skip layout and paint until they near view. This frame is too small to show the saved work; open devtools' rendering panel on a live page to see it.</p>
</div>
`,
      `
.scroller { width:260px; height:170px; padding:0.75rem; }
.row { content-visibility:auto; contain-intrinsic-size:auto 44px; height:44px; margin-bottom:0.5rem; border-radius:0.375rem; background:var(--c-bg-subtle); display:flex; align-items:center; padding:0 0.75rem; font-size:0.8125rem; color:var(--c-fg-muted); }
`,
    ),
  },

  "line-clamp": {
    height: 200,
    html: wrapDemo(
      `
<div style="display:flex; gap:1.5rem; flex-wrap:wrap; justify-content:center;">
  <div style="width:180px;">
    <p class="demo-hint" style="margin-bottom:0.5rem;">overflow: hidden</p>
    <p class="card overflowing">The library measures rendered line height in JavaScript and cuts the string by hand, re-running on every resize and font load.</p>
  </div>
  <div style="width:180px;">
    <p class="demo-hint" style="margin-bottom:0.5rem;">-webkit-line-clamp: 3</p>
    <p class="card clamped">The library measures rendered line height in JavaScript and cuts the string by hand, re-running on every resize and font load.</p>
  </div>
</div>
`,
      `
.card { width:180px; padding:0.625rem; border:1px solid var(--c-border); border-radius:0.375rem; background:var(--c-bg-subtle); font-size:0.8125rem; color:var(--c-fg-muted); margin:0; }
.overflowing { height:4.7em; overflow:hidden; }
.clamped { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; }
`,
    ),
  },

  "resizable-panels": {
    height: 180,
    html: wrapDemo(
      `
<div>
  <div class="panel demo-resizer">Sidebar content</div>
  <p class="demo-hint" style="margin-top:0.5rem;">Drag the corner to resize &#8600;</p>
</div>
`,
      `
.panel { width:160px; min-width:110px; max-width:280px; height:110px; padding:0.625rem 0.75rem; background:var(--c-bg-subtle); font-size:0.8125rem; color:var(--c-fg-muted); }
`,
    ),
  },

  "date-time-input": {
    height: 180,
    html: wrapDemo(
      `
<div style="display:flex; flex-direction:column; gap:1rem; width:220px;">
  <label class="field">
    Departure date
    <input type="date" min="2024-01-01" required>
  </label>
  <label class="field">
    Departure time
    <input type="time" required>
  </label>
</div>
`,
      `
.field { display:flex; flex-direction:column; gap:0.375rem; font-size:0.8125rem; color:var(--c-fg-muted); }
.field input { font:inherit; color:var(--c-fg); background:var(--c-bg-subtle); border:1px solid var(--c-border); border-radius:0.375rem; padding:0.375rem 0.625rem; color-scheme:dark; }
.field input:hover { border-color:var(--c-accent); }
.field input:focus-visible { outline:2px solid var(--c-accent); outline-offset:1px; }
`,
    ),
  },

  "intersection-observer": {
    height: 240,
    html: wrapDemo(
      `
<div>
  <div class="scroller demo-scroll">
    <div class="spacer-top">Scroll down &darr;</div>
    <div id="target" class="target">Target element</div>
    <div class="spacer-bottom"></div>
  </div>
  <p class="demo-hint" id="status" style="margin-top:0.5rem;">visible: no</p>
</div>
<script>
  const target = document.getElementById("target");
  const status = document.getElementById("status");
  const scroller = target.closest(".scroller");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      status.textContent = "visible: " + (entry.isIntersecting ? "yes" : "no");
      target.classList.toggle("in-view", entry.isIntersecting);
    }
  }, { root: scroller, threshold: 0.5 });
  observer.observe(target);
</script>
`,
      `
.scroller { width:240px; height:160px; }
.spacer-top { height:210px; display:flex; align-items:center; justify-content:center; color:var(--c-fg-faint); font-size:0.8125rem; }
.spacer-bottom { height:140px; }
.target { margin:0 1rem; padding:1rem; text-align:center; border-radius:0.5rem; background:var(--c-bg-subtle); border:1px solid var(--c-border); font-size:0.8125rem; transition: background 0.2s, border-color 0.2s, color 0.2s; }
.target.in-view { background:var(--c-accent); color:var(--c-bg); border-color:var(--c-accent); }
`,
    ),
  },

  "page-visibility": {
    height: 160,
    html: wrapDemo(
      `
<div style="text-align:center;">
  <p class="demo-hint" style="margin-bottom:0.75rem;">Switch to another tab, then come back.</p>
  <div id="state" class="state">visible</div>
</div>
<script>
  const state = document.getElementById("state");
  function render() {
    state.textContent = document.visibilityState;
    state.classList.toggle("hidden-state", document.visibilityState === "hidden");
  }
  document.addEventListener("visibilitychange", render);
  render();
</script>
`,
      `
.state { display:inline-block; padding:0.5rem 1rem; border-radius:0.375rem; background:var(--c-accent); color:var(--c-bg); font-family:var(--font-mono, monospace); font-size:0.875rem; font-weight:600; }
.state.hidden-state { background:var(--c-bg-subtle); color:var(--c-fg-muted); border:1px solid var(--c-border); }
`,
    ),
  },

  "speech-synthesis": {
    height: 140,
    html: wrapDemo(
      `
<div style="text-align:center;">
  <button id="speak">Speak</button>
  <p class="demo-hint" id="status" style="margin-top:0.75rem;">idle</p>
</div>
<script>
  const status = document.getElementById("status");
  document.getElementById("speak").addEventListener("click", () => {
    if (typeof speechSynthesis === "undefined") {
      status.textContent = "not available here";
      return;
    }
    const utterance = new SpeechSynthesisUtterance("The browser can read this aloud.");
    utterance.onstart = () => { status.textContent = "speaking..."; };
    utterance.onend = () => { status.textContent = "idle"; };
    utterance.onerror = (e) => { status.textContent = "blocked: " + e.error; };
    speechSynthesis.speak(utterance);
  });
</script>
`,
    ),
  },

  clipboard: {
    height: 150,
    html: wrapDemo(`
<div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem;">
  <code class="demo-hint" style="font-size:0.9375rem; color:var(--c-fg);">const text = "npm uninstall clipboard-copy";</code>
  <button id="copy">Copy</button>
</div>
<script>
  const btn = document.getElementById("copy");
  const original = btn.textContent;
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("npm uninstall clipboard-copy");
      btn.textContent = "Copied";
    } catch (e) {
      btn.textContent = "Couldn't copy";
    }
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
</script>
`),
  },

  fullscreen: {
    height: 220,
    allow: "fullscreen",
    extraSandbox: "allow-fullscreen",
    html: wrapDemo(
      `
<div>
  <div id="stage" class="stage">Preview</div>
  <button id="toggle" style="margin-top:0.75rem;">Fullscreen</button>
  <p class="demo-hint" style="margin-top:0.5rem;">Fills this frame, not your whole screen. A nested demo can't take over the real display.</p>
</div>
<script>
  const stage = document.getElementById("stage");
  const btn = document.getElementById("toggle");
  btn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await stage.requestFullscreen();
        btn.textContent = "Exit fullscreen";
      } else {
        await document.exitFullscreen();
        btn.textContent = "Fullscreen";
      }
    } catch (e) {
      btn.textContent = "Not available here";
    }
  });
</script>
`,
      `
.stage { width:220px; height:90px; border-radius:0.5rem; display:flex; align-items:center; justify-content:center; background:var(--c-accent); color:var(--c-bg); font-weight:600; }
.stage:fullscreen { width:100%; height:100%; border-radius:0; }
`,
    ),
  },

  "screen-wake-lock": {
    height: 160,
    allow: "screen-wake-lock",
    html: wrapDemo(`
<div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem;">
  <button id="toggle">Request lock</button>
  <p id="status" class="demo-hint">Screen can sleep normally</p>
</div>
<script>
  let lock = null;
  const btn = document.getElementById("toggle");
  const status = document.getElementById("status");
  btn.addEventListener("click", async () => {
    if (lock) { await lock.release(); return; }
    try {
      lock = await navigator.wakeLock.request("screen");
      status.textContent = "Locked: this tab won't let the screen sleep";
      btn.textContent = "Release lock";
      lock.addEventListener("release", () => {
        status.textContent = "Screen can sleep normally";
        btn.textContent = "Request lock";
        lock = null;
      });
    } catch (e) {
      status.textContent = "Not available in this embed";
    }
  });
</script>
`),
  },

  "web-share": {
    height: 280,
    html: wrapDemo(
      `
<div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem;">
  <button disabled>Share</button>
  <p class="demo-hint" style="max-width:220px; text-align:center;">Calls the OS's real share sheet. Rendering it here would just pop a native dialog over this page, so this mocks what the visitor sees.</p>
  <div class="sheet">
    <div class="sheet-row">Messages</div>
    <div class="sheet-row">Mail</div>
    <div class="sheet-row">Copy Link</div>
  </div>
</div>
`,
      `
.sheet { width:200px; border:1px solid var(--c-border); border-radius:0.5rem; overflow:hidden; }
.sheet-row { padding:0.5rem 0.75rem; font-size:0.8125rem; border-bottom:1px solid var(--c-border); }
.sheet-row:last-child { border-bottom:none; }
`,
    ),
  },

  "web-bluetooth": {
    height: 280,
    html: wrapDemo(
      `
<div style="width:260px;">
  <p class="demo-hint" style="margin-bottom:0.5rem;">Illustrative: the OS device chooser navigator.bluetooth.requestDevice() opens</p>
  <div class="chooser">
    <div class="chooser-title">Select a Bluetooth device</div>
    <div class="chooser-row">Heart Rate Monitor</div>
    <div class="chooser-row">Smart Scale 2</div>
    <div class="chooser-row">ESP32-BLE</div>
  </div>
  <p class="demo-hint" style="margin-top:0.75rem;">Real, from your browser: "bluetooth" in navigator is <span id="has-bt">checking</span></p>
</div>
<script>
  document.getElementById("has-bt").textContent = "bluetooth" in navigator ? "true" : "false";
</script>
`,
      `
.chooser { border:1px solid var(--c-border); border-radius:0.5rem; background:var(--c-bg-subtle); overflow:hidden; }
.chooser-title { padding:0.625rem 0.875rem; font-size:0.8125rem; font-weight:600; border-bottom:1px solid var(--c-border); }
.chooser-row { padding:0.625rem 0.875rem; font-size:0.8125rem; color:var(--c-fg-muted); border-bottom:1px solid var(--c-border); }
.chooser-row:last-child { border-bottom:none; }
#has-bt { color:var(--c-accent); font-family:var(--font-mono, monospace); }
`,
    ),
  },

  "speech-recognition": {
    height: 180,
    html: wrapDemo(
      `
<div style="width:240px; text-align:center;">
  <div class="mic">
    <div class="bars"><span></span><span></span><span></span><span></span><span></span></div>
  </div>
  <p class="demo-hint" style="margin-top:0.75rem;">Illustrative waveform. A live transcript needs mic access this embed can't request.</p>
  <p class="demo-hint" style="margin-top:0.5rem;">Real, from your browser: SpeechRecognition is <span id="has-sr">checking</span></p>
</div>
<script>
  document.getElementById("has-sr").textContent =
    (window.SpeechRecognition || window.webkitSpeechRecognition) ? "available" : "not available";
</script>
`,
      `
.mic { display:flex; align-items:center; justify-content:center; height:56px; }
.bars { display:flex; align-items:center; gap:4px; }
.bars span { display:block; width:5px; border-radius:3px; background:var(--c-accent); animation: wave 1.2s ease-in-out infinite; }
.bars span:nth-child(1) { height:14px; animation-delay:0s; }
.bars span:nth-child(2) { height:28px; animation-delay:0.1s; }
.bars span:nth-child(3) { height:40px; animation-delay:0.2s; }
.bars span:nth-child(4) { height:24px; animation-delay:0.3s; }
.bars span:nth-child(5) { height:16px; animation-delay:0.4s; }
#has-sr { color:var(--c-accent); font-family:var(--font-mono, monospace); }
@keyframes wave { 0%, 100% { transform:scaleY(0.4); } 50% { transform:scaleY(1); } }
`,
    ),
  },
};
