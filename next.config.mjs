/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: '.',
  },
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
};

export default nextConfig;
