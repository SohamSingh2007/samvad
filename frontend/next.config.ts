import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "samvad.qixolabs.com",
    "samvad-api.qixolabs.com",
    "*.qixolabs.com",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
