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
      "document.cookie is a single string holding every cookie for the origin, so reading one means splitting and decoding, and writing one means formatting attributes by hand. That parsing is what js-cookie is. The Cookie Store API gives get and set as promises over real objects, plus a change event, and it works off the main document string entirely. Only Chromium ships it so far.",
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
      "You ship to Firefox or Safari, which is most projects. Only Chromium has this, from Chrome {{chrome:cookie-store}}, so a library or a document.cookie fallback is still doing the work everywhere else.",
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
