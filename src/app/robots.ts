import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/**
 * Everything public is crawlable; the API is not (and it also sends `X-Robots-Tag: noindex` from
 * next.config.ts, which holds even for a crawler that ignores this file). /og stays crawlable on
 * purpose: social networks fetch the per-page preview cards from there.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
