import { db } from '@/lib/mockDb';
import type { SeedMedicine } from '@/lib/medicineData';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function listProducts(): Promise<SeedMedicine[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return db.products;

  // Supabase production query lives here; mock fallback above keeps local demo working.
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return db.products;

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    nameTa: row.name_ta,
    nameEn: row.name_en,
    categoryId: row.category_id,
    categorySlug: row.category_slug ?? 'general-wellness',
    categoryNameTa: row.category_name_ta ?? '',
    categoryNameEn: row.category_name_en ?? '',
    tradition: row.tradition,
    price: Number(row.price),
    mrp: Number(row.mrp),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    stockCount: Number(row.stock_count ?? 0),
    inStock: Boolean(row.in_stock),
    prescriptionRequired: Boolean(row.prescription_required),
    imageUrl: row.image_url ?? undefined,
    artTone: 'emerald',
    overview: row.overview ?? '',
    ingredients: row.ingredients ?? '',
    generalUses: row.general_uses ?? '',
    safetyNotes: row.safety_notes ?? '',
    faqs: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getProductBySlug(slug: string) {
  const products = await listProducts();
  return products.find((product) => product.slug === slug || product.id === slug) ?? null;
}
