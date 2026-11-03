import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getPosts, getProducts } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([getProducts(), getPosts()]);
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly", priority });
  return [
    page("/", 1),
    page("/shop", 0.9),
    page("/offers", 0.8),
    page("/blog", 0.7),
    ...products.map((p) => page(`/products/${p.slug}`, 0.8)),
    ...posts.map((p) => ({ ...page(`/blog/${p.slug}`, 0.6), lastModified: p.publishedAt })),
  ];
}
