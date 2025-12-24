/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint during builds (fixes circular structure errors)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Development-only configuration
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      serverActions: {
        bodySizeLimit: '2mb',
      },
    },
  }),
};

export default nextConfig;


