import { db, type DbOrder } from '@/lib/mockDb';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function listOrdersForUser(userId: string): Promise<DbOrder[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return db.getOrdersForUser(userId);

  // Supabase query placeholder; join order_items in a production mapper.
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return db.getOrdersForUser(userId);

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    status: row.status,
    items: [],
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    addressId: row.address_id,
    paymentMethod: row.payment_method,
    prescriptionStatus: row.prescription_status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
