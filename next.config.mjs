import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  async redirects() {
    return [
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
