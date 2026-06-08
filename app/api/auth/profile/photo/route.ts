import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const user = db.getUserById(payload.sub);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // Mock: return a placeholder avatar URL instead of storing the actual file
  const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1A3A2A&color=F0C96E&size=200&font-size=0.4`;

  const updated = { ...user, photoUrl };
  db.users.set(user.id, updated);

  return NextResponse.json({ photoUrl });
}
