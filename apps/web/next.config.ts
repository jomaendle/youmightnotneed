import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The catalog is a workspace package shipped as TypeScript source plus a
  // build. Transpiling it here keeps `next dev` working without a build step.
  transpilePackages: ["@jomae/catalog"],
  experimental: {
    typedRoutes: true,
  },
  // Advertises the machine-readable surfaces on the home page response, so an
  // agent that only fetched / does not have to guess /llms.txt.
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: [
              '</llms.txt>; rel="alternate"; type="text/markdown"',
              '</llms-full.txt>; rel="alternate"; type="text/markdown"',
              '</openapi.json>; rel="service-desc"; type="application/json"',
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
