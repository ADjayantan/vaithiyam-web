import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { toOrderData } from '@/lib/orderDto';

export async function GET(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const { orderId } = await context.params;
  const order = db.orders.get(orderId);
  if (!order || order.userId !== userId) {
    return NextResponse.json({ message: 'ஆர்டர் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  return NextResponse.json(toOrderData(order));
}
