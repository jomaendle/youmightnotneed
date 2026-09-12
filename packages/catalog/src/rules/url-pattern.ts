import type { Rule } from "../schema.ts";

export const urlPattern: Rule = {
  id: "urlpattern",
  title: "Matching URL patterns",
  category: "async-data",
  replaces: ["path-to-regexp", "url-pattern", "route-parser"],
  featureIds: ["urlpattern"],
  native: "URLPattern",
  human: {
    explainer:
      'These libraries compile a route string such as "/users/:id" into a regular expression and hand back the named groups when it matches. URLPattern is that same idea built in, with one extra: it matches every part of a URL, so protocol, hostname and search can take part in the pattern rather than only the path. A match returns an object keyed by URL part, each with its own groups.',
    snippet: `const pattern = new URLPattern({ pathname: "/users/:id/posts/:postId" });

pattern.test("https://example.com/users/42/posts/7"); // true

const match = pattern.exec("https://example.com/users/42/posts/7");
match.pathname.groups; // { id: "42", postId: "7" }

// Other parts of the URL can take part too.
new URLPattern({ hostname: ":tenant.example.com" })
  .exec("https://acme.example.com/")
  .hostname.groups; // { tenant: "acme" }`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/URLPattern",
  },
  agent: {
    when: "matching a URL against a route pattern and reading the named parameters",
    unless: [
      'You build URLs from the pattern as well as matching them. path-to-regexp\'s compile() turns "/users/:id" plus params back into a path, and URLPattern only goes in the matching direction.',
      "You are replacing the matcher inside a router you do not control. Express and React Router depend on path-to-regexp directly, so it stays in the tree regardless of what your own code uses.",
      "Your routes rely on path-to-regexp syntax that does not carry over, such as its custom match patterns or its handling of unnamed groups. The two syntaxes are close enough to look interchangeable and different enough to break quietly.",
      "The code runs on a server runtime that has no URLPattern global, which is the case for Node before it shipped one.",
      "You support browsers below Chrome {{chrome:urlpattern}}, Firefox {{firefox:urlpattern}} or Safari {{safari:urlpattern}}.",
    ],
    snippet: `const pattern = new URLPattern({ pathname: "/users/:id" });
const match = pattern.exec(url);
const id = match?.pathname.groups.id;`,
  },
};
