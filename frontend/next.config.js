const checkEnvVariables = require("./check-env-variables")
checkEnvVariables()

const path = require("path")

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

function getEnonicWebpackConfig(config, { dev, isServer }) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
  }
  config.resolve.alias = {
    ...config.resolve.alias,
    "@phrases": path.resolve(__dirname, "src", "phrases"),
  }
  return config
}

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@enonic/nextjs-adapter"],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: getEnonicWebpackConfig,
  turbopack: {
    resolveAlias: {
      "@phrases": path.resolve(__dirname, "src", "phrases"),
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
