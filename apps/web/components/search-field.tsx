/**
 * The catalog search box.
 *
 * A plain GET form. Submitting it navigates to /search?q=, which renders on
 * the server, so this ships no JavaScript and the results have a URL you can
 * share. type="search" is what gives the field its clear button and its own
 * history, none of which is worth reimplementing. The <search> element around
 * it is the landmark, so no role attribute is needed either.
 *
 * The header copy of this field cannot be filled in with the current query:
 * a layout in the App Router is not given searchParams. That is why the
 * search page renders its own copy underneath its heading.
 *
 * Autocomplete comes from a <datalist> of every package name the catalog
 * covers. See components/package-datalist.tsx.
 */
import { DATALIST_ID } from "@/lib/packages";

export function SearchField({
  variant,
  defaultValue,
}: {
  variant: "header" | "page";
  defaultValue?: string;
}) {
  const id = `search-${variant}`;
  const onPage = variant === "page";

  return (
    <search
      className={onPage ? "max-w-[28rem]" : "hidden min-w-0 flex-1 sm:block"}
    >
      <form action="/search" method="get">
        <label htmlFor={id} className="sr-only">
          Search the catalog by package name
        </label>
        <input
          type="search"
          id={id}
          name="q"
          // The option list itself is rendered once, in the layout.
          list={DATALIST_ID}
          defaultValue={defaultValue}
          placeholder="swiper, uuid, axios"
          spellCheck={false}
          className={`block w-full rounded-md border border-border bg-bg-subtle font-mono outline-none placeholder:text-fg-faint/55 focus-visible:border-fg-faint ${
            onPage
              ? "px-3.5 py-2.5 text-compact"
              : "mx-auto max-w-[18rem] px-3 py-1.5 text-metadata"
          }`}
        />
      </form>
    </search>
  );
}
