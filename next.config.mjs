/** @type {import('next').NextConfig} */
const nextConfig = {
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


