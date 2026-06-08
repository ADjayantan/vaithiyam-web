/**
 * lib/order.ts
 * Client-side helper to place an order via /api/orders.
 */

function getToken(): string | null {
  try {
    return (
      localStorage.getItem('vt_token') ??
      sessionStorage.getItem('vt_token')
    );
  } catch { return null; }
}

function authHeaders(): HeadersInit {
  const tok = getToken();
  return tok
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }
    : { 'Content-Type': 'application/json' };
}

export type PaymentMethod = 'razorpay' | 'upi' | 'cod' | 'card' | 'netbanking';

interface PlaceOrderParams {
  addressId:     string;
  paymentMethod: PaymentMethod;
  upiId?:        string;
  notes?:        string;
  prescriptionStatus?: 'not_required' | 'pending_review' | 'approved';
}

export async function placeOrder(params: PlaceOrderParams): Promise<{ orderId: string }> {
  const res = await fetch('/api/orders', {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(params),
  });

  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'ஆர்டர் வைக்க தோல்வி. மீண்டும் முயற்சிக்கவும்.');
  }

  return res.json() as Promise<{ orderId: string }>;
}
