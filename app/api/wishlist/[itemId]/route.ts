import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

export async function DELETE(req: NextRequest, context: { params: Promise<{ itemId: string }> }) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { itemId } = await context.params;
  const item = db.wishlist.get(itemId);
  if (!item || item.userId !== payload.sub) {
    return NextResponse.json({ message: 'கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  db.wishlist.delete(itemId);
  return NextResponse.json({ ok: true });
}
