/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/The-Child-Lens',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
