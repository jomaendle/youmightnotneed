import { buildArd } from "@/lib/ard";

/**
 * The manifest itself. /.well-known/ai-catalog.json serves the same body: it
 * is the path ARD's predecessor used, and the spec lets a consumer treat both
 * as equivalent.
 *
 * The spec does not name a Content-Type for the manifest, so this serves
 * application/json, which any JSON-reading client already accepts.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildArd(), {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=3600" },
  });
}
