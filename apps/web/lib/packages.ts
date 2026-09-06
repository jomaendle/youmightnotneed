import { type Rule, rulesByPackage } from "@jomae/catalog";

/**
 * The flat list of package names the catalog covers.
 *
 * The rules are keyed by the native feature, so a rule is titled "Carousels"
 * and never "swiper". That leaves most of the names people actually type
 * addressable nowhere: /rules shows 56 titles, and the catalog covers four
 * times as many packages. This is the list that fixes it, read by /packages
 * and by the autocomplete on the search field.
 */

/** Shared between the <datalist> and the inputs that reference it. */
export const DATALIST_ID = "catalog-packages";

export interface PackageEntry {
  name: string;
  rule: Rule;
}

export interface PackageGroup {
  /** A single uppercase letter, or "#" for anything that starts with a digit. */
  letter: string;
  entries: readonly PackageEntry[];
}

/**
 * Scoped names sort and group under their scope's first letter rather than
 * collecting under "@", where a quarter of the list would end up in one pile
 * nobody thinks to look in. Someone looking for @floating-ui/react looks
 * under F.
 */
function sortKey(name: string): string {
  return name.startsWith("@") ? name.slice(1) : name;
}

function initial(name: string): string {
  const first = sortKey(name).charAt(0).toUpperCase();
  return first >= "A" && first <= "Z" ? first : "#";
}

/** Every package the catalog covers, with the rule that claims it. */
export const ALL_PACKAGES: readonly PackageEntry[] = [...rulesByPackage]
  .map(([name, rule]) => ({ name, rule }))
  .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)));

/** The same list under its initials, in alphabetical order. */
export function groupByInitial(
  entries: readonly PackageEntry[],
): PackageGroup[] {
  const groups = new Map<string, PackageEntry[]>();

  for (const entry of entries) {
    const letter = initial(entry.name);
    const existing = groups.get(letter);
    if (existing) existing.push(entry);
    else groups.set(letter, [entry]);
  }

  return [...groups]
    .map(([letter, grouped]) => ({ letter, entries: grouped }))
    .sort((a, b) => a.letter.localeCompare(b.letter));
}
