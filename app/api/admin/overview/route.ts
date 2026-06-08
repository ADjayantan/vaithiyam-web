import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { db } from '@/lib/mockDb';
import { MEDICINE_CATEGORIES } from '@/lib/medicineData';
import { getAdminStats } from '@/lib/db/admin';

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  return NextResponse.json({
    stats: getAdminStats(),
    medicines: db.products,
    categories: MEDICINE_CATEGORIES,
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
