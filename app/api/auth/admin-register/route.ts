import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      fullName: string;
      email:    string;
      password: string;
    };

    const { fullName, email, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'அனைத்து தகவல்களும் தேவை.' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    if (db.getUserByEmail(trimmedEmail)) {
      return NextResponse.json(
        { message: 'மின்னஞ்சல் ஏற்கனவே பதிவாகியுள்ளது.' },
        { status: 409 }
      );
    }

    const userId = `usr_admin_${Date.now()}`;
    const user = {
      id:        userId,
      name:      fullName.trim(),
      mobile:    '9' + Math.floor(100000000 + Math.random() * 900000000).toString(), // mock mobile
      email:     trimmedEmail,
      password,
      role:      'admin' as const,
      createdAt: new Date().toISOString(),
    };

    db.users.set(userId, user);

    return NextResponse.json({
      message: 'நிர்வாக கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! ✓',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'சர்வர் பிழை.' }, { status: 500 });
  }
}
