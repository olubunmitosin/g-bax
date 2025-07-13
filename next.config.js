/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;
