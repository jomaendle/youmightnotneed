"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type ScanState, scan } from "@/app/actions";
import { EXAMPLE_PACKAGE_JSON } from "@/lib/example-scan";

/**
 * One field for both ways in.
 *
 * This used to be two: a textarea for a pasted package.json, and under it a
 * second labelled input for a repository, with its own heading and its own
 * rate-limit caveat. All of that was on screen before anyone had done
 * anything, and it asked the reader to pick a mode first.
 *
 * A package.json always starts with a brace and a repository reference never
 * does, so `scan()` tells them apart and the choice disappears. The caveat
 * moved to where it applies, which is the error the fetch returns.
 *
 * The textarea uses field-sizing: content, so it grows as you paste instead of
 * needing a measuring library. min-block-size and max-block-size in
 * globals.css keep it between a sensible floor and ceiling.
 */
export function ScanForm({ examplePayload }: { examplePayload: string }) {
  const [state, formAction, pending] = useActionState<ScanState, FormData>(
    scan,
    {},
  );
  /*
   * Controlled on purpose. React resets an uncontrolled field once a form
   * action completes, so returning an error from scan() would throw away
   * whatever the user had pasted or typed.
   */
  const [value, setValue] = useState("");

  return (
    <form action={formAction} className="scan-form space-y-3">
      <label htmlFor="input" className="sr-only">
        A package.json, or a public repository
      </label>
      <textarea
        id="input"
        name="input"
        spellCheck={false}
        aria-describedby="input-hint"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={EXAMPLE_PACKAGE_JSON}
        className="paste-area w-full rounded-lg border border-border bg-bg-subtle px-4 py-3.5 font-mono text-compact outline-none placeholder:text-fg-faint/55 focus-visible:border-fg-faint"
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-fg px-4 py-2 font-medium text-bg text-compact transition-opacity hover:opacity-90 disabled:opacity-55"
        >
          {pending ? "Checking" : "Check dependencies"}
        </button>
        <span id="input-hint" className="text-fg-muted text-metadata">
          or a public repo, <code className="font-mono">vercel/next.js</code>
        </span>
        <Link
          // A UrlObject, because typed routes reject a query string spliced
          // into the path.
          href={{ pathname: "/report", query: { d: examplePayload } }}
          className="plain text-fg-faint text-metadata no-underline hover:text-fg hover:underline"
        >
          See an example
        </Link>
      </div>

      {state.error === undefined ? null : (
        <p
          role="alert"
          className="tier-limited text-[color:var(--tier)] text-metadata"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
