import { db } from '@/lib/mockDb';
import { type MedicineCategory } from '@/lib/medicineData';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function listCategories(): Promise<MedicineCategory[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return db.categories;

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return db.categories;

  return data.map((row) => ({
    id: row.id,
    nameTa: row.name_ta,
    nameEn: row.name_en,
    slug: row.slug,
    icon: row.icon || 'Leaf',
    createdAt: row.created_at,
  }));
}

export async function addCategory(categoryData: Omit<MedicineCategory, 'id' | 'createdAt'>): Promise<MedicineCategory> {
  const supabase = getSupabaseServiceClient();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat_${Date.now()}`;
  const newCat: MedicineCategory = {
    ...categoryData,
    id,
    createdAt: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        id: newCat.id,
        name_ta: newCat.nameTa,
        name_en: newCat.nameEn,
        slug: newCat.slug,
        icon: newCat.icon,
      }])
      .select('*')
      .single();
    if (error) {
      console.error('Error inserting category into Supabase:', error);
      throw error;
    }
    newCat.id = data.id;
    newCat.createdAt = data.created_at;
  }

  // Sync with db.categories
  db.categories.push(newCat);
  return newCat;
}

export async function updateCategory(id: string, categoryData: Partial<Omit<MedicineCategory, 'id' | 'createdAt'>>): Promise<MedicineCategory> {
  const supabase = getSupabaseServiceClient();
  
  if (supabase) {
    const updatePayload: Record<string, string> = {};
    if (categoryData.nameTa !== undefined) updatePayload.name_ta = categoryData.nameTa;
    if (categoryData.nameEn !== undefined) updatePayload.name_en = categoryData.nameEn;
    if (categoryData.slug !== undefined) updatePayload.slug = categoryData.slug;
    if (categoryData.icon !== undefined) updatePayload.icon = categoryData.icon;

    const { error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id);
    if (error) {
      console.error('Error updating category in Supabase:', error);
      throw error;
    }
  }

  // Update in memory
  const cat = db.categories.find(c => c.id === id);
  if (cat) {
    if (categoryData.nameTa !== undefined) cat.nameTa = categoryData.nameTa;
    if (categoryData.nameEn !== undefined) cat.nameEn = categoryData.nameEn;
    if (categoryData.slug !== undefined) cat.slug = categoryData.slug;
    if (categoryData.icon !== undefined) cat.icon = categoryData.icon;
    return cat;
  }
  throw new Error('Category not found');
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting category from Supabase:', error);
      throw error;
    }
  }

  const idx = db.categories.findIndex(c => c.id === id);
  if (idx !== -1) {
    db.categories.splice(idx, 1);
  }
}
