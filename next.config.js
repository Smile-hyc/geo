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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/home", destination: "/app/home", permanent: false },
      { source: "/annotate", destination: "/app/annotate", permanent: false },
      {
        source: "/annotate/mode",
        destination: "/app/annotate/mode",
        permanent: false,
      },
      { source: "/battle", destination: "/app/battle", permanent: false },
      {
        source: "/battle/:sessionId/play",
        destination: "/app/battle/:sessionId/play",
        permanent: false,
      },
      {
        source: "/battle/:sessionId/result",
        destination: "/app/battle/:sessionId/result",
        permanent: false,
      },
      { source: "/history", destination: "/app/history", permanent: false },
      { source: "/points", destination: "/app/points", permanent: false },
      { source: "/profile", destination: "/app/profile", permanent: false },
      { source: "/rewards", destination: "/app/rewards", permanent: false },
      {
        source: "/leaderboard",
        destination: "/app/leaderboard",
        permanent: false,
      },
      { source: "/login", destination: "/auth/login", permanent: false },
      { source: "/register", destination: "/auth/register", permanent: false },
      {
        source: "/forgot-password",
        destination: "/auth/forgot-password",
        permanent: false,
      },
      {
        source: "/admin/prizes",
        destination: "/admin/rewards",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
