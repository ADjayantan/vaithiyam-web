/**
 * stores/cartStore.ts
 * Zustand cart store — persists to localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export type { CartItem } from '../types/order';
import type { CartItem } from '../types/order';

interface CartTotals {
  subtotal:    number;
  deliveryFee: number;
  total:       number;
  itemCount:   number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  setItems:    (items: CartItem[]) => void;
  setLoading:  (isLoading: boolean) => void;
  addItem:    (item: Omit<CartItem, 'id'>) => void;
  removeItem: (productId: string) => void;
  updateQty:  (productId: string, qty: number) => void;
  clearCart:  () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      setItems(items) {
        set({ items });
      },

      setLoading(isLoading) {
        set({ isLoading });
      },

      addItem(item) {
        set((state) => {
          const existing = state.items.find(i => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.productId === item.productId
                  ? { ...i, qty: i.qty + item.qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, id: uid() }] };
        });
      },

      removeItem(productId) {
        set(state => ({ items: state.items.filter(i => i.productId !== productId) }));
      },

      updateQty(productId, qty) {
        if (qty <= 0) {
          get().removeItem(productId);
        } else {
          set(state => ({
            items: state.items.map(i =>
              i.productId === productId ? { ...i, qty } : i
            ),
          }));
        }
      },

      clearCart() {
        set({ items: [] });
      },
    }),
    {
      name: 'vt-cart-storage',
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export function selectItems(state: CartState): CartItem[] {
  return state.items;
}

export function selectTotals(state: CartState): CartTotals & { discount: number; couponDiscount: number; savings: number } {
  const subtotal    = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  return {
    subtotal,
    deliveryFee,
    total:          subtotal + deliveryFee,
    itemCount:      state.items.reduce((s, i) => s + i.qty, 0),
    discount:       0,
    couponDiscount: 0,
    savings:        0,
  };
}

export interface AppliedCoupon {
  code:     string;
  discount: number;
}

// Extended totals with coupon support
export interface CartTotalsExtended extends CartTotals {
  discount:       number;
  couponDiscount: number;
  savings:        number;
  coupon?:        AppliedCoupon;
}

export function selectAppliedCoupon(): AppliedCoupon | null {
  return null; // coupon feature not yet implemented
}
