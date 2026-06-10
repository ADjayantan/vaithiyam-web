import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { db } from '@/lib/mockDb';
import { getAdminStats } from '@/lib/db/admin';
import { listProducts } from '@/lib/db/products';
import { listCategories } from '@/lib/db/categories';

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  const products = await listProducts();
  const categories = await listCategories();
  const stats = getAdminStats();

  return NextResponse.json({
    stats: {
      ...stats,
      totalMedicines: products.length,
      lowStock: products.filter((p) => p.stockCount > 0 && p.stockCount <= 15).length,
    },
    medicines: products,
    categories: categories,
    orders: Array.from(db.orders.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    prescriptions: Array.from(db.prescriptions.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    users: Array.from(db.users.values()).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
    })),
  });
}
