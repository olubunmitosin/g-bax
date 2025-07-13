/** @type {import('next').NextConfig} */
const nextConfig = {
    // Output configuration for Netlify
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',

    // Disable ESLint during build for deployment
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Disable TypeScript checking during build
    typescript: {
        ignoreBuildErrors: true,
    },

    // Image optimization disabled for static export
    images: {
        unoptimized: true,
    },

    // Asset prefix for CDN (optional)
    assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

    // Webpack configuration
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Fallbacks for Node.js modules that don't work in the browser
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                os: false,
                crypto: false,
                stream: false,
                buffer: false,
                util: false,
                assert: false,
                constants: false,
                vm: false,
                zlib: false,
                http: false,
                https: false,
                url: false,
                querystring: false,
            };
        }
        return config;
    },

    // Environment variables
    env: {
        NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
    },
};

module.exports = nextConfig;
