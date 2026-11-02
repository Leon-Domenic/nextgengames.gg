/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: '.',
  },
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/game', destination: '/', permanent: false },
      { source: '/guides', destination: '/', permanent: false },
      { source: '/leaderboard', destination: '/', permanent: false },
      { source: '/lore', destination: '/', permanent: false },
      { source: '/maps', destination: '/', permanent: false },
      { source: '/news', destination: '/', permanent: false },
      { source: '/replays', destination: '/', permanent: false },
      { source: '/store', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
