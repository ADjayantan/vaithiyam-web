import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mockDb';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tradition = url.searchParams.get('tradition');
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search')?.trim().toLowerCase();
  const inStock = url.searchParams.get('inStock');
  const prescriptionRequired = url.searchParams.get('prescriptionRequired');
  const sort = url.searchParams.get('sort') ?? 'newest';
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = parseInt(url.searchParams.get('limit') ?? '24', 10);

  let products = [...db.products];

  if (tradition && tradition !== 'all') {
    products = products.filter((product) => product.tradition === tradition);
  }

  if (category && category !== 'all') {
    products = products.filter((product) => product.categorySlug === category);
  }

  if (inStock === 'true') {
    products = products.filter((product) => product.inStock);
  }

  if (prescriptionRequired === 'true') {
    products = products.filter((product) => product.prescriptionRequired);
  } else if (prescriptionRequired === 'false') {
    products = products.filter((product) => !product.prescriptionRequired);
  }

  if (search) {
    products = products.filter((product) =>
      product.nameTa.includes(search) ||
      product.nameEn.toLowerCase().includes(search) ||
      product.slug.includes(search) ||
      product.categoryNameEn.toLowerCase().includes(search) ||
      product.categoryNameTa.includes(search) ||
      product.tradition.includes(search)
    );
  }

  products.sort((a, b) => {
    if (sort === 'price-low') return a.price - b.price;
    if (sort === 'price-high') return b.price - a.price;
    if (sort === 'rating') return b.rating - a.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const total = products.length;
  const start = (page - 1) * limit;
  const items = products.slice(start, start + limit);

  return NextResponse.json({
    products: items,
    total,
    hasMore: start + items.length < total,
  });
}
