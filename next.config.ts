import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // babel-plugin-react-compiler is installed; this switches it on.
  // Auto-memoizes components so per-keystroke re-renders skip unchanged
  // subtrees (session header, non-current words) — key for input latency.
  reactCompiler: true,
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
