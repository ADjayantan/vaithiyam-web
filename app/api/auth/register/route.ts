import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      fullName: string;
      mobile:   string;
      email?:   string;
      password: string;
    };

    const mobile = body.mobile?.replace(/\D/g, '');
    if (!body.fullName || !mobile || !body.password) {
      return NextResponse.json({ message: 'அனைத்து தகவல்களும் தேவை.' }, { status: 400 });
    }

    if (mobile.length !== 10) {
      return NextResponse.json({ message: 'தவறான மொபைல் எண்.' }, { status: 400 });
    }

    if (db.getUserByMobile(mobile)) {
      return NextResponse.json(
        { message: 'மொபைல் ஏற்கனவே பதிவாகியுள்ளது.' },
        { status: 409 }
      );
    }

    // Generate mock OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const userId = `usr_${Date.now()}`;
    const user = {
      id:        userId,
      name:      body.fullName.trim(),
      mobile,
      email:     body.email?.toLowerCase().trim() ?? '',
      password:  body.password,
      role:      'customer' as const,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
      createdAt: new Date().toISOString(),
    };

    db.users.set(userId, user);

    // In dev: log OTP to console
    console.log(`[Iyarkai Nala] OTP for ${mobile}: ${otp}`);

    return NextResponse.json({
      message: `OTP ${mobile}-க்கு அனுப்பப்பட்டது.`,
    });
  } catch {
    return NextResponse.json({ message: 'சர்வர் பிழை.' }, { status: 500 });
  }
}
