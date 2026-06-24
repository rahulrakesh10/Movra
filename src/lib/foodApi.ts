export interface FoodResult {
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingLabel?: string;
  barcode?: string;
}

function round(n: number, p = 1) {
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}

interface OFFProduct {
  nutriments?: Record<string, number | undefined>;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  serving_size?: string;
  code?: string;
}

function fromOFFProduct(p: OFFProduct): FoodResult | null {
  if (!p) return null;
  const n = p.nutriments || {};
  // Prefer per-serving when available, fallback to per-100g
  const hasServing =
    typeof n["energy-kcal_serving"] === "number" || typeof n["proteins_serving"] === "number";
  const suffix = hasServing ? "_serving" : "_100g";
  const calories = n[`energy-kcal${suffix}`] ?? n["energy-kcal_100g"] ?? 0;
  const protein = n[`proteins${suffix}`] ?? n["proteins_100g"] ?? 0;
  const carbs = n[`carbohydrates${suffix}`] ?? n["carbohydrates_100g"] ?? 0;
  const fat = n[`fat${suffix}`] ?? n["fat_100g"] ?? 0;
  const name = p.product_name || p.product_name_en || p.generic_name || "Unknown product";
  const servingLabel = hasServing ? p.serving_size || "1 serving" : "per 100g";
  return {
    name,
    brand: p.brands?.split(",")[0]?.trim(),
    calories: round(calories, 0),
    protein: round(protein),
    carbs: round(carbs),
    fat: round(fat),
    servingLabel,
    barcode: p.code,
  };
}

/** Look up a product by barcode via Open Food Facts. */
export async function lookupBarcode(barcode: string): Promise<FoodResult | null> {
  const clean = barcode.replace(/\D/g, "");
  if (!clean) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    clean,
  )}.json?fields=product_name,product_name_en,generic_name,brands,code,nutriments,serving_size`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1) return null;
  return fromOFFProduct(data.product);
}

/** Search Open Food Facts by free text. */
export async function searchFoods(query: string, limit = 15): Promise<FoodResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    q,
  )}&search_simple=1&action=process&json=1&page_size=${limit}&fields=product_name,product_name_en,generic_name,brands,code,nutriments,serving_size`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const products: OFFProduct[] = data.products || [];
  return products
    .map(fromOFFProduct)
    .filter((p): p is FoodResult => !!p && (p.calories > 0 || p.protein > 0));
}
