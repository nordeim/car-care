import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://car-care.jesspete.shop";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "Twitterbot", allow: "/" },
      { userAgent: "facebookexternalhit", allow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
