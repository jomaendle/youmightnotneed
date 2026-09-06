import type { Rule } from "../schema.ts";

export const urlSearchParams: Rule = {
  id: "url-search-params",
  title: "Query string parsing",
  category: "async-data",
  replaces: ["query-string", "qs", "querystringify", "url-parse"],
  featureIds: [],
  manualBaseline: {
    status: "widely",
    verifiedOn: "2026-09-06",
    note: "web-features folds URLSearchParams into the 'url' feature, which reports Chrome {{chrome:url}} and Safari {{safari:url}} because the URL constructor landed first. URLSearchParams itself is Chrome {{chrome:api.URLSearchParams}}, Firefox {{firefox:api.URLSearchParams}} and Safari {{safari:api.URLSearchParams}}. Deriving from 'url' would understate the floor by three Safari majors. Widely available on its own dates since 2017.",
  },
  native: "URLSearchParams and the URL constructor",
  human: {
    explainer:
      "URLSearchParams reads and writes query strings, handles percent-encoding in both directions, and gives you get, getAll, set, append and delete. new URL() does the same job for a whole address, so the hostname, the pathname and the search params come apart without a regular expression. Both have been in every browser since 2016 and in Node since v10, and both are what these libraries call underneath once you strip the option handling.",
    snippet: `const url = new URL("/search?tag=css&tag=html&page=2", location.origin);

url.searchParams.getAll("tag"); // ["css", "html"]
url.searchParams.get("page"); // "2", a string
url.searchParams.set("page", "3");

// Build one from scratch.
new URLSearchParams({ q: "scroll snap", page: "1" }).toString();
// "q=scroll+snap&page=1"`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams",
  },
  agent: {
    when: "reading or building a query string, or pulling a URL apart",
    unless: [
      "You parse nested objects or arrays from bracket syntax such as filter[status][]=open. That is the reason qs exists, and URLSearchParams has no equivalent.",
      "You round-trip typed data through the query string. Every value comes back as a string, so numbers, booleans and null need converting at each read site.",
      "You depend on the library's options: a custom array format, a configurable delimiter, sorted output, or comma-separated values parsed into arrays.",
      "You parse untrusted input on a server and rely on qs's depth and parameterLimit guards against prototype pollution. URLSearchParams applies no limits of its own.",
      "You need Node's legacy querystring semantics, where a repeated key gives an array rather than needing getAll().",
      "Your support target reaches below Chrome {{chrome:api.URLSearchParams}}, Firefox {{firefox:api.URLSearchParams}} or Safari {{safari:api.URLSearchParams}}. The URL constructor arrived earlier than URLSearchParams, so a browser having one is not proof it has the other.",
    ],
    snippet: `const params = new URLSearchParams(location.search);
params.get("page");
params.getAll("tag");
new URLSearchParams({ q: "css" }).toString();`,
  },
};
