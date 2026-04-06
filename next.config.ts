import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-d0c9af62-4571-498c-acef-aeae6b6ec103.space.z.ai",
    ".space.z.ai",
  ],
};

export default nextConfig;
