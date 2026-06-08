import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return null;
  const p = await verifyToken(token);
  return p?.sub ?? null;
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const existing = db.addresses.get(id);
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ message: 'கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  const body = await req.json() as Partial<typeof existing>;
  const updated = { ...existing, ...body, id, userId };

  if (body.isDefault) {
    for (const [k, a] of Array.from(db.addresses.entries())) {
      if (a.userId === userId && a.isDefault && k !== id) {
        db.addresses.set(k, { ...a, isDefault: false });
      }
    }
  }

  db.addresses.set(id, updated);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const existing = db.addresses.get(id);
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ message: 'கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  db.addresses.delete(id);

  if (existing.isDefault) {
    const [nextDefault] = db.getAddressesForUser(userId);
    if (nextDefault) {
      db.addresses.set(nextDefault.id, { ...nextDefault, isDefault: true });
    }
  }

  return NextResponse.json({ ok: true });
}
