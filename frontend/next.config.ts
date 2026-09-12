import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: [
    "samvad.qixolabs.com",
    "samvad-api.qixolabs.com",
    "*.qixolabs.com",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
