import type { Rule } from "../schema.ts";

export const jquery: Rule = {
  id: "jquery",
  title: "jQuery",
  category: "async-data",
  replaces: ["jquery"],
  featureIds: ["dom", "events", "web-animations"],
  native: "querySelectorAll(), classList and addEventListener()",
  human: {
    explainer:
      "jQuery smoothed over a decade of disagreement between browsers about selectors, events, animation and XMLHttpRequest. Each of those became one standard method that works everywhere: querySelectorAll for finding, classList for classes, closest for walking up, addEventListener for events, animate for motion and fetch for requests. What is left of the library is the chaining syntax and the plugin ecosystem built on top of it.",
    snippet: `// $(".item").addClass("on") becomes:
for (const el of document.querySelectorAll(".item")) {
  el.classList.add("on");
}

// $(el).closest("form") becomes:
el.closest("form");

// $(el).fadeIn() becomes:
el.animate({ opacity: [0, 1] }, { duration: 200, fill: "forwards" });`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll",
  },
  agent: {
    when: "jQuery is used for selectors, class and attribute changes, events or simple animation",
    unless: [
      "Plugins are installed that require the global. Bootstrap 4, Select2, slick and DataTables all expect $ to exist, so the library stays until each of those goes, and that is usually the whole job rather than a step in it.",
      "You depend on $.ajax behaviour with no fetch equivalent, JSONP most of all. fetch cannot do JSONP at all, and upload progress still needs XMLHttpRequest.",
      "Event delegation and namespacing are used heavily. Delegation is a target.closest check inside one listener, which is fine once and tedious across a large codebase, and namespaced off() has no direct counterpart.",
      "jQuery is loaded from a CDN that is already cached, or it arrives through a server-rendered template you do not control. Removing the import does not remove the request in either case.",
      "The codebase leans on jQuery's quirks, such as its own event object, its data() store, or :visible and other selectors that are not valid CSS and that querySelectorAll will reject.",
    ],
    snippet:
      'for (const el of document.querySelectorAll(".item")) el.classList.add("on");',
    handRolled: [
      "a $ or qs helper wrapping querySelectorAll to get chaining back after the library was removed",
    ],
  },
};
