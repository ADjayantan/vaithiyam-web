import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      fullName: string;
      mobile:   string;
      email?:   string;
      password: string;
    };

    let mobile = body.mobile?.replace(/\D/g, '') ?? '';
    if (mobile.startsWith('91') && mobile.length === 12 && /^[6-9]/.test(mobile.slice(2))) {
      mobile = mobile.slice(2);
    } else if (mobile.startsWith('0') && mobile.length === 11 && /^[6-9]/.test(mobile.slice(1))) {
      mobile = mobile.slice(1);
    }

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

    // Send verification email if email is provided
    if (user.email) {
      sendOtpEmail(user.email, otp, user.name).catch((err) => {
        console.error('Failed to send registration OTP email:', err);
      });
    }

    // In dev: log OTP to console
    console.log(`[Iyarkai Nala] OTP for ${mobile}: ${otp}`);

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json({
      message: `OTP ${mobile}-க்கு அனுப்பப்பட்டது.${isDev ? ` (Dev: ${otp})` : ''}`,
    });
  } catch {
    return NextResponse.json({ message: 'சர்வர் பிழை.' }, { status: 500 });
  }
}
