import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set Turbopack root to avoid incorrect workspace root detection
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
