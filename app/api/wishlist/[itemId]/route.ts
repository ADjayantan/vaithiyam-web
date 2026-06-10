import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';

export async function DELETE(req: NextRequest, context: { params: Promise<{ itemId: string }> }) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const { itemId } = await context.params;
  const item = db.wishlist.get(itemId);
  if (!item || item.userId !== userId) {
    return NextResponse.json({ message: 'கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  db.wishlist.delete(itemId);
  return NextResponse.json({ ok: true });
}
