import type { Rule } from "../schema.ts";

export const cookieStore: Rule = {
  id: "cookie-store",
  title: "Reading and writing cookies",
  category: "async-data",
  replaces: ["js-cookie", "universal-cookie"],
  featureIds: ["cookie-store"],
  native: "cookieStore",
  human: {
    explainer:
      "document.cookie is a single string holding every cookie for the origin, so reading one means splitting and decoding, and writing one means formatting attributes by hand. That parsing is what js-cookie is. The Cookie Store API gives get and set as promises over real objects, plus a change event, and never touches the document string. Every engine has the page-facing half now, Firefox and Safari only recently; the service worker half is what is still missing.",
    snippet: `await cookieStore.set({
  name: "theme",
  value: "dark",
  // A timestamp in milliseconds, not a formatted date string.
  expires: oneYearFromNow,
  sameSite: "lax",
});

const theme = await cookieStore.get("theme");
theme?.value; // "dark"`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/CookieStore",
  },
  agent: {
    when: "reading or writing cookies from the browser",
    unless: [
      "Your support target reaches below Chrome {{chrome:api.CookieStore}}, Firefox {{firefox:api.CookieStore}} or Safari {{safari:api.CookieStore}}. Chromium has had it for years and the other two arrived recently, so a target of any age still needs the document.cookie fallback the library provides.",
      "You subscribe to cookie changes from a service worker. CookieStoreManager is the half Safari does not have, and it is why this rule reads as limited availability while the page-facing calls work everywhere.",
      "You read a cookie during render or anywhere synchronous. Every cookieStore call returns a promise, so a value that used to be available inline now arrives a tick later.",
      "The same code runs on the server. universal-cookie exists to give one API across request headers and the browser, and cookieStore is browser-only.",
      "You set cookies a script is not allowed to set, or read HttpOnly ones. Neither this nor the library can, but a project reaching for one often ends up doing cookie work on the server instead.",
    ],
    snippet: 'const cookie = await cookieStore.get("theme");',
    handRolled: [
      "a document.cookie split on semicolons with decodeURIComponent, wrapped in a getCookie helper",
      "a template string assigned to document.cookie assembling path, expires and SameSite attributes by hand",
    ],
  },
};
