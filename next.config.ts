import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ['@supabase/supabase-js'],
};

export default nextConfig;
