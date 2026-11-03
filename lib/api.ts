import { cacheLife } from "next/cache";
import type { Category, Offer, Post, Product, SiteSettings, Testimonial, Video } from "./types";
import { API_URL } from "./config";
import catalogue from "./catalogue.json";
import content from "./content.json";

type Result<T> = { ok: true; data: T } | { ok: false };

async function get<T>(path: string): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_URL}/api${path}`);
    if (!res.ok) return { ok: false };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    console.warn(`[api] ${path} unreachable - using the bundled fallback (is the backend running on ${API_URL}?)`);
    return { ok: false };
  }
}

// When the API can't be reached (no backend deployed yet, or it's down) pages fall back to
// bundled copies of the default catalogue and content (lib/catalogue.json, lib/content.json),
// kept in sync with `npm run sync:catalogue`. Fallback results stay cacheable so pages prerender.
const fallback = catalogue as unknown as { products: Product[]; categories: Omit<Category, "count">[] };
const fallbackContent = content as unknown as {
  settings: SiteSettings;
  offers: Offer[];
  testimonials: Testimonial[];
  videos: Video[];
  posts: Post[];
};

function fallbackProducts({ category, bestseller, featured, combos, limit }: Record<string, string>) {
  let items = fallback.products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!bestseller || p.isBestseller) &&
      (!featured || p.isFeatured) &&
      (combos === undefined || String(Boolean(p.isCombo)) === combos)
  );
  items = [...items].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.reviewCount - a.reviewCount);
  return limit ? items.slice(0, Number(limit)) : items;
}

export async function getProducts(params: Record<string, string> = {}): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  const qs = new URLSearchParams(params).toString();
  const res = await get<{ products: Product[] }>(`/products${qs ? `?${qs}` : ""}`);
  return res.ok ? res.data.products : fallbackProducts(params);
}

export async function getProduct(slug: string): Promise<{ product: Product; related: Product[] } | null> {
  "use cache";
  cacheLife("minutes");
  const res = await get<{ product: Product; related: Product[] }>(`/products/${encodeURIComponent(slug)}`);
  if (res.ok) return res.data;
  const product = fallback.products.find((p) => p.slug === slug);
  if (!product) return null;
  const related = fallbackProducts({ category: product.category }).filter((p) => p.slug !== slug).slice(0, 4);
  return { product, related };
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  const res = await get<{ categories: Category[] }>("/categories");
  if (res.ok) return res.data.categories;
  return fallback.categories.map((c) => ({ ...c, count: fallback.products.filter((p) => p.category === c.slug).length }));
}

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  const res = await get<{ settings: SiteSettings }>("/settings");
  return res.ok ? res.data.settings : fallbackContent.settings;
}

export async function getOffers(): Promise<Offer[]> {
  "use cache";
  cacheLife("minutes");
  const res = await get<{ offers: Offer[] }>("/offers");
  return res.ok ? res.data.offers : fallbackContent.offers;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheLife("minutes");
  const res = await get<{ testimonials: Testimonial[] }>("/testimonials");
  return res.ok ? res.data.testimonials : fallbackContent.testimonials;
}

export async function getVideos(): Promise<Video[]> {
  "use cache";
  cacheLife("minutes");
  const res = await get<{ videos: Video[] }>("/videos");
  return res.ok ? res.data.videos : fallbackContent.videos;
}

export async function getPosts(): Promise<Post[]> {
  "use cache";
  cacheLife("minutes");
  const res = await get<{ posts: Post[] }>("/posts");
  return res.ok ? res.data.posts : fallbackContent.posts.map((p) => ({ ...p, sections: undefined }));
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheLife("minutes");
  const res = await get<{ post: Post }>(`/posts/${encodeURIComponent(slug)}`);
  if (res.ok) return res.data.post;
  return fallbackContent.posts.find((p) => p.slug === slug) ?? null;
}
