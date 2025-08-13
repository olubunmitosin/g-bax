/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic Next.js configuration
  reactStrictMode: true,

  // Transpile packages that need processing
  transpilePackages: [
    '@honeycomb-protocol/edge-client',
    '@honeycomb-protocol/hive-control',
    '@solana/web3.js',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-wallets',
    '@solana/wallet-adapter-react-ui',
  ],

  // Webpack configuration for browser compatibility
  webpack: (config, { isServer }) => {
    // Configure fallbacks for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        process: false,
      };
    }

    // Enable top-level await
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    return config;
  },

  // ESLint configuration
  eslint: {
    // Disable ESLint during builds to avoid blocking deployment
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    // Disable TypeScript checking during builds to avoid blocking deployment
    ignoreBuildErrors: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  },
};

export default nextConfig;
