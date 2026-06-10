import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const user = db.getUserById(payload.sub);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size must be less than 2MB' }, { status: 400 });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ message: 'Only JPEG, PNG, and WEBP files are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.png';
    const filename = `${user.id}_${Date.now()}${ext}`;

    const supabase = getSupabaseServiceClient();
    let photoUrl = '';

    if (supabase) {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error for avatar:', error);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filename);
        photoUrl = publicUrl;
      }
    }

    if (!photoUrl) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
      await fs.mkdir(uploadDir, { recursive: true });

      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);

      photoUrl = `/uploads/profiles/${filename}`;
    }

    const updated = { ...user, photoUrl };
    db.users.set(user.id, updated);

    // Also update in Supabase profiles table if Supabase is connected
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ photo_url: photoUrl })
        .eq('id', user.id);
      if (error) {
        console.error('Failed to update profile photo_url in Supabase:', error);
      }
    }

    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
