/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    instrumentationHook: true,
  },
};

export default nextConfig;
