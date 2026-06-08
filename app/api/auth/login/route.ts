import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      mode: 'mobile' | 'email';
      identifier: string;
      password: string;
    };

    const { mode, identifier, password } = body;
    if (!identifier || !password) {
      return NextResponse.json({ message: 'அனைத்து தகவல்களும் தேவை.' }, { status: 400 });
    }

    const user = mode === 'mobile'
      ? db.getUserByMobile(identifier.replace(/\D/g, ''))
      : db.getUserByEmail(identifier.toLowerCase().trim());

    if (!user || user.password !== password) {
      return NextResponse.json(
        { message: 'தவறான தகவல்கள். மீண்டும் முயற்சிக்கவும்.' },
        { status: 401 }
      );
    }

    const token = await signToken({ sub: user.id, name: user.name, role: user.role });

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, mobile: user.mobile, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ message: 'சர்வர் பிழை.' }, { status: 500 });
  }
}
