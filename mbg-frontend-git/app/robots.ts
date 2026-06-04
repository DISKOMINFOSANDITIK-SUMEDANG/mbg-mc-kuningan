import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://mbg.kuningankab.go.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/cms/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
