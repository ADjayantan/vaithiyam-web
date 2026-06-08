import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = db.products.find((item) => item.slug === slug || item.id === slug);

  if (!product) {
    return NextResponse.json({ message: 'பொருள் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  return NextResponse.json({ product });
}
