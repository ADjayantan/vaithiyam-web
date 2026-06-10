import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size must be less than 2MB' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Only JPEG, PNG, WEBP, and PDF files are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.png';
    const filename = `rx_${userId}_${Date.now()}${ext}`;

    const supabase = getSupabaseServiceClient();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(filename);

      return NextResponse.json({ fileUrl: publicUrl });
    } else {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'prescriptions');
      await fs.mkdir(uploadDir, { recursive: true });

      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);

      const fileUrl = `/uploads/prescriptions/${filename}`;
      return NextResponse.json({ fileUrl });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
