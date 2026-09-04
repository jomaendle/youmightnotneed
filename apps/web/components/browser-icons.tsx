import type { TrackedBrowser } from "@jomae/catalog";

/**
 * Official browser marks, self-hosted under public/browsers. Chrome, Firefox,
 * and Edge are traced from each vendor's current brand SVG (sourced via
 * Wikimedia Commons, which mirrors the official assets); Safari uses the
 * widely-used simple-icons trace in Apple's brand blue, since Apple's current
 * "Liquid Glass" icon is only published as a raster image. Self-hosted, not
 * fetched at request time.
 */
export const BROWSER_ICONS: Record<
  TrackedBrowser,
  { src: string; label: string }
> = {
  chrome: { src: "/browsers/chrome.svg", label: "Chrome" },
  edge: { src: "/browsers/edge.svg", label: "Edge" },
  firefox: { src: "/browsers/firefox.svg", label: "Firefox" },
  safari: { src: "/browsers/safari.svg", label: "Safari" },
};
