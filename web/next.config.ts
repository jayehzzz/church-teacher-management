import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Ensure Turbopack uses the project root inside the `web` directory
    root: process.cwd(),
  },
};

export default nextConfig;
