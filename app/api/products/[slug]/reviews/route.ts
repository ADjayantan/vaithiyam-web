import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { db } from '@/lib/mockDb';
import { getProductBySlug } from '@/lib/db/products';

type Ctx = { params: Promise<{ slug: string }> };

/* ─── GET /api/products/[slug]/reviews ─────────────────────────────────── */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ message: 'Product not found.' }, { status: 404 });

  const reviews = db.reviews
    .filter(r => r.productId === product.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.rating;

  const dist = [5,4,3,2,1].map(n => ({
    stars: n,
    count: reviews.filter(r => r.rating === n).length,
  }));

  return NextResponse.json({ reviews, average: +avg.toFixed(1), count: reviews.length, distribution: dist });
}

/* ─── POST /api/products/[slug]/reviews ────────────────────────────────── */
export async function POST(req: NextRequest, { params }: Ctx) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ message: 'Product not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    rating?: number; title?: string; body?: string;
  };

  const rating = Number(body.rating);
  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ message: 'Rating must be 1–5.' }, { status: 400 });
  const title = String(body.title ?? '').trim().slice(0, 120);
  const text  = String(body.body  ?? '').trim().slice(0, 1200);
  if (text.length < 10)
    return NextResponse.json({ message: 'Review must be at least 10 characters.' }, { status: 400 });

  const user = db.getUserById(userId);
  const review = {
    id:        `rev_${Date.now()}`,
    productId: product.id,
    userId,
    userName:  user?.name ?? 'Customer',
    rating,
    title:     title || 'Review',
    body:      text,
    createdAt: new Date().toISOString(),
  };
  db.reviews.push(review);

  return NextResponse.json({ review }, { status: 201 });
}
