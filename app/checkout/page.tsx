'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCreditCard, faFileCircleCheck, faLandmark, faLocationDot, faMobileScreen, faShieldHalved, faUpload } from '@fortawesome/free-solid-svg-icons';
import AddressSelector from '@/components/checkout/AddressSelector';
import AddressForm from '@/components/checkout/AddressForm';
import { placeOrder, type PaymentMethod } from '@/lib/order';
import { useCartStore } from '@/stores/cartStore';
import type { CartItem } from '@/types/order';
import { CustomerHeader, CustomerFooter, MobileBottomNav } from '@/components/layout/CustomerShell';
import { MedicineArt } from '@/components/ui/MedicineArt';
import { Button } from '@/components/ui/Button';

type StepIndex = 0 | 1 | 2;
type UiPayment = 'cod' | 'upi' | 'razorpay';

interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  discount: number;
}

interface CartSnapshot {
  items: CartItem[];
  totals: CartTotals;
}

const steps = [
  { label: 'Address', icon: faLocationDot },
  { label: 'Prescription', icon: faFileCircleCheck },
  { label: 'Payment + review', icon: faCreditCard },
];

const emptyTotals: CartTotals = { subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0, discount: 0 };

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

export default function CheckoutPage() {
  const router = useRouter();
  const setCartItems = useCartStore((state) => state.setItems);
  const clearCart = useCartStore((state) => state.clearCart);
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals>(emptyTotals);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<StepIndex>(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressMode, setAddressMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editAddressId, setEditAddressId] = useState<string | null>(null);
  const [payment, setPayment] = useState<UiPayment>('cod');
  const [upiId, setUpiId] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPending, setPrescriptionPending] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasPrescriptionItems = useMemo(() => items.some((item) => item.requiresPrescription), [items]);
  const prescriptionReady = !hasPrescriptionItems || prescriptionPending;
  const canContinueAddress = !!selectedAddressId && addressMode === 'none';
  const paymentReady = payment !== 'upi' || /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upiId.trim());

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/auth/login?next=/checkout');
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch('/api/cart', { headers: authHeaders(), cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace('/auth/login?next=/checkout');
          return null;
        }
        if (!res.ok) throw new Error('Cart could not be loaded.');
        return res.json() as Promise<CartSnapshot>;
      })
      .then((snapshot) => {
        if (!cancelled && snapshot) {
          setItems(snapshot.items);
          setTotals(snapshot.totals);
          setCartItems(snapshot.items);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Cart could not be loaded.'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [router, setCartItems]);

  useEffect(() => {
    if (!loading && items.length === 0) router.replace('/cart');
  }, [items.length, loading, router]);

  const registerPrescription = useCallback(async (file: File) => {
    const token = getToken();
    if (!token) return;

    // 1. Upload the file to storage first
    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await fetch('/api/prescriptions/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const data = await uploadRes.json().catch(() => ({})) as { message?: string };
      throw new Error(data.message ?? 'Prescription file upload failed.');
    }

    const { fileUrl } = await uploadRes.json() as { fileUrl: string };

    // 2. Register prescription metadata
    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileUrl,
        notes: 'Uploaded during checkout. Pending pharmacist/admin verification.',
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(data.message ?? 'Prescription could not be registered.');
    }
    setPrescriptionPending(true);
  }, []);

  const handleFileChange = useCallback(async (file: File | null) => {
    if (!file) return;
    setError('');
    setPrescriptionFile(file);
    try {
      await registerPrescription(file);
    } catch (err) {
      setPrescriptionPending(false);
      setError(err instanceof Error ? err.message : 'Prescription could not be registered.');
    }
  }, [registerPrescription]);

  const place = useCallback(async () => {
    if (!selectedAddressId || !paymentReady || !prescriptionReady) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await placeOrder({
        addressId: selectedAddressId,
        paymentMethod: payment as PaymentMethod,
        ...(payment === 'upi' && upiId.trim() ? { upiId: upiId.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        prescriptionStatus: hasPrescriptionItems ? 'pending_review' : 'not_required',
      });
      clearCart();
      router.push(`/order/success?orderId=${encodeURIComponent(result.orderId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order could not be placed.');
      setSubmitting(false);
    }
  }, [clearCart, hasPrescriptionItems, notes, payment, paymentReady, prescriptionReady, router, selectedAddressId, upiId]);

  if (loading) {
    return (
      <div className="vt-page-shell">
        <CustomerHeader />
        <main className="vt-container" style={{ padding: '30px 0' }}>
          <div className="vt-skeleton" style={{ height: 460 }} />
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
            <h1 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>Checkout</h1>
            <p>Address, prescription verification when needed, and payment review in one flow.</p>
          </div>
        </div>

        <div className="vt-card" style={{ padding: 12, marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {steps.map((item, index) => {
              const active = step === index;
              const done = step > index;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setStep(index as StepIndex)}
                  className={`vt-chip ${active || done ? 'vt-chip-active' : ''}`}
                  style={{ justifyContent: 'center', minWidth: 0 }}
                >
                  {done ? <FontAwesomeIcon icon={faCircleCheck} style={{width: 17, height: 17}} /> : <FontAwesomeIcon icon={item.icon} style={{width: 17, height: 17}} />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div role="alert" className="vt-safe-note" style={{ borderColor: 'rgba(198,91,71,0.28)', background: 'rgba(198,91,71,0.08)', color: 'var(--vt-coral-600)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <section style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1fr)' }}>
          {step === 0 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <AddressSelector
                selectedAddressId={selectedAddressId}
                onSelect={(id) => {
                  setSelectedAddressId(id);
                  setAddressMode('none');
                }}
                onAddNew={() => {
                  setAddressMode('add');
                  setEditAddressId(null);
                }}
                onEdit={(id) => {
                  setAddressMode('edit');
                  setEditAddressId(id);
                }}
                disabled={addressMode !== 'none'}
              />
              {addressMode !== 'none' && (
                <AddressForm
                  mode={addressMode}
                  addressId={editAddressId ?? undefined}
                  onSave={() => setAddressMode('none')}
                  onCancel={() => setAddressMode('none')}
                />
              )}
              <Button type="button" disabled={!canContinueAddress} onClick={() => setStep(1)}>
                Continue to prescription
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="vt-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{width: 20, height: 20, color: "var(--vt-emerald-600)"}} />
                <div>
                  <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)' }}>Prescription verification</h2>
                  <p className="vt-muted" style={{ margin: '6px 0 0', lineHeight: 1.6 }}>
                    Prescription-required products cannot be directly purchased. Upload a prescription image/PDF and the order will be marked pending verification.
                  </p>
                </div>
              </div>
              {hasPrescriptionItems ? (
                <>
                  <div className="vt-safe-note">
                    <FontAwesomeIcon icon={faUpload} style={{width: 20, height: 20}} />
                    <span>Your cart has Rx items. Uploading registers metadata locally for demo and keeps the flow Supabase-ready.</span>
                  </div>
                  <label className="vt-card vt-card-solid" style={{ padding: 18, display: 'grid', placeItems: 'center', gap: 10, textAlign: 'center', cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faUpload} style={{width: 20, height: 20, color: "var(--vt-emerald-600)"}} />
                    <strong>{prescriptionFile ? prescriptionFile.name : 'Upload prescription image or PDF'}</strong>
                    <span className="vt-muted">Accepted demo metadata: image or PDF filename.</span>
                    <input type="file" accept="image/*,.pdf" onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                  </label>
                  {prescriptionPending && (
                    <div className="vt-badge vt-badge-cyan">
                      <FontAwesomeIcon icon={faFileCircleCheck} style={{width: 15, height: 15}} /> Pending verification saved
                    </div>
                  )}
                </>
              ) : (
                <div className="vt-safe-note">
                  <FontAwesomeIcon icon={faCircleCheck} style={{width: 20, height: 20}} />
                  <span>No prescription-required items found in this cart. You can continue to payment review.</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button type="button" disabled={!prescriptionReady} onClick={() => setStep(2)}>Continue to payment</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <section className="vt-card" style={{ padding: 18, display: 'grid', gap: 14 }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)' }}>Payment method</h2>
                <PaymentChoice value="cod" selected={payment} onSelect={setPayment} icon={<FontAwesomeIcon icon={faLandmark} style={{width: 20, height: 20}} />} title="Cash on delivery" copy="Collect payment after safe delivery confirmation." />
                <PaymentChoice value="upi" selected={payment} onSelect={setPayment} icon={<FontAwesomeIcon icon={faMobileScreen} style={{width: 20, height: 20}} />} title="UPI placeholder" copy="Demo validation only. Real UPI collection needs payment gateway setup." />
                {payment === 'upi' && <input className="vt-input" value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="name@upi" aria-label="UPI ID" />}
                <PaymentChoice value="razorpay" selected={payment} onSelect={setPayment} icon={<FontAwesomeIcon icon={faCreditCard} style={{width: 20, height: 20}} />} title="Razorpay skeleton" copy="Ready for real keys and checkout SDK integration." />
                <textarea className="vt-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Order notes for pharmacist/admin review (optional)" />
              </section>

              <aside className="vt-card" style={{ padding: 18, display: 'grid', gap: 14 }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)' }}>Order review</h2>
                <div style={{ display: 'grid', gap: 10 }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '54px minmax(0,1fr) auto', gap: 10, alignItems: 'center' }}>
                      <div style={{ borderRadius: 12, overflow: 'hidden' }}><MedicineArt product={{ nameEn: item.nameEn, prescriptionRequired: item.requiresPrescription }} compact /></div>
                      <div>
                        <strong>{item.nameTa}</strong>
                        <p className="vt-muted" style={{ margin: '2px 0 0' }}>Qty {item.qty}</p>
                      </div>
                      <strong>₹{item.price * item.qty}</strong>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: 'var(--vt-border)' }} />
                <Summary label="Subtotal" value={`₹${totals.subtotal}`} />
                <Summary label="Delivery" value={totals.deliveryFee === 0 ? 'Free' : `₹${totals.deliveryFee}`} />
                <Summary label="Total" value={`₹${totals.total}`} strong />
                <div className="vt-safe-note">
                  <FontAwesomeIcon icon={faShieldHalved} style={{width: 20, height: 20}} />
                  <span>Educational information only. Consult a doctor or pharmacist before use. No dosage advice is provided.</span>
                </div>
                <Button type="button" disabled={submitting || !paymentReady || !prescriptionReady} onClick={() => void place()}>
                  {submitting ? 'Placing order...' : 'Place order'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
              </aside>
            </div>
          )}
        </section>

        <p className="vt-muted" style={{ marginTop: 18, marginBottom: 32 }}>
          Need to edit your cart? <Link href="/cart" style={{ color: 'var(--vt-emerald-400)', fontWeight: 800 }}>Return to cart</Link>.
        </p>
      </main>
      <CustomerFooter />
      <MobileBottomNav />
    </div>
  );
}

function PaymentChoice({
  value,
  selected,
  onSelect,
  icon,
  title,
  copy,
}: {
  value: UiPayment;
  selected: UiPayment;
  onSelect: (value: UiPayment) => void;
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  const active = value === selected;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="vt-card"
      style={{
        width: '100%',
        padding: 14,
        display: 'flex',
        gap: 12,
        textAlign: 'left',
        borderColor: active ? 'var(--vt-border-strong)' : 'var(--vt-border)',
        background: active ? 'rgba(61,138,92,0.12)' : 'rgba(255, 255, 255, 0.02)',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'var(--vt-emerald-600)' }}>{icon}</span>
      <span>
        <strong>{title}</strong>
        <span className="vt-muted" style={{ display: 'block', marginTop: 3 }}>{copy}</span>
      </span>
    </button>
  );
}

function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span className="vt-muted">{label}</span>
      <strong style={{ color: strong ? 'var(--vt-gold-400)' : 'var(--vt-ink)', fontSize: strong ? '1.35rem' : '1rem' }}>{value}</strong>
    </div>
  );
}
