/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set Turbopack root to avoid incorrect workspace root detection
  turbopack: {
    root: __dirname,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
