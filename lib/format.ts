const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatPrice = (n: number) => inr.format(n);

export const discount = (price: number, mrp: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

// Keep in sync with `categories` in backend/src/data/products.js.
export const CATEGORY_NAMES: Record<string, string> = {
  "energy-vitality": "Energy & Vitality",
  "daily-nutrition": "Daily Nutrition",
  "skin-hair": "Skin & Hair",
  "digestion-metabolism": "Digestion & Metabolism",
  "sleep-relaxation": "Sleep & Relaxation",
  immunity: "Immunity",
  combos: "Combos",
};
