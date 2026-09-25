import type { NextConfig } from 'next';

// Backend the dev/prod server proxies /api and /media to, so the browser only ever
// talks to this origin (works from a phone on the LAN/Tailscale without CORS setup).
if (process.env.VERCEL && !/^https:\/\/(?!localhost|127\.)/.test(process.env.API_URL || '')) {
  throw new Error('API_URL must be set on Vercel to the deployed BeingHuman-BE URL, e.g. https://beinghuman-be.vercel.app');
}
const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hosts other than localhost allowed to load dev resources (HMR), e.g. a phone on the network.
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
      { source: '/media/:path*', destination: `${API_URL}/media/:path*` },
    ];
  },
};

export default nextConfig;
