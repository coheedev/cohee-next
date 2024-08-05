/** @type {import('next').NextConfig} */
module.exports = {
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gihsuefrgxchcuwupzor.supabase.co",
        port: "",
        // pathname: "/",
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      loader: "worker-loader",
      options: {
        name: "static/[hash].worker.js",
        publicPath: "/_next/",
      },
    });
    return config;
  },
};
