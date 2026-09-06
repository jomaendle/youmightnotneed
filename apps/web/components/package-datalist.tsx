import { ALL_PACKAGES, DATALIST_ID } from "@/lib/packages";

/**
 * Native autocomplete for the search field.
 *
 * A <datalist> is the whole of it: the browser does the filtering, the
 * keyboard handling and the popup, so nothing here needs to run on the
 * client. The cost is the option list in the HTML of every page, which is why
 * it is rendered once in the layout and referenced by id from both copies of
 * the field rather than shipped once per input.
 *
 * A browser that does not support datalist ignores the list attribute and
 * leaves a plain text field, which still submits.
 */
export function PackageDatalist() {
  return (
    <datalist id={DATALIST_ID}>
      {ALL_PACKAGES.map((entry) => (
        <option key={entry.name} value={entry.name} />
      ))}
    </datalist>
  );
}
