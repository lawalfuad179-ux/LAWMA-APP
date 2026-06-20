import type { NextConfig } from "next";

// Production redeploy marker: ensures Vercel build runs `prisma migrate deploy`
// so pending migrations (e.g. 0002_add_discount_and_recycling) are applied.
const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.100.68'],
};

export default nextConfig;
