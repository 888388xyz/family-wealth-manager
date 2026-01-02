import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone", // For Docker deployment
  // Using webpack config for Windows compatibility (Turbopack has issues with Windows paths)
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'drizzle-orm/neon-http': path.join(process.cwd(), 'node_modules/drizzle-orm/neon-http'),
    };
    return config;
  },
};

export default nextConfig;

