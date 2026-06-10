import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string || `prod_${Date.now()}`;

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
    const filename = `${slug}${ext}`;

    const supabase = getSupabaseServiceClient();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filename);

      return NextResponse.json({ imageUrl: publicUrl });
    } else {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      await fs.mkdir(uploadDir, { recursive: true });

      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);

      const imageUrl = `/uploads/products/${filename}`;
      return NextResponse.json({ imageUrl });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
