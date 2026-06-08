import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { addProductToCart, getCartSnapshot } from '@/lib/cart';

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const body   = await req.json() as { productId: string; qty?: number };

  const item = addProductToCart(userId, body.productId, body.qty ?? 1);
  if (!item) {
    return NextResponse.json({ message: 'பொருள் கிடைக்கவில்லை அல்லது கையிருப்பில் இல்லை.' }, { status: 404 });
  }

  return NextResponse.json(getCartSnapshot(userId));
}
