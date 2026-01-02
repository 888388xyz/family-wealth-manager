import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone", // For Docker deployment
  // Empty turbopack config for Vercel production builds (Next.js 16 requirement)
  turbopack: {},
  // Using webpack config for Windows dev compatibility (use: pnpm dev -- --webpack)
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
