import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

async function getUser(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return db.getUserById(payload.sub);
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    id:       user.id,
    name:     user.name,
    mobile:   user.mobile,
    email:    user.email,
    role:     user.role,
    photoUrl: user.photoUrl,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { name?: string; mobile?: string; email?: string };

  const updated = {
    ...user,
    name:   body.name   ?? user.name,
    mobile: body.mobile ?? user.mobile,
    email:  body.email  ?? user.email,
  };

  db.users.set(user.id, updated);

  return NextResponse.json({
    id:       updated.id,
    name:     updated.name,
    mobile:   updated.mobile,
    email:    updated.email,
    role:     updated.role,
    photoUrl: updated.photoUrl,
  });
}
