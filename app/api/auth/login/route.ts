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

    let identifierClean = identifier;
    if (mode === 'mobile') {
      let cleaned = identifier.replace(/\D/g, '');
      if (cleaned.startsWith('91') && cleaned.length === 12 && /^[6-9]/.test(cleaned.slice(2))) {
        cleaned = cleaned.slice(2);
      } else if (cleaned.startsWith('0') && cleaned.length === 11 && /^[6-9]/.test(cleaned.slice(1))) {
        cleaned = cleaned.slice(1);
      }
      identifierClean = cleaned;
    }

    const user = mode === 'mobile'
      ? db.getUserByMobile(identifierClean)
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
