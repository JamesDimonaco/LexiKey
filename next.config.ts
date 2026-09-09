import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // babel-plugin-react-compiler is installed; this switches it on.
  // Auto-memoizes components so per-keystroke re-renders skip unchanged
  // subtrees (session header, non-current words) — key for input latency.
  reactCompiler: true,
  async headers() {
    return [
      {
        // public/ is served must-revalidate by default, so every play of every
        // word costs a conditional request before audio starts — on exactly the
        // connections where that hurts. These files only change when the word
        // pool is regenerated, and a regenerated word keeps its filename, so a
        // browser holding one will not pick up a re-recording until the cache
        // expires. Worth it; regeneration is rare and the pronunciation of
        // "cat" does not change.
        source: '/audio/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
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
