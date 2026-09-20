"use client";

import { useEffect } from "react";
import { scan } from "@/app/actions";

/**
 * Registers the site's tools with a browser that supports WebMCP, and does
 * nothing anywhere else. Renders nothing. See lib/webmcp.ts.
 *
 * The check for the API is inline and the registration code is imported only
 * once it passes, so a browser without WebMCP, which is nearly all of them,
 * never downloads it.
 *
 * The scan tool calls the same server action the paste form uses, rather than
 * a new endpoint, so the two cannot disagree about what a package.json means.
 */
export function WebMcpTools() {
  useEffect(() => {
    if (!("modelContext" in document || "modelContext" in navigator)) return;

    const controller = new AbortController();
    import("@/lib/webmcp")
      .then(({ findModelContext, registerWebMcpTools }) => {
        const context = findModelContext(document, navigator);
        if (!context || controller.signal.aborted) return;

        registerWebMcpTools(context, controller.signal, {
          fetchRule: (id) => fetch(`/rules/${encodeURIComponent(id)}.md`),
          scan: (input) => {
            const form = new FormData();
            form.set("input", input);
            return scan({}, form);
          },
        });
      })
      .catch((error: unknown) => {
        // A failed chunk load must not surface as an unhandled rejection.
        console.warn("[webmcp] could not load the tools:", error);
      });
    return () => controller.abort();
  }, []);

  return null;
}
