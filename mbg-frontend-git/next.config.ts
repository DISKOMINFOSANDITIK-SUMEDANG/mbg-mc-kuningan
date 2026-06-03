import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next/dev" : ".next/build",
  typescript: {
    // Skip type checking during production builds for speed
    // Type errors will still show in IDE and dev mode
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // S3 storage
      {
        protocol: 'https',
        hostname: 's3.sumedangkab.go.id',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
