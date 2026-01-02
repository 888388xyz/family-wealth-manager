import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // For Docker deployment (Commented out due to Windows pnpm symlink issues)
  serverExternalPackages: ["drizzle-orm"],
};

export default nextConfig;
