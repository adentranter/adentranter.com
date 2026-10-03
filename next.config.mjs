/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Increase the body size limit to 5MB (value in bytes)
      bodySizeLimit: 5 * 1024 * 1024,
    },
    // One worker, and Webpack's lower-memory mode, so the Coolify build
    // is not SIGKILLed (exit 137) when the host is short on RAM.
    cpus: 1,
    staticGenerationMaxConcurrency: 2,
    webpackMemoryOptimizations: true,
  },
  transpilePackages: ['@adentranter/music-api', 'uploadthing', '@uploadthing/react'],
  outputFileTracingIncludes: {
    '/app/essays/[slug]': ['./src/app/essays/content/**/*'],
  },
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig
