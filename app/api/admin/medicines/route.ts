import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { addProduct } from '@/lib/db/products';
import { MEDICINE_CATEGORIES } from '@/lib/medicineData';

export async function POST(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  try {
    const body = await req.json();

    const {
      nameTa,
      nameEn,
      categorySlug,
      tradition,
      price,
      mrp,
      stockCount,
      inStock,
      prescriptionRequired,
      imageUrl,
      overview,
      ingredients,
      generalUses,
      safetyNotes,
    } = body;

    if (!nameTa || !nameEn || !categorySlug || !tradition || price === undefined || mrp === undefined || stockCount === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!['siddha', 'ayurveda', 'natural'].includes(tradition)) {
      return NextResponse.json({ message: 'Invalid tradition' }, { status: 400 });
    }

    const categoryInfo = MEDICINE_CATEGORIES.find(c => c.slug === categorySlug);
    if (!categoryInfo) {
      return NextResponse.json({ message: 'Invalid categorySlug' }, { status: 400 });
    }

    const artTones = ['emerald', 'teal', 'gold', 'cyan', 'leaf', 'coral'] as const;
    const artTone = artTones[Math.floor(Math.random() * artTones.length)];

    const product = await addProduct({
      nameTa,
      nameEn,
      categorySlug,
      tradition,
      price: Number(price),
      mrp: Number(mrp),
      stockCount: Number(stockCount),
      inStock: Boolean(inStock),
      prescriptionRequired: Boolean(prescriptionRequired),
      imageUrl: imageUrl || undefined,
      artTone,
      overview: overview || '',
      ingredients: ingredients || '',
      generalUses: generalUses || '',
      safetyNotes: safetyNotes || '',
      faqs: [
        {
          question: 'Can I use this without advice?',
          answer: 'This page is educational only. Please consult a qualified doctor or pharmacist before use.',
        },
        {
          question: 'Does Vaithiyam provide dosage guidance?',
          answer: 'No. Vaithiyam does not provide diagnosis, dosage, or self-medication recommendations.',
        },
      ],
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
