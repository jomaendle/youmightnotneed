"use client";

import { useEffect } from "react";
import { scan } from "@/app/actions";
import { findModelContext, registerWebMcpTools } from "@/lib/webmcp";

/**
 * Registers the site's tools with a browser that supports WebMCP, and does
 * nothing anywhere else. Renders nothing. See lib/webmcp.ts.
 *
 * The scan tool calls the same server action the paste form uses, rather than
 * a new endpoint, so the two cannot disagree about what a package.json means.
 */
export function WebMcpTools() {
  useEffect(() => {
    const context = findModelContext(document, navigator);
    if (!context) return;

    const controller = new AbortController();
    registerWebMcpTools(context, controller.signal, {
      fetchRule: (id) => fetch(`/rules/${encodeURIComponent(id)}.md`),
      scan: (input) => {
        const form = new FormData();
        form.set("input", input);
        return scan({}, form);
      },
    });
    return () => controller.abort();
  }, []);

  return null;
}
