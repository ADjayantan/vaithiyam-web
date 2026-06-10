'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faBolt, faCartShopping, faHeart, faMinus, faPlus,
  faShieldHalved, faStar, faUpload, faCheckCircle, faPenToSquare,
  faFlask, faTruck
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import type { SeedMedicine } from '@/lib/medicineData';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';
import { MedicineArt } from '@/components/ui/MedicineArt';
import { ButtonLink } from '@/components/ui/Button';

type TabKey = 'overview' | 'ingredients' | 'uses' | 'safety' | 'reviews' | 'faq';

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'uses', label: 'General Uses' },
  { id: 'safety', label: 'Safety Notes' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'faq', label: 'FAQ' },
];

const T = {
  forestPrimary: 'var(--vt-forest-800)',
  gold: 'var(--vt-gold-500)',
  leaf: 'var(--vt-forest-600)',
  darkText: 'var(--vt-ink)',
  muted: 'rgba(245,237,214,0.52)',
  border: 'rgba(61,138,92,0.18)',
} as const;

const FONT = {
  display: 'var(--vt-font-display)',
  body: 'var(--vt-font-body)',
} as const;

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
  const [recommendations, setRecommendations] = useState<SeedMedicine[]>([]);

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

  /* load recommended products */
  useEffect(() => {
    if (!product) return;
    fetch('/api/products?limit=30')
      .then(res => res.ok ? res.json() : null)
      .then((data: { products?: SeedMedicine[] } | null) => {
        if (!data || !data.products) return;
        
        const specificSlugs = ['nithya-immunity-booster', 'mooligai-detox-mix', 'vajra-strength-powder'];
        const matches = data.products.filter(p => specificSlugs.includes(p.slug) && p.slug !== product.slug);
        const remaining = data.products.filter(p => !specificSlugs.includes(p.slug) && p.slug !== product.slug);
        const combined = [...matches, ...remaining].slice(0, 3);
        setRecommendations(combined);
      })
      .catch(() => {});
  }, [product]);

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
      <div className="vt-page-shell" style={{ backgroundColor: '#030C07', minHeight: '100dvh', color: '#F5EDD6', display: 'flex', flexDirection: 'column' }}>
        <CustomerHeader />
        <main className="vt-container" style={{ padding: '34px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="vt-skeleton" style={{ height: 520, width: '100%', maxWidth: '1200px', background: 'rgba(13,34,24,0.3)', borderRadius: '24px', border: '1px solid rgba(61,138,92,0.18)' }} />
        </main>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="vt-page-shell" style={{ backgroundColor: '#030C07', minHeight: '100dvh', color: '#F5EDD6', display: 'flex', flexDirection: 'column' }}>
        <CustomerHeader />
        <main className="vt-container vt-empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <FontAwesomeIcon icon={faShieldHalved} style={{ width: 48, height: 48, color: '#FF8A9A' }} />
          <h1 style={{ fontFamily: FONT.display, color: '#F5EDD6' }}>Product not found</h1>
          <p style={{ color: T.muted }}>{error || 'This product is unavailable.'}</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 20, alignItems: 'start', padding: 20, borderRadius: 18, background: 'rgba(3,12,7,0.40)', border: '1px solid rgba(61,138,92,0.12)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontFamily: FONT.display, fontSize: '3rem', fontWeight: 700, fontStyle: 'italic', color: '#E8A820', lineHeight: 1 }}>
              {reviewAvg !== null ? reviewAvg.toFixed(1) : product.rating.toFixed(1)}
            </p>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 4 }}>
              {[1,2,3,4,5].map(s => (
                <FontAwesomeIcon key={s} icon={s <= Math.round(reviewAvg ?? product.rating) ? faStar : faStarEmpty} style={{ width: 13, color: '#E8A820' }} />
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', color: 'rgba(245,237,214,0.52)' }}>{reviewCount} reviews</p>
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            {(reviewDist.length ? reviewDist : [5,4,3,2,1].map(s=>({stars:s,count:0}))).map(({ stars, count }) => {
              const pct = reviewCount ? Math.round((count/reviewCount)*100) : 0;
              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--vt-text-xs)', color: '#F5EDD6' }}>
                  <span style={{ width: 12, textAlign: 'right', color: 'rgba(245,237,214,0.52)' }}>{stars}</span>
                  <FontAwesomeIcon icon={faStar} style={{ width: 11, color: '#E8A820' }} />
                  <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(61,138,92,0.08)', border: '1px solid rgba(61,138,92,0.12)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: '#E8A820', transition: 'width 400ms' }} />
                  </div>
                  <span style={{ width: 24, color: 'rgba(245,237,214,0.52)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write review button */}
        <button
          onClick={() => setWriteOpen(o => !o)}
          style={{
            background: 'rgba(61,138,92,0.08)',
            color: '#8CE5B5',
            border: '1px solid rgba(61,138,92,0.3)',
            borderRadius: '12px',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: 'fit-content',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(61,138,92,0.18)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(61,138,92,0.08)'}
        >
          <FontAwesomeIcon icon={faPenToSquare} style={{ width: 15 }} />
          {writeOpen ? 'Cancel' : 'Write a review'}
        </button>

        {/* Review form */}
        {writeOpen && (
          <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(61,138,92,0.3)', background: 'rgba(13,34,24,0.60)', display: 'grid', gap: 14 }}>
            <h3 style={{ margin: 0, fontFamily: FONT.display, fontSize: '1.25rem', color: '#F5EDD6' }}>Your review for {product.nameEn}</h3>

            {/* Star picker */}
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F5EDD6', display: 'block', marginBottom: 6 }}>Rating *</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setRvRating(s)} onMouseEnter={() => setRvHover(s)} onMouseLeave={() => setRvHover(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 1 }}>
                    <FontAwesomeIcon icon={s <= (rvHover || rvRating) ? faStar : faStarEmpty} style={{ width: 26, height: 26, color: '#E8A820' }} />
                  </button>
                ))}
                {rvRating > 0 && <span style={{ fontSize: '0.85rem', color: 'rgba(245,237,214,0.52)', alignSelf: 'center' }}>{['','Poor','Fair','Good','Very good','Excellent'][rvRating]}</span>}
              </div>
            </div>

            <label style={{ display: 'grid', gap: 6, fontSize: '0.88rem', fontWeight: 700, color: '#F5EDD6' }}>
              Title (optional)
              <input
                value={rvTitle}
                onChange={e => setRvTitle(e.target.value)}
                placeholder="Summarise your experience"
                maxLength={120}
                style={{
                  height: 42,
                  background: 'rgba(3,12,7,0.4)',
                  border: '1px solid rgba(61,138,92,0.18)',
                  borderRadius: '8px',
                  padding: '0 14px',
                  color: '#F5EDD6',
                  fontFamily: FONT.body,
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontSize: '0.88rem', fontWeight: 700, color: '#F5EDD6' }}>
              Review *
              <textarea
                value={rvBody}
                onChange={e => setRvBody(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                maxLength={1200}
                style={{
                  resize: 'vertical',
                  padding: '10px 14px',
                  fontFamily: FONT.body,
                  fontSize: '0.88rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(61,138,92,0.18)',
                  background: 'rgba(3,12,7,0.4)',
                  color: '#F5EDD6',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'rgba(245,237,214,0.52)', justifySelf: 'end' }}>{rvBody.length}/1200</span>
            </label>

            {rvError && <p role="alert" style={{ margin: 0, color: '#FF8A9A', fontSize: '0.88rem' }}>{rvError}</p>}

            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(245,237,214,0.52)', lineHeight: 1.55 }}>
              Reviews are published publicly. Do not include personal medical information. This is not a channel for medical advice.
            </p>
            <button onClick={submitReview} disabled={rvBusy}
              style={{
                background: '#E8A820',
                color: '#030C07',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '0.85rem',
                width: 'fit-content',
                cursor: rvBusy ? 'not-allowed' : 'pointer',
                opacity: rvBusy ? 0.65 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ width: 15 }} />
              {rvBusy ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 && reviewsLoaded ? (
          <p style={{ margin: 0, color: 'rgba(245,237,214,0.52)' }}>No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map(rv => (
            <article key={rv.id} style={{ padding: 16, borderRadius: 14, border: '1px solid rgba(61,138,92,0.12)', background: 'rgba(13,34,24,0.40)', display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(s => <FontAwesomeIcon key={s} icon={s <= rv.rating ? faStar : faStarEmpty} style={{ width: 12, color: '#E8A820' }} />)}
                  </div>
                  <strong style={{ fontFamily: FONT.display, fontSize: '1.15rem', color: '#F5EDD6' }}>{rv.title}</strong>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#F5EDD6' }}>{rv.userName}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(245,237,214,0.52)' }}>
                    {new Date(rv.createdAt).toLocaleDateString('ta-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(245,237,214,0.85)', lineHeight: 1.65 }}>{rv.body}</p>
            </article>
          ))
        )}
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(245,237,214,0.52)' }}>Reviews are not medical advice. Always consult a qualified doctor or pharmacist.</p>
      </div>
    ),
    faq: (
      <div style={{ display: 'grid', gap: 14 }}>
        {product.faqs.map((item) => (
          <article key={item.question} style={{ padding: 16, borderRadius: 14, border: '1px solid rgba(61,138,92,0.12)', background: 'rgba(13,34,24,0.40)' }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: FONT.display, fontSize: '1.2rem', color: '#F5EDD6' }}>{item.question}</h3>
            <p style={{ margin: 0, lineHeight: 1.65, fontSize: '0.92rem', color: 'rgba(245,237,214,0.78)' }}>{item.answer}</p>
          </article>
        ))}
      </div>
    ),
  };

  return (
    <div className="vt-page-shell" style={{ backgroundColor: '#030C07', minHeight: '100dvh', color: '#F5EDD6', fontFamily: FONT.body, display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />
      <main className="vt-container" style={{ padding: '24px 16px 80px', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'rgba(245,237,214,0.52)', marginBottom: 28 }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#F5EDD6'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Home</Link>
          <span style={{ color: 'rgba(245,237,214,0.3)' }}>›</span>
          <Link href="/products" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#F5EDD6'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Medicines</Link>
          <span style={{ color: 'rgba(245,237,214,0.3)' }}>›</span>
          <span style={{ color: '#F5EDD6', fontWeight: 500 }}>{product.nameEn}</span>
        </div>

        {/* Product Details Section Grid */}
        <section style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', alignItems: 'start', marginBottom: 48 }}>
          {/* Left Column: Image wrapper with Magnifier zoom overlay */}
          <div style={{
            background: 'rgba(13,34,24,0.60)',
            border: '1px solid rgba(61,138,92,0.18)',
            borderRadius: '24px',
            overflow: 'hidden',
            aspectRatio: '3/4',
            position: 'relative',
          }}>
            <MedicineArt product={product} />
          </div>

          {/* Right Column: Info details card */}
          <div style={{
            background: 'rgba(13,34,24,0.60)',
            border: '1px solid rgba(61,138,92,0.18)',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: '100px',
                border: '1px solid #D4890A',
                color: '#E8A820',
                background: 'rgba(212,137,10,0.08)',
                textTransform: 'uppercase',
              }}>
                {product.tradition === 'siddha' ? 'Siddha Tradition' : product.tradition === 'ayurveda' ? 'Ayurveda Tradition' : 'Natural Wellness'}
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: '100px',
                border: '1px solid rgba(61,138,92,0.48)',
                color: '#8CE5B5',
                background: 'rgba(61,138,92,0.08)',
                textTransform: 'uppercase',
              }}>
                {product.categoryNameEn}
              </span>
              {product.prescriptionRequired && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  border: '1px solid rgba(220,76,100,0.5)',
                  color: '#FF8A9A',
                  background: 'rgba(220,76,100,0.08)',
                  textTransform: 'uppercase',
                }}>
                  Prescription Required
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              margin: '0 0 4px',
              color: '#F5EDD6',
              fontFamily: FONT.display,
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 600,
              lineHeight: 1.1,
            }}>
              {product.nameEn}
            </h1>
            <p style={{
              margin: '0 0 16px',
              fontFamily: FONT.display,
              fontSize: '1.4rem',
              color: '#E8A820',
              fontWeight: 500,
            }}>
              {product.nameTa}
            </p>

            {/* Rating Stars Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <FontAwesomeIcon
                    key={s}
                    icon={s <= Math.round(product.rating) ? faStar : faStarEmpty}
                    style={{ width: 14, height: 14, color: '#E8A820' }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#F5EDD6', marginLeft: 6 }}>
                <strong>{product.rating.toFixed(1)}</strong>{' '}
                <span style={{ color: 'rgba(245,237,214,0.52)' }}>
                  ({product.reviewCount} reviews)
                </span>
              </span>
            </div>

            {/* Prices */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18 }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 700, color: '#E8A820', fontFamily: FONT.display }}>
                ₹{product.price}
              </span>
              <span style={{ fontSize: '1.15rem', textDecoration: 'line-through', color: 'rgba(245,237,214,0.38)' }}>
                ₹{product.mrp}
              </span>
              {discount > 0 && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#030C07',
                  backgroundColor: '#E8A820',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                }}>
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Stock Count */}
            <div style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: '30px', border: '1px solid rgba(61,138,92,0.3)', background: 'rgba(13,34,24,0.4)', color: '#8CE5B5', fontSize: '0.78rem', fontWeight: 600, marginBottom: 20 }}>
              <span style={{ color: '#3D8A5C', fontSize: '0.7rem' }}>●</span>
              {product.inStock ? `${product.stockCount} Units in Stock` : 'Out of Stock'}
            </div>

            {/* Safe Warning Box */}
            <div style={{
              display: 'flex',
              gap: 12,
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(61,138,92,0.28)',
              background: 'rgba(13,34,24,0.40)',
              color: 'rgba(245,237,214,0.78)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              marginBottom: 24,
            }}>
              <FontAwesomeIcon icon={faShieldHalved} style={{ width: 18, height: 18, color: '#3D8A5C', flexShrink: 0, marginTop: 2 }} />
              <span>
                Information is educational only. Consult qualified doctor or pharmacist before use. Vaithiyam does not provide dosage, diagnosis, or self-medication guidance.
              </span>
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              {/* Quantity Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '130px',
                height: '48px',
                background: 'rgba(13,34,24,0.60)',
                border: '1px solid rgba(61,138,92,0.22)',
                borderRadius: '12px',
                padding: '0 8px',
              }}>
                <button
                  type="button"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(245,237,214,0.6)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Decrease quantity"
                >
                  <FontAwesomeIcon icon={faMinus} style={{ width: 12, height: 12 }} />
                </button>
                <span style={{ fontWeight: 700, color: '#F5EDD6', fontSize: '1.05rem', minWidth: '20px', textAlign: 'center' }}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((value) => Math.min(10, value + 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(245,237,214,0.6)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Increase quantity"
                >
                  <FontAwesomeIcon icon={faPlus} style={{ width: 12, height: 12 }} />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                disabled={!product.inStock || busy}
                onClick={() => void addToCart(false)}
                style={{
                  flex: 1,
                  height: '48px',
                  background: '#8CE5B5',
                  color: '#030C07',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: (!product.inStock || busy) ? 'not-allowed' : 'pointer',
                  opacity: (!product.inStock || busy) ? 0.6 : 1,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { if (product.inStock && !busy) e.currentTarget.style.background = '#7cd4a4'; }}
                onMouseLeave={(e) => { if (product.inStock && !busy) e.currentTarget.style.background = '#8CE5B5'; }}
              >
                <FontAwesomeIcon icon={faCartShopping} style={{ width: 15, height: 15 }} />
                Add to Cart
              </button>
            </div>

            {/* Buy Now */}
            <button
              type="button"
              disabled={!product.inStock || busy}
              onClick={() => void addToCart(true)}
              style={{
                width: '100%',
                height: '48px',
                background: '#D4890A',
                color: '#030C07',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.88rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (!product.inStock || busy) ? 'not-allowed' : 'pointer',
                opacity: (!product.inStock || busy) ? 0.6 : 1,
                marginBottom: 20,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (product.inStock && !busy) e.currentTarget.style.background = '#e8a820'; }}
              onMouseLeave={(e) => { if (product.inStock && !busy) e.currentTarget.style.background = '#D4890A'; }}
            >
              Buy Now
            </button>

            {/* Trust Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
              padding: '16px 0',
              borderTop: '1px solid rgba(61,138,92,0.12)',
              marginTop: 10,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ width: 18, height: 18, color: '#E8A820' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(245,237,214,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Authentic Siddha
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
                <FontAwesomeIcon icon={faFlask} style={{ width: 18, height: 18, color: '#E8A820' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(245,237,214,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Lab Tested
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
                <FontAwesomeIcon icon={faTruck} style={{ width: 18, height: 18, color: '#E8A820' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(245,237,214,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Express Delivery
                </span>
              </div>
            </div>

            {product.prescriptionRequired && (
              <ButtonLink href="/prescriptions" variant="ghost" style={{ width: '100%', marginTop: 16 }}>
                <FontAwesomeIcon icon={faUpload} style={{width: 18, height: 18}} /> Upload prescription for verification
              </ButtonLink>
            )}
          </div>
        </section>

        {/* Product Tabs block */}
        <section style={{ marginBottom: 64 }}>
          <div style={{
            background: 'rgba(13,34,24,0.60)',
            border: '1px solid rgba(61,138,92,0.18)',
            borderRadius: '24px',
            padding: '24px',
          }}>
            {/* Tab buttons */}
            <div style={{
              display: 'flex',
              gap: 28,
              borderBottom: '1px solid rgba(61,138,92,0.12)',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              marginBottom: '20px',
            }}>
              {tabs.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: active ? '2px solid #E8A820' : '2px solid transparent',
                      color: active ? '#F5EDD6' : 'rgba(245,237,214,0.52)',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      padding: '8px 4px 12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontFamily: FONT.body,
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                    role="tab"
                    aria-selected={active}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Tab panel body */}
            <div style={{ minHeight: '180px', color: 'rgba(245,237,214,0.85)', lineHeight: 1.75 }}>
              {tab === 'overview' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 32 }}>
                  {/* Left Column Description */}
                  <div>
                    <h3 style={{ margin: '0 0 16px', fontFamily: FONT.display, fontSize: '1.6rem', color: '#F5EDD6', fontStyle: 'italic', fontWeight: 600 }}>
                      Product Overview
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '0.95rem', color: 'rgba(245,237,214,0.85)', lineHeight: 1.7, fontFamily: FONT.body }}>
                      {product.overview}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.98rem', color: '#E8A820', lineHeight: 1.7, fontFamily: FONT.display }}>
                      {product.slug === 'daily-wellness-combo'
                        ? 'பல ஆரோக்கிய நன்மைகளை ஒரே அட்டையில் வழங்கும் பிரத்யேக தொகுப்பு. இது பண்டைய சித்த மருத்துவ முறையையும் நவீன அறிவியல் அறிவையும் இணைத்து உருவாக்கப்பட்டுள்ளது.'
                        : 'பாரம்பரிய முறைப்படி தயாரிக்கப்பட்ட உயர்தர மூலிகை தயாரிப்பு. உடலின் நோய் எதிர்ப்பு சக்தியையும் ஒட்டுமொத்த நல்வாழ்வையும் மேம்படுத்த உதவுகிறது.'}
                    </p>
                  </div>

                  {/* Right Column Highlights Card */}
                  <div style={{
                    background: 'rgba(13,34,24,0.30)',
                    border: '1px solid rgba(61,138,92,0.18)',
                    borderRadius: '18px',
                    padding: '24px',
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: '#E8A820', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                      Highlights
                    </span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                      {[
                        product.slug === 'daily-wellness-combo' ? '100% Organic Botanical Extracts' : '100% Organic Ingredients',
                        product.slug === 'daily-wellness-combo' ? 'No Artificial Preservatives' : 'Lab Tested for Purity',
                        product.slug === 'daily-wellness-combo' ? 'Deep Detoxification Properties' : 'Sourced from Natural Forests',
                        product.slug === 'daily-wellness-combo' ? 'Immuno-modulation Support' : 'Traditional Classical Formula',
                      ].map((hl, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: 'rgba(245,237,214,0.85)', fontFamily: FONT.body }}>
                          <FontAwesomeIcon icon={faCheckCircle} style={{ width: 14, height: 14, color: '#3D8A5C', flexShrink: 0 }} />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '8px 4px 4px' }}>
                  {tabText[tab]}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* You may also like Section */}
        {recommendations.length > 0 && (
          <section style={{ borderTop: '1px solid rgba(61,138,92,0.12)', paddingTop: 40 }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: FONT.display, fontSize: '2rem', fontWeight: 600, color: '#F5EDD6' }}>
                  You may also like
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'rgba(245,237,214,0.52)' }}>
                  Curated recommendations for your journey
                </p>
              </div>
              <Link href="/products" style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#E8A820',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#F5EDD6'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#E8A820'}
              >
                VIEW ALL →
              </Link>
            </div>

            {/* Recommended cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 24 }}>
              {recommendations.map((rec) => (
                <Link
                  href={`/products/${rec.slug}`}
                  key={rec.id}
                  style={{
                    background: 'rgba(13,34,24,0.60)',
                    border: '1px solid rgba(61,138,92,0.18)',
                    borderRadius: '18px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(61,138,92,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(61,138,92,0.18)';
                  }}
                >
                  <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', background: '#030C07', border: '1px solid rgba(61,138,92,0.08)' }}>
                    {rec.imageUrl ? (
                      <img src={rec.imageUrl} alt={rec.nameEn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(61,138,92,0.1)', color: '#8CE5B5', fontWeight: 'bold' }}>
                        {rec.nameEn[0]}
                      </div>
                    )}
                  </div>

                  <span style={{
                    alignSelf: 'flex-start',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(61,138,92,0.18)',
                    color: '#8CE5B5',
                    textTransform: 'uppercase',
                  }}>
                    {rec.slug === 'nithya-immunity-booster' ? 'IMMUNITY' : rec.slug === 'mooligai-detox-mix' ? 'DETOX' : rec.slug === 'vajra-strength-powder' ? 'STRENGTH' : rec.categoryNameEn.split(' ')[0]}
                  </span>

                  <h4 style={{
                    margin: 0,
                    fontFamily: FONT.display,
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: '#F5EDD6',
                    lineHeight: 1.2,
                  }}>
                    {rec.nameEn}
                  </h4>

                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#E8A820',
                    marginTop: 'auto',
                  }}>
                    ₹{rec.price}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <CustomerFooter />
      <MobileBottomNav />

      {toast && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 94, zIndex: 100, transform: 'translateX(-50%)', padding: '12px 18px', borderRadius: 16, background: '#3D8A5C', color: '#030C07', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', fontWeight: 800, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
