const path = require("path");
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /\.\.\/utils\/encrypt/,
        path.resolve(__dirname, "lib/empty-encrypt.js")
      )
    );
    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns:[
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;