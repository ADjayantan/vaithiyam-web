'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBagShopping, faBoxOpen, faMinus, faPlus, faShieldHalved, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import type { CartItem } from '@/types/order';
import { useCartStore } from '@/stores/cartStore';
import { useLanguageStore } from '@/stores/languageStore';
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
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const setStoreItems = useCartStore((state) => state.setItems);
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals>(emptyTotals);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ta';

  const applySnapshot = useCallback((snapshot: CartSnapshot) => {
    setItems(snapshot.items);
    setTotals(snapshot.totals);
    setStoreItems(snapshot.items);
  }, [setStoreItems]);

  const loadCart = useCallback(async () => {
    const token = getToken();
    if (!token) {
      const guestItems = useCartStore.getState().items;
      setItems(guestItems);
      const guestTotals = guestItems.reduce((s, i) => s + i.price * i.qty, 0);
      const deliveryFee = guestTotals === 0 || guestTotals >= 500 ? 0 : 50;
      setTotals({
        subtotal: guestTotals,
        deliveryFee,
        total: guestTotals + deliveryFee,
        itemCount: guestItems.reduce((s, i) => s + i.qty, 0),
        discount: guestItems.reduce((s, i) => s + ((i.mrp ?? i.price) - i.price) * i.qty, 0),
        savings: guestItems.reduce((s, i) => s + ((i.mrp ?? i.price) - i.price) * i.qty, 0),
      });
      setLoading(false);
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
    const token = getToken();
    if (!token) {
      const cartStore = useCartStore.getState();
      const item = cartStore.items.find(i => i.id === itemId);
      if (item) {
        cartStore.updateQty(item.productId, qty);
        const guestItems = useCartStore.getState().items;
        setItems(guestItems);
        const guestTotals = guestItems.reduce((s, i) => s + i.price * i.qty, 0);
        const deliveryFee = guestTotals === 0 || guestTotals >= 500 ? 0 : 50;
        setTotals({
          subtotal: guestTotals,
          deliveryFee,
          total: guestTotals + deliveryFee,
          itemCount: guestItems.reduce((s, i) => s + i.qty, 0),
          discount: guestItems.reduce((s, i) => s + ((i.mrp ?? i.price) - i.price) * i.qty, 0),
          savings: guestItems.reduce((s, i) => s + ((i.mrp ?? i.price) - i.price) * i.qty, 0),
        });
      }
      setBusyItemId(null);
      return;
    }
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
    const token = getToken();
    if (!token) {
      const cartStore = useCartStore.getState();
      const item = cartStore.items.find(i => i.id === itemId);
      if (item) {
        cartStore.removeItem(item.productId);
        const guestItems = useCartStore.getState().items;
        setItems(guestItems);
        const guestTotals = guestItems.reduce((s, i) => s + i.price * i.qty, 0);
        const deliveryFee = guestTotals === 0 || guestTotals >= 500 ? 0 : 50;
        setTotals({
          subtotal: guestTotals,
          deliveryFee,
          total: guestTotals + deliveryFee,
          itemCount: guestItems.reduce((s, i) => s + i.qty, 0),
          discount: guestItems.reduce((s, i) => s + ((i.mrp ?? i.price) - i.price) * i.qty, 0),
          savings: guestItems.reduce((s, i) => s + ((i.mrp ?? i.price) - i.price) * i.qty, 0),
        });
      }
      setBusyItemId(null);
      return;
    }
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
            <h1 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--vt-cream-50)' }}>
              {currentLang === 'ta' ? 'எனது கூடை' : 'My cart'}
            </h1>
            <p>
              {currentLang === 'ta'
                ? `${totals.itemCount} பொருட்கள் சரிபார்க்கப்பட்ட கட்டணத்திற்கு தயாராக உள்ளன.`
                : `${totals.itemCount} items ready for verified checkout.`}
            </p>
          </div>
          <ButtonLink href="/products" variant="ghost">
            {currentLang === 'ta' ? 'தொடர்ந்து தேடவும்' : 'Continue shopping'}
          </ButtonLink>
        </div>

        {error && (
          <div role="alert" className="vt-safe-note" style={{ borderColor: 'rgba(198,91,71,0.28)', background: 'rgba(198,91,71,0.08)', color: 'var(--vt-coral-600)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <section className="vt-cart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 32px', maxWidth: '480px', width: '100%', gap: '22px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.3)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--vt-gold)', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faBoxOpen} style={{ width: 36, height: 36 }} />
              </div>
              <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', color: 'var(--vt-cream-50)', fontSize: '1.65rem', fontWeight: 600, letterSpacing: '0.01em' }}>
                {currentLang === 'ta' ? 'உங்கள் கூடை காலியாக உள்ளது' : 'Your cart is empty'}
              </h2>
              <p className="vt-muted" style={{ margin: 0, lineHeight: 1.6, color: 'rgba(245, 237, 214, 0.7)', fontSize: '0.94rem' }}>
                {currentLang === 'ta'
                  ? 'அங்கீகரிக்கப்பட்ட பாரம்பரிய மருந்துகளைக் கண்டறிந்து, பாதுகாப்பான தயாரிப்புகளை உங்கள் கூடையில் சேர்க்கவும்.'
                  : 'Browse verified traditional medicines and add safe educational products to your cart.'}
              </p>
              <ButtonLink href="/products" variant="gold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 28px', borderRadius: '30px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', marginTop: '8px' }}>
                <FontAwesomeIcon icon={faBagShopping} style={{ width: 16, height: 16 }} />
                <span>{currentLang === 'ta' ? 'மருந்துகள் வாங்க' : 'Shop medicines'}</span>
              </ButtonLink>
            </section>
          </div>
        ) : (
          <section className="vt-cart-grid">
            <div style={{ display: 'grid', gap: 16 }}>
              {items.map((item) => (
                <article key={item.id} className="vt-cart-card" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '104px minmax(0, 1fr)', gap: 18, alignItems: 'center' }}>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(201, 168, 76, 0.15)' }}>
                    <MedicineArt product={{ nameEn: item.nameEn, prescriptionRequired: item.requiresPrescription }} compact />
                  </div>
                  <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <h2 style={{ margin: 0, color: 'var(--vt-cream-50)', fontFamily: 'var(--vt-font-display)', fontSize: '1.25rem', lineHeight: 1.2 }}>{item.nameTa}</h2>
                        <p className="vt-muted" style={{ margin: '3px 0 0', fontSize: '0.88rem' }}>{item.nameEn}</p>
                      </div>
                      {item.requiresPrescription && <span className="vt-badge vt-badge-danger" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>Rx</span>}
                    </div>
                    <div className="vt-price-row" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="vt-price" style={{ color: 'var(--vt-gold, #c9a84c)', fontSize: '1.25rem', fontWeight: 700 }}>₹{item.price}</span>
                      {item.mrp && <span className="vt-mrp" style={{ color: 'var(--vt-muted)', textDecoration: 'line-through', fontSize: '0.9rem' }}>₹{item.mrp}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255, 255, 255, 0.02)', padding: '4px 8px', borderRadius: '30px', border: '1px solid rgba(201, 168, 76, 0.1)' }}>
                        <button className="vt-cart-quantity-btn" type="button" disabled={busyItemId === item.id || item.qty <= 1} onClick={() => void updateQty(item.id, item.qty - 1)} aria-label={`Decrease ${item.nameEn}`}>
                          <FontAwesomeIcon icon={faMinus} style={{ width: 12, height: 12 }} />
                        </button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, color: 'var(--vt-cream-50)' }}>{item.qty}</span>
                        <button className="vt-cart-quantity-btn" type="button" disabled={busyItemId === item.id} onClick={() => void updateQty(item.id, item.qty + 1)} aria-label={`Increase ${item.nameEn}`}>
                          <FontAwesomeIcon icon={faPlus} style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                      <button className="vt-cart-remove-btn" type="button" disabled={busyItemId === item.id} onClick={() => void removeItem(item.id)} style={{ marginLeft: 'auto' }}>
                        <FontAwesomeIcon icon={faTrashCan} style={{ width: 13, height: 13 }} /> {currentLang === 'ta' ? 'நீக்கு' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="vt-cart-summary-card" style={{ padding: 24 }}>
              <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-gold, #c9a84c)', fontSize: '1.45rem', borderBottom: '1px solid rgba(201, 168, 76, 0.15)', paddingBottom: '12px' }}>
                {currentLang === 'ta' ? 'விலை விவரம்' : 'Price summary'}
              </h2>
              <div style={{ display: 'grid', gap: 14 }}>
                <SummaryRow label={currentLang === 'ta' ? `துணைத் தொகை (${totals.itemCount} பொருட்கள்)` : `Subtotal (${totals.itemCount} items)`} value={`₹${totals.subtotal}`} />
                {totals.discount > 0 && <SummaryRow label={currentLang === 'ta' ? 'சேமிப்பு' : 'Savings'} value={`-₹${totals.discount}`} accent />}
                <SummaryRow label={currentLang === 'ta' ? 'டெலிவரி' : 'Delivery'} value={totals.deliveryFee === 0 ? (currentLang === 'ta' ? 'இலவசம்' : 'Free') : `₹${totals.deliveryFee}`} accent={totals.deliveryFee === 0} />
                <div style={{ height: 1, background: 'rgba(201, 168, 76, 0.15)', margin: '4px 0' }} />
                <SummaryRow label={currentLang === 'ta' ? 'மொத்தம்' : 'Total'} value={`₹${totals.total}`} strong />
                <div style={{ display: 'grid', gap: 8, marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--vt-muted)', fontSize: '0.88rem' }}>
                    <span>{currentLang === 'ta' ? 'இலவச டெலிவரி முன்னேற்றம்' : 'Free delivery progress'}</span>
                    <span style={{ fontWeight: 600, color: totals.subtotal >= 500 ? 'var(--vt-emerald-500)' : 'var(--vt-gold)' }}>{freeDeliveryProgress}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'rgba(20,60,43,0.15)', overflow: 'hidden' }}>
                    <div style={{ width: `${freeDeliveryProgress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(135deg, var(--vt-gold), #e8a820)' }} />
                  </div>
                  {deliveryHint > 0 && (
                    <p className="vt-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                      {currentLang === 'ta'
                        ? `இலவச டெலிவரிக்கு இன்னும் ₹${deliveryHint} சேர்க்கவும்.`
                        : `Add ₹${deliveryHint} more for free delivery.`}
                    </p>
                  )}
                </div>
                {hasPrescriptionItems && (
                  <div className="vt-safe-note" style={{ display: 'flex', gap: 10, alignItems: 'start', padding: 12, borderRadius: 10, background: 'rgba(198,91,71,0.06)', border: '1px solid rgba(198,91,71,0.2)', color: '#ffb4ab', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    <FontAwesomeIcon icon={faShieldHalved} style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, color: 'var(--vt-gold)' }} />
                    <span>
                      {currentLang === 'ta'
                        ? 'உங்கள் கூடையில் மருத்துவச் சீட்டு தேவைப்படும் தயாரிப்புகள் உள்ளன. பணம் செலுத்தும்போது மருத்துவச் சீட்டைப் பதிவேற்ற வேண்டும்.'
                        : 'Your cart includes prescription-required products. Checkout will require upload or pending verification.'}
                    </span>
                  </div>
                )}
                <Link className="vt-button vt-checkout-btn" href="/checkout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--vt-gold)', color: 'var(--vt-void, #030C07)', fontWeight: 700, fontSize: '1rem', padding: '14px', borderRadius: '8px', transition: 'opacity 0.2s', marginTop: 12, textDecoration: 'none' }}>
                  {currentLang === 'ta' ? 'பணம் செலுத்த' : 'Checkout'} <FontAwesomeIcon icon={faArrowRight} style={{ width: 16, height: 16 }} />
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
      <span className="vt-muted" style={{ fontSize: strong ? '1.05rem' : '0.95rem', color: strong ? 'var(--vt-cream-50)' : 'var(--vt-muted)', fontWeight: strong ? 600 : 400 }}>{label}</span>
      <strong style={{ color: accent ? 'var(--vt-emerald-500)' : (strong ? 'var(--vt-gold, #c9a84c)' : 'var(--vt-cream-50)'), fontFamily: strong ? 'var(--vt-font-serif)' : 'inherit', fontSize: strong ? '1.45rem' : '1rem', fontWeight: strong ? 700 : 500 }}>{value}</strong>
    </div>
  );
}
