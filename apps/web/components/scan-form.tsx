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

/**
 * The textarea uses field-sizing: content, so it grows as you paste instead of
 * needing a measuring library. min-block-size and max-block-size in
 * globals.css keep it between a sensible floor and ceiling.
 *
 * The hint under the button is shown and hidden by :has() reading the
 * textarea's :placeholder-shown state. No React state for it.
 */
export function ScanForm() {
  const [state, formAction, pending] = useActionState<ScanState, FormData>(
    scan,
    {},
  );
  /*
   * Controlled on purpose. React resets an uncontrolled field once a form
   * action completes, so returning an error from scan() would throw away
   * whatever the user had pasted or typed.
   */
  const [pasted, setPasted] = useState("");
  const [repo, setRepo] = useState("");

  return (
    <form action={formAction} className="scan-form space-y-3">
      <label htmlFor="packageJson" className="sr-only">
        Your package.json
      </label>
      <textarea
        id="packageJson"
        name="packageJson"
        spellCheck={false}
        value={pasted}
        onChange={(event) => setPasted(event.target.value)}
        placeholder={EXAMPLE}
        className="paste-area w-full rounded-lg border border-border bg-bg-subtle px-4 py-3.5 font-mono text-compact outline-none placeholder:text-fg-faint/55 focus-visible:border-fg-faint"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-fg px-4 py-2 font-medium text-bg text-compact transition-opacity hover:opacity-90 disabled:opacity-55"
        >
          {pending ? "Checking" : "Check dependencies"}
        </button>
        <span className="submit-hint text-fg-faint text-metadata transition-opacity duration-200">
          Or paste over the example above
        </span>
      </div>

      {state.error === undefined ? null : (
        <p
          role="alert"
          className="tier-limited text-[color:var(--tier)] text-metadata"
        >
          {state.error}
        </p>
      )}

      <RepoField value={repo} onChange={setRepo} />
    </form>
  );
}

/** A public repo URL as the alternative input. Read without signing in. */
function RepoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <details className="disclosure hairline pt-4">
      <summary className="text-fg-muted text-metadata">
        Use a public repository instead
      </summary>
      <div className="pt-3">
        <label
          htmlFor="repo"
          className="mb-1.5 block text-fg-muted text-metadata"
        >
          Owner and repository, or a github.com URL
        </label>
        <input
          id="repo"
          name="repo"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="vercel/next.js"
          className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2 font-mono text-compact outline-none placeholder:text-fg-faint/55 focus-visible:border-fg-faint"
        />
        <p className="mt-1.5 text-fg-faint text-metadata">
          Read unauthenticated, so GitHub rate limits it. Paste the file if it
          fails.
        </p>
      </div>
    </details>
  );
}
