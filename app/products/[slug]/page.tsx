'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBolt, faCartShopping, faHeart, faMinus, faPlus, faShieldHalved, faStar, faUpload, faCheckCircle, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import type { SeedMedicine } from '@/lib/medicineData';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';
import { MedicineArt } from '@/components/ui/MedicineArt';
import { Button, ButtonLink } from '@/components/ui/Button';

type TabKey = 'overview' | 'ingredients' | 'uses' | 'safety' | 'reviews' | 'faq';

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'uses', label: 'General uses' },
  { id: 'safety', label: 'Safety notes' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'faq', label: 'FAQ' },
];

const traditionLabels: Record<SeedMedicine['tradition'], string> = {
  siddha: 'சித்த மருத்துவம்',
  ayurveda: 'Ayurveda',
  natural: 'Natural wellness',
};

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [product, setProduct] = useState<SeedMedicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<TabKey>('overview');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  /* reviews */
  type Review = { id: string; userName: string; rating: number; title: string; body: string; createdAt: string };
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [reviewAvg, setReviewAvg]       = useState<number | null>(null);
  const [reviewCount, setReviewCount]   = useState(0);
  const [reviewDist, setReviewDist]     = useState<{ stars: number; count: number }[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [writeOpen, setWriteOpen]       = useState(false);
  const [rvRating, setRvRating]         = useState(0);
  const [rvHover, setRvHover]           = useState(0);
  const [rvTitle, setRvTitle]           = useState('');
  const [rvBody, setRvBody]             = useState('');
  const [rvBusy, setRvBusy]             = useState(false);
  const [rvError, setRvError]           = useState('');

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { message?: string };
          throw new Error(data.message ?? 'Product not found.');
        }
        return res.json() as Promise<{ product: SeedMedicine }>;
      })
      .then((data) => {
        if (!cancelled) setProduct(data.product);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Product not found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  /* load reviews when reviews tab is opened */
  useEffect(() => {
    if (tab !== 'reviews' || reviewsLoaded || !product) return;
    fetch(`/api/products/${encodeURIComponent(slug)}/reviews`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { reviews?: Review[]; average?: number; count?: number; distribution?: { stars:number; count:number }[] } | null) => {
        if (!d) return;
        setReviews(d.reviews ?? []);
        setReviewAvg(d.average ?? null);
        setReviewCount(d.count ?? 0);
        setReviewDist(d.distribution ?? []);
        setReviewsLoaded(true);
      })
      .catch(() => {});
  }, [tab, reviewsLoaded, product, slug]);

  const submitReview = useCallback(async () => {
    if (rvRating === 0) { setRvError('Please select a star rating.'); return; }
    if (rvBody.trim().length < 10) { setRvError('Review must be at least 10 characters.'); return; }
    const token = getToken();
    if (!token) { setRvError('Please login to write a review.'); return; }
    setRvBusy(true); setRvError('');
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: rvRating, title: rvTitle, body: rvBody }),
      });
      const d = await res.json().catch(() => ({})) as { review?: Review; message?: string };
      if (!res.ok) throw new Error(d.message ?? 'Could not submit review.');
      if (d.review) setReviews(prev => [d.review!, ...prev]);
      setReviewCount(c => c + 1);
      setWriteOpen(false); setRvRating(0); setRvTitle(''); setRvBody('');
      showToast('Review submitted! Thank you.');
    } catch (e) { setRvError(e instanceof Error ? e.message : 'Error submitting review.'); }
    finally { setRvBusy(false); }
  }, [rvRating, rvTitle, rvBody, slug, showToast]);

  const discount = useMemo(() => {
    if (!product) return 0;
    return Math.max(0, Math.round((1 - product.price / product.mrp) * 100));
  }, [product]);

  const addToCart = useCallback(async (goCheckout = false) => {
    if (!product || busy) return;
    const token = getToken();
    if (!token) {
      router.push(`/auth/login?next=/products/${encodeURIComponent(product.slug)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, qty }),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Could not add product.');
      if (goCheckout) {
        router.push('/checkout');
      } else {
        showToast('Added to cart.');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add product.');
    } finally {
      setBusy(false);
    }
  }, [busy, product, qty, router, showToast]);

  const addWishlist = useCallback(async () => {
    if (!product) return;
    const token = getToken();
    if (!token) {
      router.push(`/auth/login?next=/products/${encodeURIComponent(product.slug)}`);
      return;
    }
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: product.id }),
    });
    const data = await res.json().catch(() => ({})) as { message?: string };
    showToast(data.message ?? (res.ok ? 'Saved to wishlist.' : 'Could not save wishlist item.'));
  }, [product, router, showToast]);

  if (loading) {
    return (
      <div className="vt-page-shell">
        <CustomerHeader />
        <main className="vt-container" style={{ padding: '34px 0' }}>
          <div className="vt-skeleton" style={{ height: 520 }} />
        </main>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="vt-page-shell">
        <CustomerHeader />
        <main className="vt-container vt-empty-state">
          <FontAwesomeIcon icon={faShieldHalved} style={{width: 48, height: 48, color: "var(--vt-coral-600)"}} />
          <h1 style={{ fontFamily: 'var(--vt-font-display)' }}>Product not found</h1>
          <p className="vt-muted">{error || 'This product is unavailable.'}</p>
          <ButtonLink href="/products">Back to products</ButtonLink>
        </main>
      </div>
    );
  }

  const tabText: Record<TabKey, ReactNode> = {
    overview: product.overview,
    ingredients: product.ingredients,
    uses: product.generalUses,
    safety: product.safetyNotes,
    reviews: (
      <div style={{ display: 'grid', gap: 20 }}>
        {/* Summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start', padding: 20, borderRadius: 18, background: 'var(--vt-cream-100)', border: '1px solid var(--vt-border)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontFamily: 'var(--vt-font-serif)', fontSize: '3rem', fontWeight: 700, fontStyle: 'italic', color: 'var(--vt-forest-800)', lineHeight: 1 }}>
              {reviewAvg !== null ? reviewAvg.toFixed(1) : product.rating.toFixed(1)}
            </p>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 4 }}>
              {[1,2,3,4,5].map(s => (
                <FontAwesomeIcon key={s} icon={s <= Math.round(reviewAvg ?? product.rating) ? faStar : faStarEmpty} style={{ width: 13, color: 'var(--vt-gold-500)' }} />
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)' }}>{reviewCount} reviews</p>
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            {(reviewDist.length ? reviewDist : [5,4,3,2,1].map(s=>({stars:s,count:0}))).map(({ stars, count }) => {
              const pct = reviewCount ? Math.round((count/reviewCount)*100) : 0;
              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--vt-text-xs)' }}>
                  <span style={{ width: 12, textAlign: 'right', color: 'var(--vt-muted)' }}>{stars}</span>
                  <FontAwesomeIcon icon={faStar} style={{ width: 11, color: 'var(--vt-gold-500)' }} />
                  <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--vt-border)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'var(--vt-gold-500)', transition: 'width 400ms' }} />
                  </div>
                  <span style={{ width: 24, color: 'var(--vt-muted)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write review button */}
        <button
          onClick={() => setWriteOpen(o => !o)}
          className="vt-button"
          style={{ background: 'var(--vt-emerald-100)', color: 'var(--vt-emerald-600)', border: '1px solid var(--vt-emerald-600)', justifyContent: 'center', gap: 8, width: 'fit-content' }}
        >
          <FontAwesomeIcon icon={faPenToSquare} style={{ width: 15 }} />
          {writeOpen ? 'Cancel' : 'Write a review'}
        </button>

        {/* Review form */}
        {writeOpen && (
          <div style={{ padding: 20, borderRadius: 18, border: '2px solid var(--vt-emerald-600)', background: 'var(--vt-cream-100)', display: 'grid', gap: 14 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1.1rem' }}>Your review for {product.nameTa}</h3>

            {/* Star picker */}
            <div>
              <label style={{ fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)', display: 'block', marginBottom: 6 }}>Rating *</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setRvRating(s)} onMouseEnter={() => setRvHover(s)} onMouseLeave={() => setRvHover(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 1 }}>
                    <FontAwesomeIcon icon={s <= (rvHover || rvRating) ? faStar : faStarEmpty} style={{ width: 26, height: 26, color: 'var(--vt-gold-500)' }} />
                  </button>
                ))}
                {rvRating > 0 && <span style={{ fontSize: 'var(--vt-text-sm)', color: 'var(--vt-muted)', alignSelf: 'center' }}>{['','Poor','Fair','Good','Very good','Excellent'][rvRating]}</span>}
              </div>
            </div>

            <label style={{ display: 'grid', gap: 6, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)' }}>
              Title (optional)
              <input className="vt-input" value={rvTitle} onChange={e => setRvTitle(e.target.value)} placeholder="Summarise your experience" maxLength={120} style={{ height: 42 }} />
            </label>

            <label style={{ display: 'grid', gap: 6, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)' }}>
              Review *
              <textarea
                className="vt-input"
                value={rvBody}
                onChange={e => setRvBody(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                maxLength={1200}
                style={{ resize: 'vertical', padding: '10px 14px', fontFamily: 'var(--vt-font-body)', fontSize: 'var(--vt-text-sm)', borderRadius: 'var(--vt-radius-sm)', border: '1px solid var(--vt-border)', outline: 'none' }}
              />
              <span style={{ fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)', justifySelf: 'end' }}>{rvBody.length}/1200</span>
            </label>

            {rvError && <p role="alert" style={{ margin: 0, color: 'var(--vt-danger-text)', fontSize: 'var(--vt-text-sm)' }}>{rvError}</p>}

            <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)', lineHeight: 1.55 }}>
              Reviews are published publicly. Do not include personal medical information. This is not a channel for medical advice.
            </p>
            <button onClick={submitReview} disabled={rvBusy} className="vt-button"
              style={{ background: 'linear-gradient(135deg,var(--vt-emerald-600),var(--vt-teal-500))', color: '#fff', border: 'none', width: 'fit-content', opacity: rvBusy ? 0.65 : 1 }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ width: 15 }} />
              {rvBusy ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 && reviewsLoaded ? (
          <p style={{ margin: 0, color: 'var(--vt-muted)' }}>No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map(rv => (
            <article key={rv.id} style={{ padding: 16, borderRadius: 14, border: '1px solid var(--vt-border)', background: 'var(--vt-card)', display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(s => <FontAwesomeIcon key={s} icon={s <= rv.rating ? faStar : faStarEmpty} style={{ width: 12, color: 'var(--vt-gold-500)' }} />)}
                  </div>
                  <strong style={{ fontFamily: 'var(--vt-font-display)', fontSize: 'var(--vt-text-base)' }}>{rv.title}</strong>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)' }}>{rv.userName}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)' }}>
                    {new Date(rv.createdAt).toLocaleDateString('ta-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-ink-80)', lineHeight: 1.65 }}>{rv.body}</p>
            </article>
          ))
        )}
        <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)' }}>Reviews are not medical advice. Always consult a qualified doctor or pharmacist.</p>
      </div>
    ),
    faq: (
      <div style={{ display: 'grid', gap: 14 }}>
        {product.faqs.map((item) => (
          <article key={item.question} className="vt-card vt-card-solid" style={{ padding: 14, boxShadow: 'none' }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--vt-font-display)' }}>{item.question}</h3>
            <p className="vt-muted" style={{ margin: 0, lineHeight: 1.65 }}>{item.answer}</p>
          </article>
        ))}
      </div>
    ),
  };

  return (
    <div className="vt-page-shell">
      <CustomerHeader />
      <main className="vt-container" style={{ padding: '22px 0 0' }}>
        <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--vt-forest-800)', fontWeight: 800, marginBottom: 18 }}>
          <FontAwesomeIcon icon={faArrowLeft} style={{width: 18, height: 18}} /> Back to products
        </Link>
        <section style={{ display: 'grid', gap: 22, gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', alignItems: 'start' }}>
          <div className="vt-card vt-card-solid" style={{ overflow: 'hidden' }}>
            <MedicineArt product={product} />
          </div>

          <div className="vt-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <span className="vt-badge">{traditionLabels[product.tradition]}</span>
              <span className="vt-badge vt-badge-cyan">{product.categoryNameEn}</span>
              {product.prescriptionRequired && <span className="vt-badge vt-badge-danger">Prescription required</span>}
            </div>
            <h1 style={{ margin: 0, color: 'var(--vt-forest-950)', fontFamily: 'var(--vt-font-display)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: 1 }}>
              {product.nameTa}
            </h1>
            <p className="vt-muted" style={{ margin: '8px 0 0', fontSize: '1.12rem' }}>{product.nameEn}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: 'var(--vt-gold-500)', fontWeight: 800 }}>
              <FontAwesomeIcon icon={faStar} style={{width: 18, height: 18}} /> {product.rating.toFixed(1)}
              <span className="vt-muted">({product.reviewCount} reviews)</span>
            </div>
            <div className="vt-price-row" style={{ marginTop: 18 }}>
              <span className="vt-price" style={{ fontSize: '2rem' }}>₹{product.price}</span>
              <span className="vt-mrp">₹{product.mrp}</span>
              {discount > 0 && <span className="vt-badge vt-badge-gold">{discount}% off</span>}
            </div>
            <p className={product.inStock ? 'vt-badge vt-badge-cyan' : 'vt-badge vt-badge-danger'} style={{ marginTop: 12 }}>
              {product.inStock ? `${product.stockCount} units in stock` : 'Out of stock'}
            </p>

            <div className="vt-safe-note" style={{ marginTop: 18 }}>
              <FontAwesomeIcon icon={faShieldHalved} style={{width: 20, height: 20}} />
              <span>Information is educational only. Consult a qualified doctor or pharmacist before use. Vaithiyam does not provide dosage, diagnosis, or self-medication guidance.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
              <button className="vt-icon-button" type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity" style={{ color: 'var(--vt-forest-800)', background: '#fff', borderColor: 'var(--vt-border)' }}>
                <FontAwesomeIcon icon={faMinus} style={{width: 18, height: 18}} />
              </button>
              <span style={{ minWidth: 34, textAlign: 'center', fontWeight: 900, fontSize: '1.1rem' }}>{qty}</span>
              <button className="vt-icon-button" type="button" onClick={() => setQty((value) => Math.min(10, value + 1))} aria-label="Increase quantity" style={{ color: 'var(--vt-forest-800)', background: '#fff', borderColor: 'var(--vt-border)' }}>
                <FontAwesomeIcon icon={faPlus} style={{width: 18, height: 18}} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginTop: 18 }}>
              <Button type="button" disabled={!product.inStock || busy} onClick={() => void addToCart(false)}><FontAwesomeIcon icon={faCartShopping} style={{width: 18, height: 18}} /> Add to cart</Button>
              <Button type="button" variant="gold" disabled={!product.inStock || busy} onClick={() => void addToCart(true)}><FontAwesomeIcon icon={faBolt} style={{width: 18, height: 18}} /> Buy now</Button>
              <button className="vt-icon-button" type="button" onClick={() => void addWishlist()} aria-label="Wishlist" style={{ color: 'var(--vt-forest-800)', background: '#fff', borderColor: 'var(--vt-border)' }}>
                <FontAwesomeIcon icon={faHeart} style={{width: 19, height: 19}} />
              </button>
            </div>
            {product.prescriptionRequired && (
              <ButtonLink href="/prescriptions" variant="ghost" style={{ width: '100%', marginTop: 12 }}>
                <FontAwesomeIcon icon={faUpload} style={{width: 18, height: 18}} /> Upload prescription for verification
              </ButtonLink>
            )}
          </div>
        </section>

        <section className="vt-section">
          <div className="vt-card" style={{ padding: 16 }}>
            <div className="vt-chip-row" role="tablist" aria-label="Product detail sections">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`vt-chip ${tab === item.id ? 'vt-chip-active' : ''}`}
                  onClick={() => setTab(item.id)}
                  role="tab"
                  aria-selected={tab === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ padding: '16px 4px 4px', color: 'var(--vt-ink)', lineHeight: 1.75 }}>
              {typeof tabText[tab] === 'string' ? <p style={{ margin: 0 }}>{tabText[tab]}</p> : tabText[tab]}
            </div>
          </div>
        </section>
      </main>
      <CustomerFooter />
      <MobileBottomNav />
      {toast && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 94, zIndex: 100, transform: 'translateX(-50%)', padding: '12px 18px', borderRadius: 16, background: 'var(--vt-forest-900)', color: '#fff', boxShadow: 'var(--vt-shadow-soft)', fontWeight: 800, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
