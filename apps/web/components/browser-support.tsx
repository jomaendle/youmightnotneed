import { TRACKED_BROWSERS, type TrackedBrowser } from "@jomae/catalog";
import Image from "next/image";
import { BROWSER_ICONS } from "./browser-icons";

/**
 * The minimum version row: one chip per tracked browser, the version it
 * needs or a dash when there's no support data (commonly: never shipped
 * there). Unsupported browsers are visually muted rather than hidden, so the
 * gap itself is the information.
 */
export function BrowserSupport({
  support,
}: {
  support: Record<TrackedBrowser, string | null>;
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Minimum browser versions">
      {TRACKED_BROWSERS.map((browser) => {
        const version = support[browser];
        const { src, label } = BROWSER_ICONS[browser];
        return (
          <li
            key={browser}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-compact ${
              version === null
                ? "border-border text-fg-faint"
                : "border-border bg-bg-subtle text-fg"
            }`}
          >
            <Image
              src={src}
              alt=""
              width={20}
              height={20}
              className={version === null ? "opacity-30 grayscale" : ""}
              unoptimized={true}
            />
            <span className="sr-only">{label}</span>
            <span className="font-mono tabular-nums">{version ?? "-"}</span>
          </li>
        );
      })}
    </ul>
  );
}
