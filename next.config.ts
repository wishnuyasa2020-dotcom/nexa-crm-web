import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/crm/:path*',
        destination: 'http://127.0.0.1:3001/api/crm/:path*'
      },
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:3001/api/v1/:path*'
      }
    ];
  },
  allowedDevOrigins: [
    'hrboz-114-5-209-178.free.pinggy.net',
    'pnhps-114-5-209-178.run.pinggy-free.link',
    '*.free.pinggy.net',
    '*.run.pinggy-free.link',
    '*.pinggy.link',
    '*.pinggy.net',
    '*.a.pinggy.io',
    '192.168.53.233'
  ]
};

export default nextConfig;
