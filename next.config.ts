import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70, 75],
    // Images come from /public only. No remote hosts, no hotlinking.
  },
};

export default config;
