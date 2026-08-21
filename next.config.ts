import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/crm/:path*',
        destination: 'http://localhost:3001/api/crm/:path*'
      },
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3001/api/v1/:path*'
      }
    ];
  }
};

export default nextConfig;
