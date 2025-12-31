import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    // Add your dev machine's LAN IP(s)
    "192.168.137.*",
    // Optionally allow whole subnet (use cautiously)
  ],
};

export default nextConfig;
