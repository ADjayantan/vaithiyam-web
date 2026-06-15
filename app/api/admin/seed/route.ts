import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { MEDICINE_CATEGORIES, SEED_PRODUCTS } from '@/lib/medicineData';

export async function GET() {
  // Only allow seeding in development mode for safety
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Seeding is only permitted in development mode.' },
      { status: 403 }
    );
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase keys are missing in .env.local. Please define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.' },
      { status: 400 }
    );
  }

  try {
    // 1. Seed Categories
    console.log('Seeding categories...');
    const categoriesToInsert = MEDICINE_CATEGORIES.map(c => ({
      name_ta: c.nameTa,
      name_en: c.nameEn,
      slug: c.slug,
      icon: c.icon,
    }));

    // Insert categories using upsert on the slug column
    const { data: insertedCategories, error: catError } = await supabase
      .from('categories')
      .upsert(categoriesToInsert, { onConflict: 'slug' })
      .select('id, slug');

    if (catError) {
      throw new Error(`Failed to seed categories: ${catError.message}`);
    }

    // Create a mapping of category slug to UUID
    const categoryMap = new Map<string, string>();
    insertedCategories.forEach(cat => {
      categoryMap.set(cat.slug, cat.id);
    });

    // 2. Seed Medicines
    console.log('Seeding medicines...');
    const medicinesToInsert = SEED_PRODUCTS.map(p => {
      const categoryId = categoryMap.get(p.categorySlug);
      if (!categoryId) {
        throw new Error(`Category UUID not found for slug: ${p.categorySlug}`);
      }

      return {
        slug: p.slug,
        name_ta: p.nameTa,
        name_en: p.nameEn,
        category_id: categoryId,
        tradition: p.tradition,
        price: p.price,
        mrp: p.mrp,
        rating: p.rating,
        review_count: p.reviewCount,
        stock_count: p.stockCount,
        in_stock: p.inStock,
        prescription_required: p.prescriptionRequired,
        image_url: p.imageUrl || null,
        overview: p.overview,
        ingredients: p.ingredients,
        general_uses: p.generalUses,
        safety_notes: p.safetyNotes,
      };
    });

    const { error: medError } = await supabase
      .from('medicines')
      .upsert(medicinesToInsert, { onConflict: 'slug' });

    if (medError) {
      throw new Error(`Failed to seed medicines: ${medError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      categoriesInserted: categoriesToInsert.length,
      medicinesInserted: medicinesToInsert.length,
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during seeding.' },
      { status: 500 }
    );
  }
}
