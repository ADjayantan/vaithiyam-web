import { db, type DbCartItem } from '@/lib/mockDb';
import type { CartItem } from '@/types/order';
import { listProducts } from '@/lib/db/products';

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  discount: number;
  couponDiscount: number;
  savings: number;
}

export interface CartSnapshot {
  items: CartItem[];
  totals: CartTotals;
  cartItemCount: number;
}

export function toCartItem(item: DbCartItem): CartItem {
  return {
    id: item.id,
    productId: item.productId,
    nameTa: item.nameTa,
    nameEn: item.nameEn,
    imageUrl: item.imageUrl,
    price: item.price,
    qty: item.qty,
    mrp: item.mrp ?? item.price,
    requiresPrescription: item.requiresPrescription ?? false,
  };
}

export function calculateCartTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const mrpTotal = items.reduce((sum, item) => sum + (item.mrp ?? item.price) * item.qty, 0);
  const deliveryFee = subtotal === 0 || subtotal >= 500 ? 0 : 50;
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const discount = Math.max(0, mrpTotal - subtotal);

  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    itemCount,
    discount,
    couponDiscount: 0,
    savings: discount,
  };
}

export function getCartSnapshot(userId: string): CartSnapshot {
  const items = db.getCartForUser(userId).map(toCartItem);
  const totals = calculateCartTotals(items);

  return {
    items,
    totals,
    cartItemCount: totals.itemCount,
  };
}

export async function addProductToCart(userId: string, productId: string, qty = 1): Promise<DbCartItem | null> {
  const safeQty = Math.max(1, Math.min(99, Math.floor(qty)));
  const products = await listProducts();
  const product = products.find((p) => p.id === productId);
  if (!product || !product.inStock) return null;

  const existing = db.getCartForUser(userId).find((item) => item.productId === productId);
  if (existing) {
    const updated = {
      ...existing,
      qty: Math.min(99, existing.qty + safeQty),
    };
    db.cart.set(existing.id, updated);
    return updated;
  }

  const id = `ci_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item: DbCartItem = {
    id,
    userId,
    productId,
    qty: safeQty,
    price: product.price,
    nameTa: product.nameTa,
    nameEn: product.nameEn,
    imageUrl: product.imageUrl,
    mrp: product.mrp,
    requiresPrescription: product.prescriptionRequired,
  };

  db.cart.set(id, item);
  return item;
}

export function updateCartQuantity(userId: string, itemId: string, qty: number): boolean {
  const existing = db.cart.get(itemId);
  if (!existing || existing.userId !== userId) return false;

  if (qty <= 0) {
    db.cart.delete(itemId);
    return true;
  }

  db.cart.set(itemId, {
    ...existing,
    qty: Math.min(99, Math.floor(qty)),
  });
  return true;
}

export function removeCartItem(userId: string, itemId: string): boolean {
  const existing = db.cart.get(itemId);
  if (!existing || existing.userId !== userId) return false;
  return db.cart.delete(itemId);
}

export function clearCart(userId: string): void {
  for (const item of db.getCartForUser(userId)) {
    db.cart.delete(item.id);
  }
}
