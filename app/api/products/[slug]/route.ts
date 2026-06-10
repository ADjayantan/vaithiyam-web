import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/db/products';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ message: 'பொருள் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  return NextResponse.json({ product });
}
