import { NextRequest, NextResponse } from 'next/server';
import { db, type DbOrder } from '@/lib/mockDb';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { toOrderHistorySummary } from '@/lib/orderDto';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const url    = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;
  const search = url.searchParams.get('search') ?? url.searchParams.get('query') ?? undefined;
  const page   = parseInt(url.searchParams.get('page')  ?? '1', 10);
  const limit  = parseInt(url.searchParams.get('limit') ?? '10', 10);

  const all   = db.getOrdersForUser(userId, { status, search });
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);

  return NextResponse.json({
    orders: items.map(toOrderHistorySummary),
    total: all.length,
    hasMore: start + items.length < all.length,
  });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json() as {
    addressId:     string;
    paymentMethod: string;
    upiId?:        string;
    notes?:        string;
    prescriptionStatus?: 'not_required' | 'pending_review' | 'approved';
  };

  const cartItems = db.getCartForUser(userId);
  if (cartItems.length === 0) {
    return NextResponse.json({ message: 'கூடை காலியாக உள்ளது.' }, { status: 400 });
  }

  const address = db.addresses.get(body.addressId);
  if (!address || address.userId !== userId) {
    return NextResponse.json({ message: 'டெலிவரி முகவரி தேர்வு செய்யவும்.' }, { status: 400 });
  }

  const needsPrescription = cartItems.some((cartItem) => cartItem.requiresPrescription);

  const reviewedPrescription = db.getPrescriptionsForUser(userId).find((prescription) =>
    prescription.status === 'pending_review' || prescription.status === 'approved'
  );

  if (needsPrescription && !reviewedPrescription && body.prescriptionStatus !== 'pending_review') {
    return NextResponse.json(
      { message: 'Prescription-required products need an uploaded prescription or pending verification before order placement.' },
      { status: 400 },
    );
  }

  const subtotal    = cartItems.reduce((s, c) => s + c.price * c.qty, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const orderId     = `VT${Date.now()}`;
  const prescriptionStatus: DbOrder['prescriptionStatus'] = needsPrescription
    ? reviewedPrescription?.status ?? 'pending_review'
    : 'not_required';

  const order: DbOrder = {
    id:            orderId,
    userId,
    status:        needsPrescription ? 'pending' as const : 'confirmed' as const,
    items:         cartItems,
    subtotal,
    deliveryFee,
    total:         subtotal + deliveryFee,
    addressId:     body.addressId,
    paymentMethod: body.paymentMethod,
    prescriptionStatus,
    notes:         body.notes,
    createdAt:     new Date().toISOString(),
    updatedAt:     new Date().toISOString(),
  };

  db.orders.set(orderId, order);

  // Clear cart after order
  for (const item of cartItems) {
    db.cart.delete(item.id);
  }

  // Send order confirmation email
  const user = db.getUserById(userId);
  if (user && user.email) {
    sendOrderConfirmationEmail(user.email, orderId, order.total, order.items, user.name).catch((err) => {
      console.error('Failed to send order confirmation email:', err);
    });
  }

  return NextResponse.json({ orderId }, { status: 201 });
}
