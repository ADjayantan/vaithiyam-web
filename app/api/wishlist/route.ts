import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';
import { verifyToken, extractBearerToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url   = new URL(req.url);
  const page  = parseInt(url.searchParams.get('page')  ?? '1', 10);
  const limit = parseInt(url.searchParams.get('limit') ?? '10', 10);

  const result = db.getWishlistForUser(payload.sub, page, limit);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { productId?: string };
  const product = db.products.find((item) => item.id === body.productId || item.slug === body.productId);
  if (!product) {
    return NextResponse.json({ message: 'பொருள் கண்டுபிடிக்கவில்லை.' }, { status: 404 });
  }

  const existing = db.getWishlistForUser(payload.sub, 1, 500).items.find((item) => item.productId === product.id);
  if (existing) {
    return NextResponse.json({ item: existing, message: 'ஏற்கனவே விருப்பப்பட்டியலில் உள்ளது.' });
  }

  const item = {
    id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: payload.sub,
    productId: product.id,
    slug: product.slug,
    nameTa: product.nameTa,
    nameEn: product.nameEn,
    imageUrl: product.imageUrl,
    tradition: product.tradition,
    price: product.price,
    mrp: product.mrp,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
    stockCount: product.stockCount,
    addedAt: new Date().toISOString(),
    prescriptionRequired: product.prescriptionRequired,
  };
  db.wishlist.set(item.id, item);

  return NextResponse.json({ item, message: 'விருப்பப்பட்டியலில் சேர்க்கப்பட்டது.' }, { status: 201 });
}
