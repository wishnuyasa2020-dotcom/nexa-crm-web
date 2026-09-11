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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' * data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com https://*.midtrans.com https://api.midtrans.com",
              "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com https://*.midtrans.com",
              "frame-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com https://*.midtrans.com",
              "connect-src 'self' * https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com https://nexa-os-pmr8.onrender.com",
              "img-src 'self' data: blob: https: http:",
              "style-src 'self' 'unsafe-inline' https: http:",
              "font-src 'self' data: https: http:",
            ].join('; '),
          },
        ],
      },
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
