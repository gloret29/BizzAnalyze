/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@bizzanalyze/types', '@bizzanalyze/ui'],
  webpack: (config, { isServer }) => {
    // Résoudre les modules du monorepo
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;









