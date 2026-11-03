import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  // The admin panel lives at a secret path that is intentionally NOT listed here.
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/checkout", "/cart", "/login"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
