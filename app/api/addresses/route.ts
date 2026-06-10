import { NextRequest, NextResponse } from 'next/server';
import { db, DbAddress } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return null;
  const p = await verifyToken(token);
  return p?.sub ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(db.getAddressesForUser(userId));
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Omit<DbAddress, 'id' | 'userId'>;

  const id = `addr_${Date.now()}`;

  // If new address is default, clear others
  if (body.isDefault) {
    for (const [k, a] of Array.from(db.addresses.entries())) {
      if (a.userId === userId && a.isDefault) {
        db.addresses.set(k, { ...a, isDefault: false });
      }
    }
  }

  const address = { ...body, id, userId };
  db.addresses.set(id, address);

  return NextResponse.json(address, { status: 201 });
}
