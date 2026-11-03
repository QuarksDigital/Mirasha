// Field definitions that drive the generic admin editors.

export type FieldType = "text" | "textarea" | "number" | "boolean" | "list" | "json" | "select";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  help?: string;
  required?: boolean;
}

export interface ResourceConfig {
  key: string; // API collection name
  title: string;
  singular: string;
  columns: { name: string; label: string; format?: "money" | "bool" | "date" | "count" }[];
  fields: Field[];
  defaults: Record<string, unknown>;
}

export const CATEGORIES = ["energy-vitality", "daily-nutrition", "skin-hair", "digestion-metabolism", "sleep-relaxation", "immunity", "combos"];

export const RESOURCES: Record<string, ResourceConfig> = {
  products: {
    key: "products",
    title: "Products",
    singular: "product",
    columns: [
      { name: "name", label: "Name" },
      { name: "category", label: "Category" },
      { name: "price", label: "Price", format: "money" },
      { name: "stock", label: "Stock" },
      { name: "isActive", label: "Live", format: "bool" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", required: true, help: "lowercase-with-dashes, used in /products/<slug>" },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "category", label: "Category", type: "select", options: CATEGORIES, required: true },
      { name: "form", label: "Form", type: "text", help: "e.g. Capsules, Gummies, Resin" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "images", label: "Images", type: "list", help: "One path or URL per line — 1000×1200 px" },
      { name: "variants", label: "Variants (sizes, prices, stock)", type: "json", required: true, help: '[{"sku":"MIR-X-30","label":"30 g","price":999,"mrp":1299,"stock":50}]' },
      { name: "benefits", label: "Benefits", type: "list" },
      { name: "keyIngredients", label: "Key ingredients", type: "json", help: '[{"name":"","latin":"","amount":"","role":""}]' },
      { name: "dosage", label: "Dosage", type: "text" },
      { name: "howToUse", label: "How to use", type: "textarea" },
      { name: "precautions", label: "Precautions", type: "list" },
      { name: "certifications", label: "Certifications", type: "list" },
      { name: "tags", label: "Search tags", type: "list" },
      { name: "shelfLife", label: "Shelf life", type: "text" },
      { name: "storage", label: "Storage", type: "text" },
      { name: "ayushLicense", label: "Licence number", type: "text" },
      { name: "faq", label: "FAQ", type: "json", help: '[{"q":"","a":""}]' },
      { name: "isCombo", label: "Combo product", type: "boolean" },
      { name: "components", label: "Combo contents", type: "json", help: '[{"slug":"","name":"","sku":"","label":"","quantity":1}]' },
      { name: "isFeatured", label: "Featured", type: "boolean" },
      { name: "isBestseller", label: "Bestseller badge", type: "boolean" },
      { name: "isActive", label: "Live on site", type: "boolean" },
      { name: "rating", label: "Rating (0–5)", type: "number" },
      { name: "reviewCount", label: "Review count", type: "number" },
    ],
    defaults: { brand: "Mirasha", currency: "INR", gstRate: 18, isActive: true, variants: [{ sku: "", label: "", price: 0, mrp: 0, stock: 0 }], images: [], benefits: [], keyIngredients: [], precautions: [], certifications: [], tags: [], faq: [], doshas: [], rating: 0, reviewCount: 0 },
  },
  offers: {
    key: "offers",
    title: "Offers",
    singular: "offer",
    columns: [
      { name: "title", label: "Offer" },
      { name: "code", label: "Code" },
      { name: "order", label: "Order" },
      { name: "active", label: "Live", format: "bool" },
    ],
    fields: [
      { name: "title", label: "Headline", type: "text", required: true, help: "Shown in the marquees and offer cards" },
      { name: "detail", label: "Detail", type: "text" },
      { name: "code", label: "Coupon code shown", type: "text", help: "Create the matching coupon under Coupons" },
      { name: "link", label: "Link", type: "text" },
      { name: "order", label: "Sort order", type: "number" },
      { name: "active", label: "Live", type: "boolean" },
    ],
    defaults: { active: true, order: 10, link: "/shop" },
  },
  coupons: {
    key: "coupons",
    title: "Coupons",
    singular: "coupon",
    columns: [
      { name: "code", label: "Code" },
      { name: "type", label: "Type" },
      { name: "value", label: "Value" },
      { name: "minOrder", label: "Min order", format: "money" },
      { name: "active", label: "Live", format: "bool" },
    ],
    fields: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "description", label: "Description", type: "text" },
      { name: "type", label: "Type", type: "select", options: ["percent", "flat"], required: true },
      { name: "value", label: "Value (% or ₹)", type: "number", required: true },
      { name: "minOrder", label: "Minimum order (₹)", type: "number" },
      { name: "minItems", label: "Minimum items", type: "number" },
      { name: "firstOrderOnly", label: "First order only", type: "boolean" },
      { name: "active", label: "Live", type: "boolean" },
    ],
    defaults: { type: "percent", value: 10, minOrder: 0, minItems: 0, firstOrderOnly: false, active: true },
  },
  posts: {
    key: "posts",
    title: "Journal",
    singular: "article",
    columns: [
      { name: "title", label: "Title" },
      { name: "category", label: "Category" },
      { name: "publishedAt", label: "Date", format: "date" },
      { name: "published", label: "Published", format: "bool" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "category", label: "Category", type: "text" },
      { name: "cover", label: "Cover image", type: "text", help: "1000×1200 px" },
      { name: "readMinutes", label: "Read time (min)", type: "number" },
      { name: "publishedAt", label: "Publish date (YYYY-MM-DD)", type: "text" },
      { name: "relatedProducts", label: "Related product slugs", type: "list" },
      { name: "sections", label: "Sections", type: "json", help: '[{"heading":"","body":["paragraph"],"points":["bullet"]}]' },
      { name: "published", label: "Published", type: "boolean" },
    ],
    defaults: { published: false, readMinutes: 4, sections: [{ heading: "", body: [""] }], relatedProducts: [] },
  },
  testimonials: {
    key: "testimonials",
    title: "Reviews",
    singular: "review",
    columns: [
      { name: "name", label: "Name" },
      { name: "product", label: "Product" },
      { name: "rating", label: "Rating" },
      { name: "active", label: "Live", format: "bool" },
    ],
    fields: [
      { name: "name", label: "Customer name", type: "text", required: true },
      { name: "city", label: "City", type: "text" },
      { name: "product", label: "Product", type: "text" },
      { name: "rating", label: "Rating (1–5)", type: "number" },
      { name: "quote", label: "Review", type: "textarea", required: true },
      { name: "order", label: "Sort order", type: "number" },
      { name: "active", label: "Live", type: "boolean" },
    ],
    defaults: { rating: 5, active: true, order: 10 },
  },
  videos: {
    key: "videos",
    title: "Videos",
    singular: "video",
    columns: [
      { name: "kind", label: "Type" },
      { name: "url", label: "URL" },
      { name: "order", label: "Order" },
      { name: "active", label: "Live", format: "bool" },
    ],
    fields: [
      { name: "kind", label: "Type", type: "select", options: ["instagram", "youtube", "mp4"], required: true },
      { name: "url", label: "URL", type: "text", required: true, help: "Instagram reel / YouTube link, or an .mp4 URL" },
      { name: "title", label: "Title", type: "text" },
      { name: "poster", label: "Poster image (mp4 only)", type: "text" },
      { name: "order", label: "Sort order", type: "number" },
      { name: "active", label: "Live", type: "boolean" },
    ],
    defaults: { kind: "instagram", active: true, order: 10 },
  },
  knowledge: {
    key: "knowledge",
    title: "Assistant knowledge",
    singular: "document",
    columns: [{ name: "title", label: "Title" }],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Content", type: "textarea", required: true, help: "Facts the AI assistant should know (policies, FAQs). Products and articles are included automatically." },
    ],
    defaults: {},
  },
};
