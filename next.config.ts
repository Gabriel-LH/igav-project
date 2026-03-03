import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "imgs.search.brave.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
    ],
  },
};

export default nextConfig;
