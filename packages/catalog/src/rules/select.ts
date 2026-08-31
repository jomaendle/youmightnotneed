import type { Rule } from "../schema.ts";

export const select: Rule = {
  id: "customizable-select",
  title: "Custom select menus",
  replaces: ["react-select", "choices.js", "select2", "tom-select"],
  featureIds: ["customizable-select"],
  native: "appearance: base-select on <select>",
  human: {
    explainer:
      "Opting a select into appearance: base-select makes its picker a normal, styleable part of the page, so options can hold markup: an avatar, a swatch, a second line of muted text. The keyboard behaviour, the accessible role and the mobile picker stay the browser's, which is the part custom select components most often get wrong. This covers presentation. It does not turn a select into a combobox.",
    snippet: `<select>
  <button>
    <selectedcontent></selectedcontent>
  </button>
  <option value="de">
    <span aria-hidden="true">DE</span> Germany
  </option>
  <option value="at">
    <span aria-hidden="true">AT</span> Austria
  </option>
</select>

<style>
  select,
  select::picker(select) {
    appearance: base-select;
  }

  select::picker(select) {
    border-radius: 0.5rem;
    padding: 0.25rem;
  }

  option:checked {
    font-weight: 600;
  }
</style>`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/appearance",
  },
  agent: {
    when: "styling a select's options with markup, such as a flag or a two-line label",
    unless: [
      "You need typeahead filtering, multi-select with tags, or options loaded asynchronously from a search. Those make it a combobox, and a select is the wrong element regardless of styling.",
      "You need creatable options, where the user can add a value that is not in the list.",
      "You need anything beyond Chromium today. Customizable select is limited availability. It degrades to a normal select, which is a safe fallback, but the design will not match.",
      "You need grouped options with sticky group headers while scrolling.",
    ],
    snippet: `<select>
  <button><selectedcontent></selectedcontent></button>
  <option value="a"><span>A</span> Option A</option>
</select>
<style>
  select, select::picker(select) { appearance: base-select; }
</style>`,
  },
};
