import { NextResponse } from 'next/server';
import { MEDICINE_CATEGORIES } from '@/lib/medicineData';

export async function GET() {
  return NextResponse.json({ categories: MEDICINE_CATEGORIES });
}
