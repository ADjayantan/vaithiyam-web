import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { addProductToCart, getCartSnapshot } from '@/lib/cart';

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  try {
    const body = await req.json().catch(() => ({})) as { items?: { productId: string; qty: number }[] };
    const items = body.items ?? [];

    for (const item of items) {
      await addProductToCart(userId, item.productId, item.qty);
    }

    return NextResponse.json(getCartSnapshot(userId));
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Could not sync cart.' }, { status: 500 });
  }
}
