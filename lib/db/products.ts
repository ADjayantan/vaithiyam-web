import { db } from '@/lib/mockDb';
import { MEDICINE_CATEGORIES, type SeedMedicine } from '@/lib/medicineData';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function listProducts(): Promise<SeedMedicine[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return db.products;

  // Query medicines table joining the categories table for metadata
  const { data, error } = await supabase
    .from('medicines')
    .select('*, categories(id, name_ta, name_en, slug, icon)')
    .order('created_at', { ascending: false });
  if (error || !data) return db.products;

  return data.map((row) => {
    const cat = row.categories as { id: string; name_ta: string; name_en: string; slug: string; icon: string } | null;
    return {
      id: row.id,
      slug: row.slug,
      nameTa: row.name_ta,
      nameEn: row.name_en,
      categoryId: row.category_id,
      categorySlug: cat?.slug ?? 'general-wellness',
      categoryNameTa: cat?.name_ta ?? '',
      categoryNameEn: cat?.name_en ?? '',
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
    };
  });
}

export async function getProductBySlug(slug: string) {
  const products = await listProducts();
  return products.find((product) => product.slug === slug || product.id === slug) ?? null;
}

export async function addProduct(
  productData: Omit<
    SeedMedicine,
    'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'categoryId' | 'categoryNameTa' | 'categoryNameEn' | 'slug'
  > & {
    slug?: string;
  }
): Promise<SeedMedicine> {
  const supabase = getSupabaseServiceClient();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod_${Date.now()}`;
  const slug = productData.slug || productData.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const categoryInfo = MEDICINE_CATEGORIES.find((c) => c.slug === productData.categorySlug);
  const categoryId = categoryInfo ? categoryInfo.id : 'cat_wellness';
  const categoryNameTa = categoryInfo ? categoryInfo.nameTa : '';
  const categoryNameEn = categoryInfo ? categoryInfo.nameEn : '';

  const newProduct: SeedMedicine = {
    ...productData,
    id,
    slug,
    categoryId,
    categoryNameTa,
    categoryNameEn,
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    faqs: productData.faqs || [
      {
        question: 'Can I use this without advice?',
        answer: 'This page is educational only. Please consult a qualified doctor or pharmacist before use.',
      },
      {
        question: 'Does Vaithiyam provide dosage guidance?',
        answer: 'No. Vaithiyam does not provide diagnosis, dosage, or self-medication recommendations.',
      },
    ],
  };

  if (!supabase) {
    db.addProduct(newProduct);
    return newProduct;
  }

  // Handle Supabase Category lookup or creation
  let dbCategoryId = null;
  const { data: catData } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', productData.categorySlug)
    .maybeSingle();

  if (catData) {
    dbCategoryId = catData.id;
  } else if (categoryInfo) {
    const { data: newCat } = await supabase
      .from('categories')
      .insert([{
        name_ta: categoryInfo.nameTa,
        name_en: categoryInfo.nameEn,
        slug: categoryInfo.slug,
        icon: categoryInfo.icon,
      }])
      .select('id')
      .single();
    if (newCat) {
      dbCategoryId = newCat.id;
    }
  }

  const { data, error } = await supabase
    .from('medicines')
    .insert([{
      id: newProduct.id,
      slug: newProduct.slug,
      name_ta: newProduct.nameTa,
      name_en: newProduct.nameEn,
      category_id: dbCategoryId,
      tradition: newProduct.tradition,
      price: newProduct.price,
      mrp: newProduct.mrp,
      rating: newProduct.rating,
      review_count: newProduct.reviewCount,
      stock_count: newProduct.stockCount,
      in_stock: newProduct.inStock,
      prescription_required: newProduct.prescriptionRequired,
      image_url: newProduct.imageUrl || null,
      overview: newProduct.overview,
      ingredients: newProduct.ingredients,
      general_uses: newProduct.generalUses,
      safety_notes: newProduct.safetyNotes,
    }])
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting medicine into Supabase:', error);
    throw error;
  }

  // Sync to local fallback mock db
  db.addProduct(newProduct);

  return {
    ...newProduct,
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateProduct(
  id: string,
  productData: Partial<Omit<SeedMedicine, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'categoryId' | 'categoryNameTa' | 'categoryNameEn' | 'slug'>> & {
    categorySlug?: string;
  }
): Promise<SeedMedicine> {
  const supabase = getSupabaseServiceClient();

  const updateFields: Partial<SeedMedicine> = {};
  if (productData.nameTa !== undefined) updateFields.nameTa = productData.nameTa;
  if (productData.nameEn !== undefined) updateFields.nameEn = productData.nameEn;
  if (productData.categorySlug !== undefined) {
    const categoryInfo = MEDICINE_CATEGORIES.find((c) => c.slug === productData.categorySlug);
    updateFields.categorySlug = productData.categorySlug;
    updateFields.categoryId = categoryInfo ? categoryInfo.id : 'cat_wellness';
    updateFields.categoryNameTa = categoryInfo ? categoryInfo.nameTa : '';
    updateFields.categoryNameEn = categoryInfo ? categoryInfo.nameEn : '';
  }
  if (productData.tradition !== undefined) updateFields.tradition = productData.tradition;
  if (productData.price !== undefined) updateFields.price = Number(productData.price);
  if (productData.mrp !== undefined) updateFields.mrp = Number(productData.mrp);
  if (productData.stockCount !== undefined) updateFields.stockCount = Number(productData.stockCount);
  if (productData.inStock !== undefined) updateFields.inStock = Boolean(productData.inStock);
  if (productData.prescriptionRequired !== undefined) updateFields.prescriptionRequired = Boolean(productData.prescriptionRequired);
  if (productData.imageUrl !== undefined) updateFields.imageUrl = productData.imageUrl;
  if (productData.overview !== undefined) updateFields.overview = productData.overview;
  if (productData.ingredients !== undefined) updateFields.ingredients = productData.ingredients;
  if (productData.generalUses !== undefined) updateFields.generalUses = productData.generalUses;
  if (productData.safetyNotes !== undefined) updateFields.safetyNotes = productData.safetyNotes;

  updateFields.updatedAt = new Date().toISOString();

  if (supabase) {
    // Lookup database category_id from slug if changing categorySlug
    let dbCategoryId = undefined;
    if (productData.categorySlug !== undefined) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', productData.categorySlug)
        .maybeSingle();
      if (catData) {
        dbCategoryId = catData.id;
      }
    }

    const pgFields: Record<string, string | number | boolean | null> = {};
    if (productData.nameTa !== undefined) pgFields.name_ta = productData.nameTa;
    if (productData.nameEn !== undefined) pgFields.name_en = productData.nameEn;
    if (dbCategoryId !== undefined) pgFields.category_id = dbCategoryId;
    if (productData.tradition !== undefined) pgFields.tradition = productData.tradition;
    if (productData.price !== undefined) pgFields.price = Number(productData.price);
    if (productData.mrp !== undefined) pgFields.mrp = Number(productData.mrp);
    if (productData.stockCount !== undefined) pgFields.stock_count = Number(productData.stockCount);
    if (productData.inStock !== undefined) pgFields.in_stock = Boolean(productData.inStock);
    if (productData.prescriptionRequired !== undefined) pgFields.prescription_required = Boolean(productData.prescriptionRequired);
    if (productData.imageUrl !== undefined) pgFields.image_url = productData.imageUrl;
    if (productData.overview !== undefined) pgFields.overview = productData.overview;
    if (productData.ingredients !== undefined) pgFields.ingredients = productData.ingredients;
    if (productData.generalUses !== undefined) pgFields.general_uses = productData.generalUses;
    if (productData.safetyNotes !== undefined) pgFields.safety_notes = productData.safetyNotes;
    
    pgFields.updated_at = updateFields.updatedAt;

    const { error } = await supabase
      .from('medicines')
      .update(pgFields)
      .eq('id', id);

    if (error) {
      console.error('Error updating medicine in Supabase:', error);
      throw error;
    }
  }

  // Update memory
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const original = db.products[idx];
    const updated = {
      ...original,
      ...updateFields,
    };
    db.products[idx] = updated;
    return updated;
  }

  throw new Error('Product not found in memory database');
}
