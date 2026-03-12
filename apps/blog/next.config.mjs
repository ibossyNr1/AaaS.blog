/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  transpilePackages: ["@aaas/ui"],
  eslint: {
    ignoreDuringBuilds: false,
  },
  exclude: ["src/agents/**"],
};

export default nextConfig;
