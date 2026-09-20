/**
 * Real packages bundlephobia cannot build, each checked by hand. Not typos.
 *
 * Shared by two scripts that would otherwise disagree. `check-freshness.ts`
 * uses it to allow a `replaces` entry with no measurement, and
 * `refresh-sizes.ts` uses it to stop a package that has permanently lost its
 * build from wedging every future refresh: without that, the first time a
 * sized package joins this list, the fall-back guard fires on every run and
 * the snapshot can never be written again.
 */
export const UNSIZEABLE: ReadonlySet<string> = new Set([
  "cordova-plugin-ble-central",
  "react-page-transition",
  // Ships CSS only, with no main entry, so there is no module to bundle.
  "spinkit",
  "sticky-kit",
  "svelte-intersection-observer",
  "svelte-modals",
  "svelte-select",
]);
