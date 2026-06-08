import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { mobile?: string };
  const mobile = body.mobile?.replace(/\D/g, '');

  if (!mobile || mobile.length !== 10) {
    return NextResponse.json({ message: 'தவறான மொபைல் எண்.' }, { status: 400 });
  }

  const user = db.getUserByMobile(mobile);
  if (!user) {
    return NextResponse.json({ message: 'பயனர் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  db.users.set(user.id, {
    ...user,
    otp,
    otpExpiry: Date.now() + 10 * 60 * 1000,
  });

  console.log(`[Vaithiyam] Resent OTP for ${mobile}: ${otp}`);
  return NextResponse.json({ message: `OTP மீண்டும் அனுப்பப்பட்டது. (Dev: ${otp})` });
}
