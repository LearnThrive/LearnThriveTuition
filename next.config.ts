import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          production: process.env.NODE_ENV === "production",
          cspReportOnly: process.env.CSP_REPORT_ONLY === "1",
        }),
      },
      // The API is never a search result.
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  // No bare-domain to www redirect here, unlike the Software project: which host is the canonical one
  // is a setting at the hosting provider, and a rule in code that disagrees with it makes a redirect
  // loop. Pages declare the www host as canonical (metadata.ts) and the sitemap lists it.
  async redirects() {
    return [
      {
        source: "/our-tutors",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/ourTutors",
        destination: "/about",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
