import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google Profile Pictures
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ycoemqtpingofngxhegf.supabase.co', 
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  allowedDevOrigins: [
    'localhost',
    '10.67.212.73',
    '*.local',
  ],

};

export default nextConfig;