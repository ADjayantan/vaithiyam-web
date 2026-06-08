import { NextRequest, NextResponse } from 'next/server';
import { db, type DbUser } from '@/lib/mockDb';
import { extractBearerToken, verifyToken } from '@/lib/auth';

export async function getAuthenticatedUser(req: NextRequest): Promise<DbUser | null> {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.sub) return null;

  return db.getUserById(payload.sub) ?? null;
}

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const user = await getAuthenticatedUser(req);
  return user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}
