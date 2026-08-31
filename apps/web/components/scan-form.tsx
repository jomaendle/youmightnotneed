"use client";

import { useActionState, useState } from "react";
import { type ScanState, scan } from "@/app/actions";

const EXAMPLE = `{
  "dependencies": {
    "swiper": "^11.0.0",
    "@floating-ui/react": "^0.26.0",
    "react-wrap-balancer": "^1.1.1",
    "react-modal": "^3.16.1",
    "polished": "^4.3.1"
  }
}`;

export function ScanForm() {
  const [state, formAction, pending] = useActionState<ScanState, FormData>(
    scan,
    {},
  );
  const [mode, setMode] = useState<"paste" | "repo">("paste");
  const [value, setValue] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div
        className="flex gap-1 rounded-lg border border-border bg-surface p-1"
        role="tablist"
        aria-label="Input method"
      >
        {(["paste", "repo"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={mode === option}
            onClick={() => setMode(option)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === option
                ? "bg-surface-raised text-text"
                : "text-muted hover:text-text"
            }`}
          >
            {option === "paste" ? "Paste package.json" : "Public repo URL"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <div>
          <label htmlFor="packageJson" className="sr-only">
            Your package.json
          </label>
          <textarea
            id="packageJson"
            name="packageJson"
            rows={10}
            spellCheck={false}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={EXAMPLE}
            className="w-full resize-y rounded-lg border border-border bg-surface p-4 font-mono text-sm outline-none placeholder:text-faint/60 focus-visible:border-link"
          />
          <button
            type="button"
            onClick={() => setValue(EXAMPLE)}
            className="mt-1 text-faint text-xs hover:text-link"
          >
            Use an example
          </button>
        </div>
      ) : (
        <div>
          <label htmlFor="repo" className="mb-1.5 block text-muted text-sm">
            A public GitHub repository
          </label>
          <input
            id="repo"
            name="repo"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="github.com/vercel/next.js"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-sm outline-none placeholder:text-faint/60 focus-visible:border-link"
          />
          <p className="mt-1.5 text-faint text-xs">
            Read without signing in, so it is rate limited. Paste the file if it
            fails.
          </p>
        </div>
      )}

      {state.error !== undefined && (
        <p role="alert" className="text-limited text-sm">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-link px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-link-hover disabled:opacity-60"
      >
        {pending ? "Checking..." : "Check my dependencies"}
      </button>

      <p className="text-center text-faint text-xs">
        Runs on the server, stores nothing. The report lives entirely in its
        URL.
      </p>
    </form>
  );
}
