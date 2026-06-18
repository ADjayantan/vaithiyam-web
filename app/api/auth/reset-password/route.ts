import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, identifier, otp, password } = body;

    if (!identifier) {
      return NextResponse.json({ message: 'Identifier (email or mobile) is required.' }, { status: 400 });
    }

    const isEmail = identifier.includes('@');
    const cleanedMobile = identifier.replace(/\D/g, '');

    const user = isEmail
      ? db.getUserByEmail(identifier)
      : db.getUserByMobile(cleanedMobile);

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    if (step === 'request') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      db.users.set(user.id, {
        ...user,
        otp: generatedOtp,
        otpExpiry: Date.now() + 10 * 60 * 1000,
      });

      console.log(`[Iyarkai Nala Reset Password] OTP generated for ${identifier}: ${generatedOtp}`);
      // Return success but do not return OTP in body for security
      return NextResponse.json({ success: true, message: 'OTP sent successfully.' });
    }

    if (step === 'verify') {
      if (!otp) {
        return NextResponse.json({ message: 'OTP is required.' }, { status: 400 });
      }

      if (!user.otp || user.otp !== otp) {
        return NextResponse.json({ message: 'Invalid OTP.' }, { status: 401 });
      }

      if (user.otpExpiry && Date.now() > user.otpExpiry) {
        return NextResponse.json({ message: 'OTP expired.' }, { status: 401 });
      }

      return NextResponse.json({ success: true, message: 'OTP verified successfully.' });
    }

    if (step === 'reset') {
      if (!otp) {
        return NextResponse.json({ message: 'OTP is required.' }, { status: 400 });
      }

      if (!user.otp || user.otp !== otp) {
        return NextResponse.json({ message: 'Invalid OTP verification.' }, { status: 401 });
      }

      if (user.otpExpiry && Date.now() > user.otpExpiry) {
        return NextResponse.json({ message: 'OTP expired.' }, { status: 401 });
      }

      if (!password || password.length < 8) {
        return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
      }

      // Update password
      db.users.set(user.id, {
        ...user,
        password, // note: fallback plaintext comparison in mockDb, but we clear OTP
        otp: undefined,
        otpExpiry: undefined,
      });

      console.log(`[Iyarkai Nala Reset Password] Password successfully reset for ${identifier}`);
      return NextResponse.json({ success: true, message: 'Password reset successful.' });
    }

    return NextResponse.json({ message: 'Invalid step.' }, { status: 400 });
  } catch (error) {
    console.error('Error in reset-password endpoint:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
