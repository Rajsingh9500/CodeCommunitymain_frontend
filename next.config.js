/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🚀 Disable ESLint & TypeScript blocking during Vercel build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 🚀 Allow images from your backend URL
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "codecommunitymain-backend.onrender.com",
        pathname: "/uploads/**",
      },
    ],
  },

  // 🚀 Rewrite API paths to backend IN PRODUCTION
  async rewrites() {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://codecommunitymain-backend.onrender.com";

    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },

  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
