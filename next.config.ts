import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,

  // Security + cache headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Powered-By", value: "ForThePeople.in" },
          { key: "X-Creator", value: "Jayanth M B" },
          { key: "X-Project-ID", value: "FTP-JMB-2026-IN" },
          { key: "X-License", value: "MIT with Attribution - github.com/jayanthmb14/forthepeople" },
        ],
      },
      // Cache static GeoJSON files aggressively
      {
        source: "/geo/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // Cache API responses for 5 minutes at CDN
      {
        source: "/api/data/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ];
  },

  // Slug aliases → canonical module routes (308, SEO-friendly).
  // Keeps external/bookmarked links working after folder rename.
  async redirects() {
    const pairs: Array<[string, string]> = [
      ["budget", "finance"],
      ["famous", "famous-personalities"],
      ["citizen", "citizen-corner"],
      ["panchayat", "gram-panchayat"],
      ["farm-advisory", "farm"],
    ];
    return pairs.map(([from, to]) => ({
      source: "/:locale/:state/:district/" + from,
      destination: "/:locale/:state/:district/" + to,
      permanent: true,
    }));
  },

  // Remove default "x-powered-by: Next.js" header (we set our own above)
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Image optimisation
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  org: "forthepeople",
  project: "forthepeople-web",
});
