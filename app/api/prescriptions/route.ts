import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { db } from '@/lib/mockDb';

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  return NextResponse.json({ prescriptions: db.getPrescriptionsForUser(userId) });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json() as {
    fileName?: string;
    fileType?: string;
    fileUrl?: string;
    notes?: string;
  };

  if (!body.fileName) {
    return NextResponse.json({ message: 'Prescription file name is required.' }, { status: 400 });
  }

  const prescription = db.addPrescription({
    userId,
    fileName: body.fileName,
    fileType: body.fileType ?? 'unknown',
    fileUrl: body.fileUrl,
    status: 'pending_review',
    notes: body.notes,
  });

  return NextResponse.json({ prescription }, { status: 201 });
}
