import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The catalog is a workspace package shipped as TypeScript source plus a
  // build. Transpiling it here keeps `next dev` working without a build step.
  transpilePackages: ["@youmightnotneed/catalog"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
