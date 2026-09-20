/**
 * Alias of /.well-known/ard.json, the same handler. See that file.
 *
 * Re-exported rather than written twice, and `dynamic` is declared here
 * because Next reads route segment config statically and does not follow
 * re-exports.
 */
export { GET } from "../ard.json/route";

export const dynamic = "force-static";
