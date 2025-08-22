// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,   // Membantu deteksi bug di dev
  swcMinify: true,         // Aktifkan minifier bawaan SWC
  experimental: {
    appDir: true,          // Aktifkan App Router (jika pakai folder /app)
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',    // izinkan semua domain (bisa dibatasi)
      },
    ],
  },
}

export default nextConfig;
