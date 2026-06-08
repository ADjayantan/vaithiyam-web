'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBagShopping, faBoxOpen, faMinus, faPlus, faShieldHalved, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import type { CartItem } from '@/types/order';
import { useCartStore } from '@/stores/cartStore';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';
import { MedicineArt } from '@/components/ui/MedicineArt';
import { ButtonLink } from '@/components/ui/Button';

interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  discount: number;
  savings: number;
}

interface CartSnapshot {
  items: CartItem[];
  totals: CartTotals;
  cartItemCount: number;
}

const emptyTotals: CartTotals = {
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
  itemCount: 0,
  discount: 0,
  savings: 0,
};

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export default function CartPage() {
  const router = useRouter();
  const setStoreItems = useCartStore((state) => state.setItems);
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals>(emptyTotals);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const applySnapshot = useCallback((snapshot: CartSnapshot) => {
    setItems(snapshot.items);
    setTotals(snapshot.totals);
    setStoreItems(snapshot.items);
  }, [setStoreItems]);

  const loadCart = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/auth/login?next=/cart');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cart', { headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/auth/login?next=/cart');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Cart could not be loaded.');
      }
      applySnapshot(await res.json() as CartSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cart could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [applySnapshot, router]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const updateQty = useCallback(async (itemId: string, qty: number) => {
    setBusyItemId(itemId);
    setError('');
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ itemId, qty }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Cart could not be updated.');
      }
      applySnapshot(await res.json() as CartSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cart could not be updated.');
    } finally {
      setBusyItemId(null);
    }
  }, [applySnapshot]);

  const removeItem = useCallback(async (itemId: string) => {
    setBusyItemId(itemId);
    setError('');
    try {
      const res = await fetch(`/api/cart?itemId=${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Cart item could not be removed.');
      }
      applySnapshot(await res.json() as CartSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cart item could not be removed.');
    } finally {
      setBusyItemId(null);
    }
  }, [applySnapshot]);

  const freeDeliveryProgress = useMemo(() => Math.min(100, Math.round((totals.subtotal / 500) * 100)), [totals.subtotal]);
  const deliveryHint = totals.subtotal > 0 && totals.subtotal < 500 ? 500 - totals.subtotal : 0;
  const hasPrescriptionItems = items.some((item) => item.requiresPrescription);

  if (loading) {
    return (
      <div className="vt-page-shell">
        <CustomerHeader />
        <main className="vt-container" style={{ padding: '30px 0' }}>
          <div className="vt-skeleton" style={{ height: 420 }} />
        </main>
      </div>
    );
  }

  return (
    <div className="vt-page-shell">
      <CustomerHeader cartCount={totals.itemCount} />
      <main className="vt-container" style={{ padding: '30px 0 0' }}>
        <div className="vt-section-heading">
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--vt-forest-950)' }}>My cart</h1>
            <p>{totals.itemCount} items ready for verified checkout.</p>
          </div>
          <ButtonLink href="/products" variant="ghost">Continue shopping</ButtonLink>
        </div>

        {error && (
          <div role="alert" className="vt-safe-note" style={{ borderColor: 'rgba(198,91,71,0.28)', background: 'rgba(198,91,71,0.08)', color: 'var(--vt-coral-600)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <section className="vt-card vt-empty-state">
            <FontAwesomeIcon icon={faBoxOpen} style={{width: 56, height: 56, color: "var(--vt-emerald-600)"}} />
            <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)' }}>Your cart is empty</h2>
            <p className="vt-muted" style={{ margin: 0, maxWidth: 520 }}>Browse verified traditional medicines and add safe educational products to your cart.</p>
            <ButtonLink href="/products"><FontAwesomeIcon icon={faBagShopping} style={{width: 18, height: 18}} /> Shop medicines</ButtonLink>
          </section>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map((item) => (
                <article key={item.id} className="vt-card vt-card-solid" style={{ padding: 14, display: 'grid', gridTemplateColumns: '104px minmax(0, 1fr)', gap: 14, alignItems: 'center' }}>
                  <div style={{ borderRadius: 16, overflow: 'hidden' }}>
                    <MedicineArt product={{ nameEn: item.nameEn, prescriptionRequired: item.requiresPrescription }} compact />
                  </div>
                  <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <h2 style={{ margin: 0, color: 'var(--vt-forest-950)', fontFamily: 'var(--vt-font-display)', lineHeight: 1.2 }}>{item.nameTa}</h2>
                        <p className="vt-muted" style={{ margin: '3px 0 0' }}>{item.nameEn}</p>
                      </div>
                      {item.requiresPrescription && <span className="vt-badge vt-badge-danger">Rx</span>}
                    </div>
                    <div className="vt-price-row">
                      <span className="vt-price">₹{item.price}</span>
                      {item.mrp && <span className="vt-mrp">₹{item.mrp}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="vt-icon-button" type="button" disabled={busyItemId === item.id || item.qty <= 1} onClick={() => void updateQty(item.id, item.qty - 1)} aria-label={`Decrease ${item.nameEn}`} style={{ color: 'var(--vt-forest-800)', background: 'var(--vt-cream-50)', borderColor: 'var(--vt-border)' }}>
                        <FontAwesomeIcon icon={faMinus} style={{width: 16, height: 16}} />
                      </button>
                      <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 900 }}>{item.qty}</span>
                      <button className="vt-icon-button" type="button" disabled={busyItemId === item.id} onClick={() => void updateQty(item.id, item.qty + 1)} aria-label={`Increase ${item.nameEn}`} style={{ color: 'var(--vt-forest-800)', background: 'var(--vt-cream-50)', borderColor: 'var(--vt-border)' }}>
                        <FontAwesomeIcon icon={faPlus} style={{width: 16, height: 16}} />
                      </button>
                      <button className="vt-button vt-button-danger" type="button" disabled={busyItemId === item.id} onClick={() => void removeItem(item.id)} style={{ marginLeft: 'auto', minHeight: 38 }}>
                        <FontAwesomeIcon icon={faTrashCan} style={{width: 16, height: 16}} /> Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="vt-card" style={{ padding: 18 }}>
              <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--vt-font-display)' }}>Price summary</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                <SummaryRow label={`Subtotal (${totals.itemCount} items)`} value={`₹${totals.subtotal}`} />
                {totals.discount > 0 && <SummaryRow label="Savings" value={`-₹${totals.discount}`} accent />}
                <SummaryRow label="Delivery" value={totals.deliveryFee === 0 ? 'Free' : `₹${totals.deliveryFee}`} accent={totals.deliveryFee === 0} />
                <div style={{ height: 1, background: 'var(--vt-border)' }} />
                <SummaryRow label="Total" value={`₹${totals.total}`} strong />
                <div style={{ display: 'grid', gap: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--vt-muted)', fontSize: '0.9rem' }}>
                    <span>Free delivery progress</span>
                    <span>{freeDeliveryProgress}%</span>
                  </div>
                  <div style={{ height: 9, borderRadius: 999, background: 'rgba(20,60,43,0.1)', overflow: 'hidden' }}>
                    <div style={{ width: `${freeDeliveryProgress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(135deg, var(--vt-emerald-600), var(--vt-teal-500))' }} />
                  </div>
                  {deliveryHint > 0 && <p className="vt-muted" style={{ margin: 0 }}>Add ₹{deliveryHint} more for free delivery.</p>}
                </div>
                {hasPrescriptionItems && (
                  <div className="vt-safe-note">
                    <FontAwesomeIcon icon={faShieldHalved} style={{width: 19, height: 19}} />
                    <span>Your cart includes prescription-required products. Checkout will require upload or pending verification.</span>
                  </div>
                )}
                <Link className="vt-button vt-button-primary" href="/checkout" style={{ marginTop: 6 }}>
                  Checkout <FontAwesomeIcon icon={faArrowRight} style={{width: 18, height: 18}} />
                </Link>
              </div>
            </aside>
          </section>
        )}
      </main>
      <CustomerFooter />
      <MobileBottomNav />
    </div>
  );
}

function SummaryRow({ label, value, strong = false, accent = false }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
      <span className="vt-muted">{label}</span>
      <strong style={{ color: accent ? 'var(--vt-emerald-600)' : 'var(--vt-forest-950)', fontFamily: strong ? 'var(--vt-font-serif)' : 'inherit', fontSize: strong ? '1.55rem' : '1rem' }}>{value}</strong>
    </div>
  );
}
