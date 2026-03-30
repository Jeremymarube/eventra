/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/:path*`, // Proxy API requests to Flask backend
      },
    ];
  },
};

export default nextConfig;
