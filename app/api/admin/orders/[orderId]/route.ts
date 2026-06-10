import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { db } from '@/lib/mockDb';

export async function PATCH(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  const { orderId } = await context.params;
  const order = db.orders.get(orderId);
  if (!order) {
    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  }

  try {
    const { status } = await req.json() as { status: string };
    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    order.status = status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    order.updatedAt = new Date().toISOString();
    db.orders.set(orderId, order);

    return NextResponse.json({ message: 'Order status updated successfully', order });
  } catch {
    return NextResponse.json({ message: 'Error updating status' }, { status: 500 });
  }
}
