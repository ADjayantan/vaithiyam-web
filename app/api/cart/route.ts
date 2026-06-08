import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import {
  clearCart,
  getCartSnapshot,
  removeCartItem,
  updateCartQuantity,
} from '@/lib/cart';

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  return NextResponse.json(getCartSnapshot(userId));
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => ({})) as { itemId?: string; qty?: number };
  if (!body.itemId || typeof body.qty !== 'number') {
    return NextResponse.json({ message: 'Cart item and quantity are required.' }, { status: 400 });
  }

  const ok = updateCartQuantity(userId, body.itemId, body.qty);
  if (!ok) {
    return NextResponse.json({ message: 'கார்ட் பொருள் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  return NextResponse.json(getCartSnapshot(userId));
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const itemId = new URL(req.url).searchParams.get('itemId');
  if (itemId) {
    const ok = removeCartItem(userId, itemId);
    if (!ok) {
      return NextResponse.json({ message: 'கார்ட் பொருள் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
    }
  } else {
    clearCart(userId);
  }

  return NextResponse.json(getCartSnapshot(userId));
}
