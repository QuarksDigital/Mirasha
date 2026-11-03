export type Dosha = "Vata" | "Pitta" | "Kapha";

export interface Variant {
  sku: string;
  label: string;
  price: number;
  mrp: number;
  stock: number;
}

export interface Ingredient {
  name: string;
  latin: string;
  amount: string;
  role: string;
}

export interface Product {
  slug: string;
  name: string;
  sanskritName?: string;
  tagline: string;
  brand: string;
  category: string;
  form: string;
  description: string;
  benefits: string[];
  keyIngredients: Ingredient[];
  doshas: Dosha[];
  dosage: string;
  howToUse: string;
  precautions: string[];
  variants: Variant[];
  images: string[];
  rating: number;
  reviewCount: number;
  tags: string[];
  certifications: string[];
  shelfLife: string;
  storage: string;
  manufacturer: string;
  countryOfOrigin: string;
  ayushLicense: string;
  gstRate: number;
  currency: string;
  isFeatured: boolean;
  isBestseller: boolean;
  faq: { q: string; a: string }[];
  isCombo?: boolean;
  /** items included in a combo */
  components?: { slug: string; name: string; sku: string; label: string; quantity: number }[];
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  count: number;
}

export interface CartItem {
  slug: string;
  sku: string;
  name: string;
  label: string;
  price: number;
  mrp: number;
  image: string;
  quantity: number;
}

export interface Quote {
  items: { slug: string; sku: string; name: string; label: string; unitPrice: number; quantity: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  coupon: { code: string; description?: string } | null;
  shipping: number;
  total: number;
  currency: string;
}

export interface Offer {
  _id?: string;
  title: string;
  detail?: string;
  code?: string;
  link?: string;
  active?: boolean;
  order?: number;
}

export interface PostSection {
  heading: string;
  body?: string[];
  points?: string[];
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover: string;
  readMinutes: number;
  relatedProducts?: string[];
  publishedAt: string;
  sections?: PostSection[];
}

export interface Testimonial {
  _id?: string;
  name: string;
  city?: string;
  product?: string;
  rating?: number;
  quote: string;
}

export interface Video {
  _id?: string;
  kind: "instagram" | "youtube" | "mp4";
  url: string;
  title?: string;
  poster?: string;
}

export interface SiteSettings {
  siteName?: string;
  domain?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  instagramUrl?: string;
  shopifyUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  freeShippingAbove?: number;
  shippingFee?: number;
}
