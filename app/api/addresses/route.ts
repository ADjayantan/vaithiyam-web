import { NextRequest, NextResponse } from 'next/server';
import { db, DbAddress } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const token = extractBearerToken(authHeader);
  if (!token) {
    console.log('[GET USERID ADDRESSES] No token found in authorization header:', authHeader);
    return null;
  }
  const p = await verifyToken(token);
  if (!p) {
    console.log('[GET USERID ADDRESSES] Token verification failed for token:', token);
    return null;
  }
  console.log('[GET USERID ADDRESSES] Token verified successfully. Payload sub:', p.sub);
  return p.sub;
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
