"use client";

import { useState } from "react";

/**
 * Share the report.
 *
 * The whole report is in its URL, so sharing it is sharing the address. Until
 * now the page said so and left the reader to select the address bar.
 *
 * Two catalog rules do the work, which is the point: navigator.share() on a
 * touch device, where it opens the real share sheet and can reach another
 * app, and navigator.clipboard.writeText() everywhere else. No library, and
 * both are rules this site tells other people they might not need one for.
 *
 * The choice is made on pointer type rather than on whether navigator.share
 * exists. Desktop Chrome has it, and calling it there opens an OS share sheet
 * over the page when all the reader wanted was the link on their clipboard.
 */

type Result = "idle" | "copied" | "failed";

/**
 * Offers the share sheet, and reports whether it handled the share.
 *
 * Gated on pointer type rather than on whether navigator.share exists.
 * Desktop Chrome has it, and calling it there throws an OS sheet over the
 * page when all the reader wanted was the link on their clipboard.
 */
async function offerShareSheet(title: string, url: string): Promise<boolean> {
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (!touch || typeof navigator.share !== "function") return false;

  try {
    await navigator.share({ title, url });
    return true;
  } catch (error) {
    // Cancelling throws AbortError. The reader changed their mind, which is
    // handled, so there is nothing to fall back to and nothing to report.
    return error instanceof Error && error.name === "AbortError";
  }
}

export function ShareReport({ title }: { title: string }) {
  const [result, setResult] = useState<Result>("idle");

  async function share() {
    const url = window.location.href;
    if (await offerShareSheet(title, url)) return;

    try {
      await navigator.clipboard.writeText(url);
      setResult("copied");
    } catch {
      setResult("failed");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={share}
        className="cursor-pointer rounded-md border border-border bg-bg-subtle px-3 py-1.5 text-compact transition-colors hover:border-fg-faint"
      >
        Share this report
      </button>
      <span
        aria-live="polite"
        className="text-fg-faint text-metadata transition-opacity"
      >
        {result === "copied" ? "Link copied" : ""}
        {result === "failed" ? "Copy the address bar instead" : ""}
      </span>
    </div>
  );
}
