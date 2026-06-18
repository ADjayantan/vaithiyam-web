import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = extractBearerToken(authHeader);
  if (!token) {
    console.log('[GET USER] No token found in authorization header:', authHeader);
    return null;
  }
  const payload = await verifyToken(token);
  if (!payload) {
    console.log('[GET USER] Token verification failed for token:', token);
    return null;
  }
  const user = db.getUserById(payload.sub);
  console.log('[GET USER] Token verified successfully. Payload sub:', payload.sub, 'User in DB:', user ? 'yes' : 'no');
  return user;
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
