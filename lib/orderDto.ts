import { db, type DbOrder } from '@/lib/mockDb';

type UiOrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

type UiPaymentMethod = 'upi' | 'cod' | 'razorpay';

const STATUS_ORDER: UiOrderStatus[] = [
  'placed',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

function mapStatus(status: DbOrder['status']): UiOrderStatus {
  if (status === 'pending') return 'placed';
  if (status === 'processing') return 'packed';
  return status;
}

function mapPaymentMethod(method: string): UiPaymentMethod {
  if (method === 'cod') return 'cod';
  if (method === 'upi') return 'upi';
  return 'razorpay';
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function buildStatusHistory(order: DbOrder, currentStatus: UiOrderStatus) {
  if (currentStatus === 'cancelled') {
    return [
      { status: 'placed' as const, timestamp: order.createdAt, note: 'ஆர்டர் பதிவு செய்யப்பட்டது' },
      { status: 'cancelled' as const, timestamp: order.updatedAt, note: 'ஆர்டர் ரத்து செய்யப்பட்டது' },
    ];
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  return STATUS_ORDER.slice(0, currentIndex + 1).map((status, index) => ({
    status,
    timestamp: addDays(order.createdAt, index),
  }));
}

export function toOrderData(order: DbOrder) {
  const user = db.getUserById(order.userId);
  const address = db.addresses.get(order.addressId);

  const items = order.items.map((item) => {
    const product = db.products.find((candidate) => candidate.id === item.productId);
    return {
      productId: item.productId,
      nameTa: item.nameTa,
      nameEn: item.nameEn,
      imageUrl: item.imageUrl,
      qty: item.qty,
      price: item.price,
      mrp: product?.mrp ?? item.price,
      lineTotal: item.price * item.qty,
      requiresPrescription: product?.prescriptionRequired ?? false,
    };
  });

  const mrpTotal = items.reduce((sum, item) => sum + item.mrp * item.qty, 0);
  const discount = Math.max(0, mrpTotal - order.subtotal);
  const status = mapStatus(order.status);

  return {
    orderId: order.id,
    placedAt: order.createdAt,
    status,
    paymentMethod: mapPaymentMethod(order.paymentMethod),
    items,
    address: {
      name: user?.name ?? 'Vaithiyam Customer',
      phone: user?.mobile ?? '9876543210',
      line1: address?.line1 ?? 'முகவரி கிடைக்கவில்லை',
      line2: address?.line2,
      city: address?.city ?? '',
      state: address?.state ?? '',
      pincode: address?.pincode ?? '',
    },
    subtotal: order.subtotal,
    discount,
    couponDiscount: 0,
    deliveryFee: order.deliveryFee,
    total: order.total,
    savings: discount,
    estimatedDelivery: status === 'delivered' || status === 'cancelled'
      ? undefined
      : addDays(order.createdAt, 5),
    notes: order.notes,
    statusHistory: buildStatusHistory(order, status),
  };
}

export function toOrderHistorySummary(order: DbOrder) {
  const dto = toOrderData(order);

  return {
    orderId: dto.orderId,
    placedAt: dto.placedAt,
    status: dto.status,
    items: dto.items.map((item) => ({
      productId: item.productId,
      nameTa: item.nameTa,
      nameEn: item.nameEn,
      imageUrl: item.imageUrl,
      qty: item.qty,
      price: item.price,
    })),
    total: dto.total,
  };
}

export function matchesHistoryStatus(order: DbOrder, filter: string | null): boolean {
  if (!filter || filter === 'all') return true;
  const status = mapStatus(order.status);

  if (filter === 'active') {
    return ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(status);
  }

  return status === filter;
}

export function matchesTimeRange(order: DbOrder, range: string | null): boolean {
  if (!range) return true;

  const now = Date.now();
  const placed = new Date(order.createdAt).getTime();
  const days = range === '3m' ? 90 : range === '6m' ? 180 : range === '1y' ? 365 : 30;

  return now - placed <= days * 24 * 60 * 60 * 1000;
}
