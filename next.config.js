/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.hommesestates.com',
        pathname: '/web/image/**',
      },
      {
        protocol: 'https',
        hostname: 'hommesestates.com',
        pathname: '/web/image/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  outputFileTracingRoot: process.cwd(),
  turbopack: {},
  async rewrites() {
    const raw = process.env.NEXT_PUBLIC_ODOO_API_URL || ''
    const trimmed = raw.replace(/\/$/, '')
    const base = trimmed
    const db = process.env.NEXT_PUBLIC_ODOO_DB
    const suffix = db ? `?db=${db}` : ''
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    return [
      // Backend API routes
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
      // Odoo image/content routes (not API - for direct resource access)
      {
        source: '/web/:path*',
        destination: `${base}/web/:path*${suffix}`,
      },
      // Map common favicon requests to our SVG
      {
        source: '/favicon.png',
        destination: '/favicon.svg',
      },
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
