import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests from preview environment
  allowedDevOrigins: [
    "preview-chat-e249fa85-0271-42bf-bc50-3cae18cc84f1.space.z.ai",
    ".space.z.ai",
  ],
};

export default nextConfig;
