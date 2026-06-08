import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyToken } from '@/lib/auth';
import { db } from '@/lib/mockDb';

export async function requireAdmin(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return { user: null, response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  const payload = await verifyToken(token);
  if (!payload) return { user: null, response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  const user = db.getUserById(payload.sub);
  if (!user || user.role !== 'admin') {
    return { user: null, response: NextResponse.json({ message: 'Admin access required' }, { status: 403 }) };
  }
  return { user, response: null };
}
