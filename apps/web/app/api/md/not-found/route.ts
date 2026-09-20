import { MARKDOWN_HEADERS, markdown404 } from "@/lib/markdown-404";

/**
 * Where proxy.ts rewrites an unknown path when the client asked for markdown.
 * Not linked from anywhere: a direct GET gets the same answer.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(markdown404("There is no page at that path."), {
    status: 404,
    headers: MARKDOWN_HEADERS,
  });
}
