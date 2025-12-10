/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false,   // 🚨 TURN OFF TURBOPACK COMPLETELY
  },

  // Use normal Webpack for dev + prod
  webpack: (config) => {
    return config;
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
