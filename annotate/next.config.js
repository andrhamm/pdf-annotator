const path = require('path');
const { createResolver } = require('./webpack-utils/resolver');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode for troubleshooting
  transpilePackages: ['react-pdf', '@react-pdf/renderer'],
  webpack: (config, { isServer }) => {
    // Add handling for PDF.js worker
    config.resolve.alias.canvas = false;
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        os: false
      };
    }
    
    // Use our custom resolver for webpack
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      {
        apply: resolver => {
          resolver.getHook('resolve').tapAsync(
            'CustomHtmlWebpackPluginResolver',
            createResolver()
          );
        }
      }
    ];
    
    // Disable any HtmlWebpackPlugin usage entirely
    config.plugins = config.plugins.filter(plugin => {
      return plugin.constructor.name !== 'HtmlWebpackPlugin';
    });
    
    // Set more debugging information
    config.stats = {
      errors: true,
      errorDetails: true,
      moduleTrace: true
    };
    
    // More aggressive webpack logging config
    config.infrastructureLogging = {
      level: 'verbose', // Change to 'verbose' for detailed webpack logs
    };
    
    return config;
  },
  // Increase memory limit for large PDFs and processing
  experimental: {
    largePageDataBytes: 128 * 1000 * 1000, // 128MB
    turbotrace: {
      logLevel: 'error',
    }
  }
}

module.exports = nextConfig
