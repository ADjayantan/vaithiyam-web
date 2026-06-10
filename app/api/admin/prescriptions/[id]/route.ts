import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { db } from '@/lib/mockDb';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  const { id } = await context.params;
  const prescription = db.prescriptions.get(id);
  if (!prescription) {
    return NextResponse.json({ message: 'Prescription not found' }, { status: 404 });
  }

  try {
    const { status, notes } = await req.json() as { status: string; notes?: string };
    if (!['pending_review', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    prescription.status = status as 'pending_review' | 'approved' | 'rejected';
    if (notes !== undefined) {
      prescription.notes = notes;
    }
    db.prescriptions.set(id, prescription);

    return NextResponse.json({ message: 'Prescription updated successfully', prescription });
  } catch {
    return NextResponse.json({ message: 'Error updating prescription' }, { status: 500 });
  }
}
