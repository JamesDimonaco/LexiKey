import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Redirect old /practice URL to home (Google has this indexed but page doesn't exist)
      {
        source: '/practice',
        destination: '/',
        permanent: true, // 308 redirect - tells Google to update its index
      },
    ];
  },
};

export default nextConfig;
