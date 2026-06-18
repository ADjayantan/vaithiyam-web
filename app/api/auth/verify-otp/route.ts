import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { mobile: string; otp: string };
    let mobile = body.mobile?.replace(/\D/g, '') ?? '';
    if (mobile.startsWith('91') && mobile.length === 12 && /^[6-9]/.test(mobile.slice(2))) {
      mobile = mobile.slice(2);
    } else if (mobile.startsWith('0') && mobile.length === 11 && /^[6-9]/.test(mobile.slice(1))) {
      mobile = mobile.slice(1);
    }

    const user = db.getUserByMobile(mobile);
    if (!user) {
      return NextResponse.json({ message: 'பயனர் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
    }

    if (!user.otp || user.otp !== body.otp) {
      return NextResponse.json({ message: 'தவறான OTP.' }, { status: 401 });
    }

    if (user.otpExpiry && Date.now() > user.otpExpiry) {
      return NextResponse.json({ message: 'OTP காலாவதியாகிவிட்டது.' }, { status: 401 });
    }

    // Clear OTP
    const updated = { ...user, otp: undefined, otpExpiry: undefined };
    db.users.set(user.id, updated);

    const token = await signToken({ sub: user.id, name: user.name, role: user.role });
    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role },
    });
  } catch {
    return NextResponse.json({ message: 'சர்வர் பிழை.' }, { status: 500 });
  }
}
