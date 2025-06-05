import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      }
      
      // Exclude chrome-aws-lambda and puppeteer from client bundle
      config.externals = config.externals || []
      config.externals.push('chrome-aws-lambda', 'puppeteer', 'puppeteer-core')
    }
    
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['chrome-aws-lambda', 'puppeteer']
  }
};

export default nextConfig;
