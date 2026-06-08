import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { addProductToCart, getCartSnapshot } from '@/lib/cart';
import { db } from '@/lib/mockDb';

export async function POST(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const { orderId } = await context.params;
  const order = db.orders.get(orderId);
  if (!order || order.userId !== userId) {
    return NextResponse.json({ message: 'ஆர்டர் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  let cartItemsAdded = 0;
  for (const item of order.items) {
    const added = addProductToCart(userId, item.productId, item.qty);
    if (added) cartItemsAdded += item.qty;
  }

  return NextResponse.json({
    cartItemsAdded,
    ...getCartSnapshot(userId),
  });
}
