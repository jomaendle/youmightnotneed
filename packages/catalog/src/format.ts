/**
 * Shared presentation helpers.
 *
 * These live in the catalog so the CLI, the website and any future surface
 * phrase a finding the same way. The phrasing is deliberate: a dependency in
 * package.json is not proof of what it is used for, so sizes are always "up
 * to" and a rule always reads as a conditional.
 */

/** 20076 becomes "20.1 kB". Uses kB, base 1000, the way npm and bundlers do. */
export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  const kb = bytes / 1000;
  if (kb < 100) return `${kb.toFixed(1)} kB`;
  return `${Math.round(kb)} kB`;
}

/** The honest headline. It hedges, and never promises a saving. */
export function formatHeadline(bytes: number, packageCount: number): string {
  if (packageCount === 0) return "Nothing here the platform covers yet";
  const deps = packageCount === 1 ? "dependency" : "dependencies";
  if (bytes === 0) {
    return `${packageCount} ${deps} may have a native equivalent`;
  }
  return `Up to ${formatBytes(bytes)} across ${packageCount} ${deps}`;
}

/**
 * Phrases a finding as a condition rather than an instruction. "If you're
 * using swiper for X, then Y covers that case."
 */
export function formatConditional(
  packageNames: readonly string[],
  when: string,
  native: string,
): string {
  const list = formatList(packageNames);
  return `If you're using ${list} for ${when}, ${native} covers that case.`;
}

/** ["a", "b", "c"] becomes "a, b and c". */
export function formatList(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] as string;
  const head = items.slice(0, -1).join(", ");
  return `${head} and ${items.at(-1)}`;
}
