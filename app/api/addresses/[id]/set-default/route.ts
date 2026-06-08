import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const userId = payload.sub;
  const { id } = await context.params;
  const target = db.addresses.get(id);

  if (!target || target.userId !== userId) {
    return NextResponse.json({ message: 'கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  // Clear all defaults for user
  for (const [k, a] of Array.from(db.addresses.entries())) {
    if (a.userId === userId) {
      db.addresses.set(k, { ...a, isDefault: a.id === id });
    }
  }

  return NextResponse.json(db.getAddressesForUser(userId));
}
