import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Repo uses the parent workspace AGENTS.md; stop `next dev` from
  // generating Chillmate/AGENTS.md + CLAUDE.md on every run.
  agentRules: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
