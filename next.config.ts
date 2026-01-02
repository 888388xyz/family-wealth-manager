import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // For Docker deployment
  turbopack: {
    resolveAlias: {
      // Use relative path for cross-platform compatibility
      'drizzle-orm/neon-http': './node_modules/drizzle-orm/neon-http',
    },
  },
};

export default nextConfig;
