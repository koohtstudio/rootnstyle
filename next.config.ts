import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Put the CSS in the HTML so the first paint does not wait on stylesheet requests.
  experimental: { inlineCss: true },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70, 75],
    // Images come from /public only. No remote hosts, no hotlinking.
  },
};

export default config;
