import type { Rule } from "../schema.ts";

export const compressionStreams: Rule = {
  id: "compression-streams",
  title: "Gzip and deflate in the browser",
  replaces: ["pako", "lz-string"],
  featureIds: ["compression-streams"],
  native: "CompressionStream and DecompressionStream",
  human: {
    explainer:
      "pako ships a JavaScript port of zlib, and lz-string implements its own compression scheme, both to compress data before an upload or a localStorage write. CompressionStream and DecompressionStream do the same job as a platform-native stream: pipe bytes in, get gzip or deflate bytes out, with no compression library in the bundle.",
    snippet: `const compressed = new Response(
  new Blob([data]).stream().pipeThrough(new CompressionStream("gzip")),
);
const bytes = await compressed.arrayBuffer();`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream",
  },
  agent: {
    when: "compressing or decompressing bytes with gzip or deflate before sending or storing them",
    unless: [
      "You need brotli. Only the newest browser versions expose it, so a library is still the safer choice for that format today.",
      "You need lz-string's specific format, such as its base64 or UTF-16 encodings meant for squeezing compressed data into localStorage or a URL. CompressionStream only speaks gzip, deflate, and raw deflate.",
      "You need synchronous compression of a small string with no stream setup. CompressionStream is stream-based, so a few lines of glue code are still required at the call site.",
    ],
    snippet:
      'new Blob([data]).stream().pipeThrough(new CompressionStream("gzip"));',
  },
};
