import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    // Exposes only whether Gemini is configured, never the key itself.
    NEXT_PUBLIC_GEMINI_ENABLED: process.env.GEMINI_API_KEY ? 'true' : '',
  },
};

export default nextConfig;
