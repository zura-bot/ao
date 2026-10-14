import type { NextConfig } from 'next';

// ============================================================
// SECURITY HEADERS
// ============================================================
const isProd = process.env.NODE_ENV === 'production';

// CSP — mode permissive buat development, perketat nanti di production
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tambah Google Fonts (buat Mulish / font external)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  // Font file Google (fonts.gstatic.com) + data
  "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
  "connect-src 'self' https://komiku.online ws: wss: https://fonts.googleapis.com https://fonts.gstatic.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // HSTS — cuma di production (butuh HTTPS)
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ]
    : []),
];

// ============================================================
// NEXT CONFIG
// ============================================================
const nextConfig: NextConfig = {
  // Sembunyiin "X-Powered-By: Next.js"
  poweredByHeader: false,

  // Compress response (gzip)
  compress: true,

  // React strict mode (development)
  reactStrictMode: false,

  // Header rules
  async headers() {
    return [
      {
        // Semua route
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // API image-proxy: cache di CDN/browser
        source: '/api/image-proxy',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;