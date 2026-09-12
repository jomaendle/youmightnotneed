"use client";

import { useState } from "react";

/**
 * Copies a block of text, and says so.
 *
 * Same navigator.clipboard.writeText() as share-report.tsx, which is a rule
 * this site tells other people they might not need a library for. The failure
 * path matters: writeText() rejects when the document is not focused or the
 * permission is denied, and a button that silently does nothing is worse than
 * one that admits it. So the fallback reveals the text to select by hand.
 */
export function CopyPrompt({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [result, setResult] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setResult("copied");
    } catch {
      setResult("failed");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={copy}
          className="cursor-pointer rounded-md border border-border bg-bg-subtle px-3 py-1.5 text-compact transition-colors hover:border-fg-faint"
        >
          {label}
        </button>
        <span aria-live="polite" className="text-fg-faint text-metadata">
          {result === "copied" ? copiedLabel : ""}
          {result === "failed" ? "Copy it from below instead" : ""}
        </span>
      </div>

      {result === "failed" ? (
        <pre className="max-w-[62ch] overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-bg-subtle p-3 font-mono text-metadata">
          {text}
        </pre>
      ) : null}
    </div>
  );
}
