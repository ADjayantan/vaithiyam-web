'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faCircleCheck, faFileArrowUp, faHeadphones,
  faHeartPulse, faLeaf, faRotate, faShieldHalved, faStar,
  faStethoscope, faTruck, faWandSparkles, faMortarPestle, faSeedling,
  faDroplet, faAppleWhole, faWind, faBolt,
  faTemperatureHalf, faFlask,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { SeedMedicine } from '@/lib/medicineData';
import { ButtonLink } from '@/components/ui/Button';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';
import { ProductCard } from '@/components/products/ProductCard';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function getToken(): string | null {
  try { return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token'); }
  catch { return null; }
}

/* ─── category colour + icon map ──────────────────────────────────────────── */
const CAT_META: Record<string, { icon: IconDefinition; bg: string; fg: string }> = {
  'siddha':           { icon: faLeaf,            bg: 'rgba(61,138,92,0.20)',   fg: '#7EC89A' },
  'ayurveda':         { icon: faWandSparkles,    bg: 'rgba(212,137,10,0.18)', fg: '#E8A820' },
  'natural-wellness': { icon: faFlask,           bg: 'rgba(77,184,168,0.18)', fg: '#4DB8A8' },
  'digestive-care':   { icon: faAppleWhole,      bg: 'rgba(200,100,60,0.16)', fg: '#F0956A' },
  'skin-care':        { icon: faWandSparkles,    bg: 'rgba(220,100,160,0.14)', fg: '#F080C0' },
  'hair-care':        { icon: faDroplet,         bg: 'rgba(139,92,246,0.18)', fg: '#A78BFA' },
  'immunity-support': { icon: faShieldHalved,    bg: 'rgba(59,130,246,0.16)', fg: '#93C5FD' },
  'general-wellness': { icon: faHeartPulse,      bg: 'rgba(244,63,94,0.16)',  fg: '#FB7185' },
  'pain-relief':      { icon: faBolt,            bg: 'rgba(251,146,60,0.16)', fg: '#FCA86A' },
  'fever-care':       { icon: faTemperatureHalf, bg: 'rgba(99,102,241,0.18)', fg: '#A5B4FC' },
};
const DEFAULT_CAT = { icon: faLeaf, bg: 'rgba(61,138,92,0.20)', fg: '#7EC89A' };

interface Category { id: string; nameTa: string; nameEn: string; slug: string }

/* ─── static testimonials ─────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'கவிதா R.', city: 'Coimbatore', stars: 5, text: 'தமிழ் மருந்துகளை தமிழிலேயே தேட முடிவது மிகவும் சௌகரியமாக இருக்கிறது. Ashwagandha churnam மிகவும் நல்ல தரத்தில் இருந்தது. மீண்டும் order செய்வேன்.', product: 'அஸ்வகந்தா சூர்ணம்' },
  { name: 'முருகன் S.', city: 'Chennai', stars: 4, text: 'Prescription upload process very simple. Delivery was fast — 2 days. The pharmacist verification gave me confidence that the products are genuine.', product: 'திரிபல சூரணம்' },
  { name: 'பிரியா M.', city: 'Madurai', stars: 5, text: 'நான் நெடுங்காலமாக சித்த மருந்துகளை தேடி வருகிறேன். இந்த website-ல் authentic Siddha products கிடைப்பது மிகவும் சந்தோஷமாக இருக்கிறது. Highly recommended!', product: 'நன்னாரி சூரணம்' },
  { name: 'சுரேஷ் K.', city: 'Salem', stars: 5, text: 'The safety information on each product page is very helpful. I appreciate that they clearly say "consult a doctor" rather than making medical claims. Very trustworthy platform.', product: 'அவரை இலை சூரணம்' },
];

/* ─── main component ──────────────────────────────────────────────────────── */
export function LandingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestsellers, setBestsellers] = useState<SeedMedicine[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg); window.setTimeout(() => setToast(''), 2800);
  }, []);

  /* load categories + top-rated products */
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : null)
      .then((d: { categories?: Category[] } | null) => setCategories(d?.categories ?? []))
      .catch(() => {});

    fetch('/api/products?sort=rating&limit=8', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((d: { products?: SeedMedicine[] } | null) => setBestsellers(d?.products ?? []))
      .catch(() => {});

    const token = getToken();
    if (!token) return;
    fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((d: { cartItemCount?: number } | null) => setCartCount(d?.cartItemCount ?? 0))
      .catch(() => {});
  }, []);

  const addToCart = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) { showToast('Please login to add medicines to cart.'); return; }
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, qty: 1 }),
      });
      const d = await res.json().catch(() => ({})) as { cartItemCount?: number; message?: string };
      if (!res.ok) throw new Error(d.message ?? 'Could not add to cart.');
      setCartCount(c => d.cartItemCount ?? c + 1);
      showToast(`${product.nameTa} added to cart.`);
    } catch (e) { showToast(e instanceof Error ? e.message : 'Could not add.'); }
  }, [showToast]);

  const addToWishlist = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) { showToast('Please login to save items.'); return; }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id }),
      });
      const d = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(d.message ?? 'Could not add to wishlist.');
      showToast(d.message ?? 'Added to wishlist.');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Error.'); }
  }, [showToast]);

  return (
    <div className="vt-page-shell">
      <CustomerHeader cartCount={cartCount} />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── TRUST STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <TrustStrip />
      </motion.div>

      {/* ── CATEGORY GRID ─────────────────────────────────────────── */}
      <section className="vt-section" style={{ background: 'var(--vt-deep)', borderTop: '1px solid rgba(61,138,92,0.10)', borderBottom: '1px solid rgba(61,138,92,0.10)' }}>
        <div className="vt-container">
          <motion.div
            className="vt-section-header"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <p className="vt-eyebrow-label">CATEGORIES</p>
              <h2>மருந்துகளை வகையால் தேடுங்கள்</h2>
            </div>
            <Link href="/products" className="vt-see-all">
              View all <FontAwesomeIcon icon={faArrowRight} style={{ width: 14 }} />
            </Link>
          </motion.div>
          <div className="vt-category-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {categories.map((cat, i) => {
              const meta = CAT_META[cat.slug] ?? DEFAULT_CAT;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="vt-category-card"
                    style={{ textDecoration: 'none', transition: 'transform 180ms, box-shadow 180ms' }}
                  >
                    <span
                      className="vt-category-icon"
                      style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: meta.bg, color: meta.fg,
                        display: 'grid', placeItems: 'center',
                      }}
                    >
                      <FontAwesomeIcon icon={meta.icon} style={{ width: 24, height: 24 }} />
                    </span>
                    <strong style={{ color: 'var(--vt-cream-50)', fontFamily: 'var(--vt-font-display)', fontSize: '1rem', lineHeight: 1.45, letterSpacing: 0 }}>
                      {cat.nameTa}
                    </strong>
                    <span style={{ fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)', fontWeight: 600 }}>
                      {cat.nameEn}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BESTSELLERS ───────────────────────────────────────────── */}
      {bestsellers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <section className="vt-section" style={{ background: 'var(--vt-void)' }}>
            <div className="vt-container">
              <div className="vt-section-header">
                <div>
                  <p className="vt-eyebrow-label">MOST POPULAR</p>
                  <h2>அதிக விற்பனையாகும் மருந்துகள்</h2>
                </div>
                <Link href="/products?sort=rating" className="vt-see-all">
                  See all <FontAwesomeIcon icon={faArrowRight} style={{ width: 14 }} />
                </Link>
              </div>
              <div className="vt-fk-grid">
                {bestsellers.map(product => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} onWishlist={addToWishlist} />
                ))}
              </div>
            </div>
          </section>
        </motion.div>
      )}

      {/* ── WHY VAITHIYAM ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <WhySection />
      </motion.div>

      {/* ── TRADITION SHOWCASE ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <TraditionSection />
      </motion.div>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <TestimonialsSection />
      </motion.div>

      {/* ── CONSULT CTA ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <ConsultCTA />
      </motion.div>

      <CustomerFooter />
      <MobileBottomNav />

      {toast && (
        <div role="status" className="vt-toast vt-toast-success" style={{ position: 'fixed', left: '50%', bottom: 94, zIndex: 150, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─── HERO ────────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      className="vt-hero"
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(5,30,15,0.82) 0%, transparent 70%),' +
          'radial-gradient(ellipse 60% 80% at 10% 80%, rgba(10,30,18,0.70) 0%, transparent 60%),' +
          'linear-gradient(170deg, #030f07 0%, #071a0e 40%, #050d05 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 36px 80px',
      }}
    >
      {/* ── Palm leaf decorative SVG background ── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        overflow: 'hidden', zIndex: 0,
      }}>
        {/* Large tropical palm silhouette - left */}
        <svg
          viewBox="0 0 400 700"
          style={{ position: 'absolute', left: '-60px', top: '-40px', width: '480px', opacity: 0.28 }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M200 700 C200 700 180 500 160 400 C140 300 60 200 20 100" stroke="#1a5c30" strokeWidth="18" strokeLinecap="round" />
          <path d="M160 400 C120 350 40 300 0 280" stroke="#1a5c30" strokeWidth="12" strokeLinecap="round" />
          <path d="M150 370 C130 300 80 220 40 180" stroke="#1a5c30" strokeWidth="10" strokeLinecap="round" />
          <path d="M165 420 C200 360 240 280 200 200" stroke="#22703a" strokeWidth="14" strokeLinecap="round" />
          <path d="M170 440 C230 400 290 340 280 260" stroke="#22703a" strokeWidth="12" strokeLinecap="round" />
          <path d="M175 460 C260 440 320 380 340 300" stroke="#1a5c30" strokeWidth="10" strokeLinecap="round" />
          {/* Leaf fronds */}
          <path d="M40 180 C20 140 10 100 30 60" stroke="#22703a" strokeWidth="8" strokeLinecap="round" />
          <path d="M40 180 C60 150 80 110 100 80" stroke="#22703a" strokeWidth="8" strokeLinecap="round" />
          <path d="M200 200 C180 160 170 120 190 80" stroke="#22703a" strokeWidth="8" strokeLinecap="round" />
          <path d="M200 200 C220 170 250 140 270 110" stroke="#22703a" strokeWidth="8" strokeLinecap="round" />
        </svg>

        {/* Palm fronds - right side */}
        <svg
          viewBox="0 0 400 600"
          style={{ position: 'absolute', right: '-80px', top: '-20px', width: '500px', opacity: 0.22, transform: 'scaleX(-1)' }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M200 600 C200 600 210 420 220 320 C240 220 310 140 360 60" stroke="#1a5c30" strokeWidth="16" strokeLinecap="round" />
          <path d="M220 320 C260 270 330 220 380 190" stroke="#1a5c30" strokeWidth="10" strokeLinecap="round" />
          <path d="M215 290 C240 220 290 160 320 120" stroke="#22703a" strokeWidth="10" strokeLinecap="round" />
          <path d="M210 350 C170 300 130 240 150 170" stroke="#22703a" strokeWidth="12" strokeLinecap="round" />
          <path d="M208 370 C150 340 90 280 100 200" stroke="#1a5c30" strokeWidth="10" strokeLinecap="round" />
          <path d="M210 380 C140 370 80 340 60 280" stroke="#1a5c30" strokeWidth="8" strokeLinecap="round" />
        </svg>

        {/* Ambient glow spots */}
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,80,45,0.35) 0%, transparent 70%)', top: '20%', left: '-100px' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,80,45,0.20) 0%, transparent 70%)', bottom: '10%', right: '-60px' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,137,10,0.08) 0%, transparent 70%)', top: '60%', right: '20%' }} />
      </div>

      {/* ── Hero text (center-aligned, full width) ── */}
      <motion.div
        style={{
          position: 'relative', zIndex: 2, textAlign: 'center',
          maxWidth: '780px', width: '100%',
        }}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Nav links row (mimics screenshot top nav) */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '28px', marginBottom: '80px', flexWrap: 'wrap',
        }}>
          {['சித்த மருத்துவம்', 'ஆயுர்வேதம்', 'இயற்கை', 'ஆரோக்கியம்', 'நம்பகம்'].map((label) => (
            <a
              key={label}
              href="/products"
              style={{
                fontFamily: 'var(--vt-font-display)',
                fontSize: '0.88rem', color: 'rgba(245,237,214,0.65)',
                textDecoration: 'none', fontWeight: 400, letterSpacing: '0.03em',
                transition: 'color 0.2s',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontFamily: 'var(--vt-font-display)',
            fontSize: 'clamp(2.4rem, 7vw, 4.4rem)',
            fontWeight: 300, lineHeight: 1.12,
            color: 'var(--vt-cream-50)',
            margin: '0 0 28px', letterSpacing: '-0.01em',
          }}
        >
          பாரம்பரிய சித்த மற்றும் ஆயுர்வேதம்.<br />
          <span style={{ color: 'rgba(245,237,214,0.80)', fontWeight: 300 }}>
            பண்டைய ஞானம், மேம்படுத்தப்பட்டது.
          </span>
        </h1>

        {/* CTA button */}
        <div style={{ marginBottom: '72px' }}>
          <ButtonLink href="/products" variant="gold">
            🌿 தயாரிப்புகளை காணுங்கள்
          </ButtonLink>
        </div>

        {/* Scroll indicator arrow */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,214,0.40)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </motion.div>

      {/* ── Category cards row (bottom of hero) ── */}
      <motion.div
        style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: '900px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          marginTop: 60,
        }}
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {[
          { icon: faMortarPestle, label: 'சித்த மருத்துவம்', sub: 'Siddha Medicine', color: '#00c8c2', href: '/products?tradition=siddha', imgBg: 'rgba(0,200,194,0.12)' },
          { icon: faLeaf,         label: 'ஆயுர்வேத மருத்துவம்', sub: 'Ayurvedic', color: '#D4890A', href: '/products?tradition=ayurveda', imgBg: 'rgba(212,137,10,0.10)' },
          { icon: faSeedling,     label: 'இயற்கை ஆரோக்கியம்', sub: 'Natural Wellness', color: '#a78bfa', href: '/products?tradition=natural', imgBg: 'rgba(167,139,250,0.10)' },
        ].map(({ icon, label, sub, color, href, imgBg }) => (
          <Link
            key={label}
            href={href}
            style={{ textDecoration: 'none' }}
          >
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              style={{
                background: 'rgba(10,25,15,0.80)',
                border: '1px solid rgba(61,138,92,0.22)',
                borderRadius: 16, overflow: 'hidden',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Image placeholder area */}
              <div style={{
                height: 140, background: imgBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: 70, height: 70, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={icon} style={{ width: 32, height: 32, color }} />
                </div>
                {/* Decorative rings */}
                <div style={{ position: 'absolute', inset: -20, border: `1px solid ${color}22`, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', inset: 10, border: `1px solid ${color}14`, borderRadius: '50%' }} />
              </div>
              {/* Label */}
              <div style={{ padding: '14px 16px' }}>
                <p style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1rem', color: 'var(--vt-cream-50)', fontWeight: 600, lineHeight: 1.3 }}>{label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.70rem', color: 'rgba(245,237,214,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sub}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </section>
  );
}

/* ─── TRUST STRIP ─────────────────────────────────────────────────────────── */
function TrustStrip() {
  return (
    <section className="vt-trust-section" aria-label="Why choose Vaithiyam">
      <div className="vt-container">
        <div className="vt-trust-grid">
          {[
            { icon: faTruck,        title: 'Free Delivery',  sub: 'On orders above ₹499' },
            { icon: faShieldHalved, title: 'Rx Review',       sub: 'By licensed pharmacist' },
            { icon: faRotate,       title: 'Easy Returns',    sub: 'Within 7 days' },
            { icon: faHeartPulse,   title: 'Safe Info',        sub: 'Educational content only' },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="vt-trust-cell">
              <span className="vt-trust-icon-wrap">
                <FontAwesomeIcon icon={icon} style={{ width: 20, height: 20 }} aria-hidden />
              </span>
              <div>
                <strong className="vt-trust-title">{title}</strong>
                <span className="vt-trust-sub">{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── WHY VAITHIYAM ───────────────────────────────────────────────────────── */
function WhySection() {
  return (
    <section className="vt-why-section">
      <div className="vt-container">
        <div className="vt-section-header vt-why-header">
          <div>
            <p className="vt-eyebrow-label">WHY VAITHIYAM</p>
            <h2>ஏன் வைத்தியம் நம்பகமானது?</h2>
            <p>Every product, every process — built for trust</p>
          </div>
        </div>
        <div className="vt-why-grid">
          {[
            { icon: faShieldHalved, iconBg: 'rgba(0, 230, 130, 0.14)',   iconColor: '#00e898', ta: 'சரிபார்க்கப்பட்ட பட்டியல்',          en: 'Verified Catalogue', desc: 'Every product manually verified. No unapproved health claims. No misleading information.' },
            { icon: faFileArrowUp,  iconBg: 'rgba(245, 183, 35, 0.14)',  iconColor: '#f5b723', ta: 'மருந்துகள் பரிந்துரை பரிசோதனை',  en: 'Rx-Safe Checkout',    desc: 'Prescription medicines verified by a licensed pharmacist before dispatch.' },
            { icon: faHeadphones,   iconBg: 'rgba(0, 200, 194, 0.14)',   iconColor: '#00c8c2', ta: 'தமிழ் ஆதரவு',                      en: 'Tamil First',         desc: 'Tamil product names, Tamil UI, Tamil-speaking customer support available.' },
            { icon: faTruck,        iconBg: 'rgba(167, 139, 250, 0.14)', iconColor: '#a78bfa', ta: 'ஒவ்வொரு ஆர்டரையும் கண்காணிக்கவும்', en: 'Track Every Order',   desc: 'Real-time delivery tracking with SMS updates throughout the journey.' },
          ].map(({ icon, iconBg, iconColor, ta, en, desc }) => (
            <div key={en} className="vt-why-card">
              <span
                className="vt-why-icon"
                style={{ background: iconBg, color: iconColor }}
              >
                <FontAwesomeIcon icon={icon} style={{ width: 20, height: 20 }} aria-hidden />
              </span>
              <h3 className="vt-why-title-ta">{ta}</h3>
              <p className="vt-why-title-en">{en}</p>
              <p className="vt-why-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TRADITION SHOWCASE ──────────────────────────────────────────────────── */
function TraditionSection() {
  return (
    <section className="vt-section vt-tradition-section">
      <div className="vt-container">
        <div className="vt-section-header">
          <div>
            <p className="vt-eyebrow-label">OUR TRADITIONS</p>
            <h2>3000 ஆண்டுகால மருத்துவ பாரம்பரியம்</h2>
            <p>Three healing traditions, one trusted shop</p>
          </div>
        </div>
        <div className="vt-tradition-grid">
          {[
            { slug: 'siddha',   icon: faMortarPestle, iconColor: '#00c8c2', nameTa: 'சித்த மருத்துவம்',   nameEn: 'Siddha Medicine',   origin: 'Tamil Nadu · 5000 BCE',  desc: 'Founded by the 18 Siddha sages. Uses minerals, herbs, and yogic science rooted in Tamil tradition.', style: 'dark',  count: 56 },
            { slug: 'ayurveda', icon: faLeaf,         iconColor: '#f4d581', nameTa: 'ஆயுர்வேதம்',         nameEn: 'Ayurvedic Medicine', origin: 'India-wide · 3000 BCE', desc: 'Based on Charaka Samhita texts. Balances the three doshas — Vata, Pitta, Kapha — for holistic health.', style: 'gold',  count: 48 },
            { slug: 'natural',  icon: faSeedling,     iconColor: '#a78bfa', nameTa: 'இயற்கை மருந்துகள்', nameEn: 'Natural Wellness',  origin: 'Modern herbal science',  desc: 'Contemporary plant-based formulations backed by modern research. Chemical-free, everyday wellness.', style: 'cream', count: 32 },
          ].map(t => (
            <div key={t.slug} className={`vt-tradition-card vt-tradition-${t.style}`}>
              <div className="vt-tradition-top">
                <span className="vt-tradition-emoji">
                  <FontAwesomeIcon icon={t.icon} style={{ width: 28, height: 28, color: t.iconColor }} />
                </span>
                <span className="vt-tradition-count">{t.count} products</span>
              </div>
              <h3 className="vt-tradition-name-ta">{t.nameTa}</h3>
              <p className="vt-tradition-name-en">{t.nameEn}</p>
              <p className="vt-tradition-origin">{t.origin}</p>
              <p className="vt-tradition-desc">{t.desc}</p>
              <Link href={`/products?tradition=${t.slug}`} className="vt-tradition-link">
                Explore {t.nameEn} <FontAwesomeIcon icon={faArrowRight} style={{ width: 13 }} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ────────────────────────────────────────────────────────── */
function TestimonialsSection() {
  const tints = ['#fdf8ed', '#f0fdf8', '#fdf5d0', '#ede9fe'];
  return (
    <section className="vt-section vt-testimonials-section">
      <div className="vt-container">
        <div className="vt-section-header">
          <div>
            <p className="vt-eyebrow-label">CUSTOMER REVIEWS</p>
            <h2>வாடிக்கையாளர்கள் என்ன சொல்கிறார்கள்?</h2>
          </div>
          <Link href="/products" className="vt-see-all">
            Write a review <FontAwesomeIcon icon={faArrowRight} style={{ width: 14 }} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.article
              key={t.name}
              className="vt-card vt-testimonial-card"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ padding: 20, display: 'grid', gap: 12, background: tints[i % tints.length] }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: 5 }).map((_, si) => (
                  <FontAwesomeIcon key={si} icon={faStar} style={{ width: 14, height: 14, color: si < t.stars ? 'var(--vt-gold-500)' : 'var(--vt-border)' }} />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', lineHeight: 1.7, color: 'var(--vt-ink-80)', fontStyle: 'italic' }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <strong style={{ fontSize: 'var(--vt-text-sm)', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-forest-900)' }}>{t.name}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)' }}>{t.city}</p>
                </div>
                <span style={{ fontSize: 'var(--vt-text-xs)', padding: '2px 8px', borderRadius: 999, background: 'var(--vt-emerald-100)', color: 'var(--vt-emerald-600)', fontWeight: 600 }}>
                  {t.product}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CONSULT CTA ─────────────────────────────────────────────────────────── */
function ConsultCTA() {
  const consultTypes = [
    {
      icon: '📅',
      titleTa: 'புதிய ஆலோசனையை திட்டமிடுங்கள்',
      desc: 'Schedule with specialists live on GrowthClinic, daily at 11:30 AM',
      cta: 'நேரடி தள்ளுவாரை',
      ctaHref: '/help',
      badge: null,
    },
    {
      icon: '🕐',
      titleTa: 'வரவிருக்கும் நியமனங்கள்',
      desc: 'அடுத்த ஆலோசனை: Tue, 11:30 AM',
      cta: 'அட்டவணை காண்க',
      ctaHref: '/help',
      badge: 'இலவச சிறு உதவி',
    },
    {
      icon: '⚡',
      titleTa: 'உடனடி சுகாதார சிறு சலுகைகள்',
      desc: 'Words, great delivery recommendations across our Tamil language systems.',
      cta: null,
      ctaHref: null,
      badge: null,
    },
  ];

  return (
    <section className="vt-consult-section" style={{ padding: '72px 36px' }}>
      <div className="vt-container">
        {/* Header */}
        <div className="vt-section-header" style={{ marginBottom: 32 }}>
          <div>
            <p className="vt-eyebrow-label">CONSULTATIONS</p>
            <h2>உங்கள் சுகாதார ஆலோசனைகள்</h2>
          </div>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {consultTypes.map((c) => (
            <div
              key={c.titleTa}
              style={{
                background: 'linear-gradient(145deg, rgba(13,34,24,0.75), rgba(7,14,11,0.92))',
                border: '1px solid rgba(61,138,92,0.18)',
                borderRadius: 20, padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}
            >
              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{c.icon}</span>
              <h3 style={{
                margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1.05rem',
                color: 'var(--vt-cream-50)', fontWeight: 600, lineHeight: 1.35,
              }}>
                {c.titleTa}
              </h3>
              <p style={{
                margin: 0, fontSize: '0.80rem', color: 'rgba(245,237,214,0.52)',
                lineHeight: 1.65,
              }}>
                {c.desc}
              </p>
              {c.badge && (
                <span style={{
                  display: 'inline-block', width: 'max-content',
                  padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(212,137,10,0.14)', color: 'var(--vt-turmeric)',
                  fontSize: '0.68rem', fontWeight: 700,
                  border: '1px solid rgba(212,137,10,0.22)', letterSpacing: '0.04em',
                }}>
                  {c.badge}
                </span>
              )}
              {c.cta && c.ctaHref && (
                <Link
                  href={c.ctaHref}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    marginTop: 4,
                    padding: '10px 18px', borderRadius: 999,
                    background: 'linear-gradient(135deg, var(--vt-gold-600), var(--vt-gold-400))',
                    color: 'var(--vt-void)', fontFamily: 'var(--vt-font-body)',
                    fontSize: '0.84rem', fontWeight: 700, textDecoration: 'none',
                    width: 'max-content',
                  }}
                >
                  {c.cta} <FontAwesomeIcon icon={faArrowRight} style={{ width: 12 }} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
