/**
 * types/order.ts
 * Shared order & payment types (replaces @vaithiyam/shared monorepo package).
 */

export type PaymentMethod = 'razorpay' | 'upi' | 'cod' | 'card' | 'netbanking';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface CartItem {
  id:                    string;
  productId:             string;
  nameTa:                string;
  nameEn:                string;
  imageUrl?:             string;
  price:                 number;
  qty:                   number;
  // Optional extended fields (used by OrderReview)
  mrp?:                  number;
  variantId?:            string;
  isSubscription?:       boolean;
  subscriptionPrice?:    number;
  subscriptionFrequency?: string;
  requiresPrescription?: boolean;
}

export interface OrderItem extends CartItem {
  subtotal: number;
}

export interface ShippingAddress {
  id:      string;
  label:   string;
  line1:   string;
  line2?:  string;
  city:    string;
  state:   string;
  pincode: string;
}

export interface OrderData {
  id:             string;
  status:         OrderStatus;
  items:          OrderItem[];
  subtotal:       number;
  deliveryFee:    number;
  total:          number;
  address:        ShippingAddress;
  paymentMethod:  PaymentMethod;
  notes?:         string;
  createdAt:      string;
  updatedAt:      string;
}
