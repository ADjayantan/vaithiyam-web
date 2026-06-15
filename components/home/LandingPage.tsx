'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faFileArrowUp, faShieldHalved,
  faTruck, faHeartPulse,
  faAppleWhole, faSun, faDroplet, faStethoscope, faThermometer, faMessage
} from '@fortawesome/free-solid-svg-icons';
import type { SeedMedicine } from '@/lib/medicineData';
import { CustomerHeader, MobileBottomNav, CustomerFooter } from '@/components/layout/CustomerShell';
import { useCartStore } from '@/stores/cartStore';
import { ProductCard } from '@/components/products/ProductCard';

/* ─── token helpers ─────────────────────────────────────────────── */
function getToken(): string | null {
  try { return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token'); }
  catch { return null; }
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const router = useRouter();
  const [bestsellers, setBestsellers] = useState<SeedMedicine[]>([]);
  const [cartCount,   setCartCount]   = useState(0);
  const [toast,       setToast]       = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg); window.setTimeout(() => setToast(''), 2800);
  }, []);

  useEffect(() => {
    fetch('/api/products?sort=rating&limit=3', { cache: 'no-store' })
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
    if (!token) {
      useCartStore.getState().addItem({
        productId: product.id,
        nameTa: product.nameTa,
        nameEn: product.nameEn,
        price: product.price,
        qty: 1,
        mrp: product.mrp,
        requiresPrescription: product.prescriptionRequired,
      });
      showToast(`${product.nameTa} added to cart.`);
      return;
    }
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
    if (!token) {
      router.push(`/auth/login?next=/`);
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      showToast(data.message ?? (res.ok ? 'Saved to wishlist.' : 'Could not save wishlist item.'));
    } catch {
      showToast('Could not add to wishlist.');
    }
  }, [router, showToast]);

  return (
    <div style={{ background: '#030C07', minHeight: '100dvh', color: '#F5EDD6', fontFamily: "'Outfit','Catamaran',sans-serif" }}>

      {/* ══ TOP NAV ══════════════════════════════════════════════ */}
      <CustomerHeader cartCount={cartCount} />

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <HeroSection />

      {/* ══ CATEGORIES ═════════════════════════════════════════ */}
      <CategorySection />

      {/* ══ COLLECTIONS (Products) ═════════════════════════════ */}
      <CollectionsSection products={bestsellers} onAddToCart={addToCart} onWishlist={addToWishlist} />

      {/* ══ TRUST STRIP ════════════════════════════════════════ */}
      <TrustStrip />

      {/* ══ CONCERN SECTION ════════════════════════════════════ */}
      <ConcernSection />

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <CustomerFooter />

      <MobileBottomNav />

      {toast && (
        <div role="status" style={{
          position: 'fixed', left: '50%', bottom: 94, zIndex: 150,
          transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          background: 'rgba(61,138,92,0.95)', color: '#fff',
          padding: '10px 20px', borderRadius: 999, fontSize: '0.86rem', fontWeight: 600,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}



/* ══════════════════════════════════════════════════════════════════
   HERO — full viewport with tropical leaf photo background
══════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="vt-landing-hero" style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      padding: '80px 32px 60px',
    }}>
      {/* Background image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Dark overlays for text legibility */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(3,12,7,0.35) 0%, rgba(3,12,7,0.55) 50%, rgba(3,12,7,0.85) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(3,12,7,0.15) 0%, rgba(3,12,7,0.60) 100%)',
        }} />
      </div>

      {/* Hero text block */}
      <motion.div
        style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 820, width: '100%' }}
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 style={{
          fontFamily: "'Cormorant Garamond','Noto Serif Tamil',Georgia,serif",
          fontSize: 'clamp(1.8rem, 6vw, 4.2rem)',
          fontWeight: 300, lineHeight: 1.15,
          color: '#F5EDD6',
          margin: '0 0 36px',
          letterSpacing: '-0.01em',
          textShadow: '0 2px 40px rgba(0,0,0,0.60)',
        }}>
          பாரம்பரிய சித்த மற்றும் ஆயுர்வேதம். <br />
          பண்டைய ஞானம், மேம்படுத்தப்பட்டது.
        </h1>

        {/* Gold CTA */}
        <Link href="/products" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '13px 32px',
          background: 'linear-gradient(135deg, #C9922A, #E8A820)',
          color: '#0A1A10',
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em',
          borderRadius: 4, textDecoration: 'none',
          boxShadow: '0 8px 32px rgba(201,146,42,0.40)',
          transition: 'all 0.2s',
        }}>
          தயாரிப்புகளை காணுங்கள்
        </Link>
      </motion.div>

      {/* Scroll arrow */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,214,0.45)" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CATEGORIES — 3 dark cards with real product images
══════════════════════════════════════════════════════════════════ */
function CategorySection() {
  const cats = [
    { img: '/cat-siddha.png',   badge: 'SIDDHA',   nameTa: 'சித்த மருத்துவம்',   nameEn: 'Siddha Medicine',   href: '/products?tradition=siddha'   },
    { img: '/cat-ayurveda.png', badge: 'AYURVEDA', nameTa: 'ஆயுர்வேத மருத்துவம்', nameEn: 'Ayurveda Medicine', href: '/products?tradition=ayurveda' },
    { img: '/cat-natural.png',  badge: 'NATURAL',  nameTa: 'இயற்கை ஆரோக்கியம்',  nameEn: 'Natural Wellness',  href: '/products?tradition=natural'  },
  ];

  return (
    <section style={{
      background: '#030C07',
      padding: '0 0 80px',
    }}>
      <div className="vt-traditions-grid">
        {cats.map(({ img, badge, nameTa, nameEn, href }, i) => (
          <motion.div
            key={badge}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href={href} className="vt-tradition-card" style={{ display: 'block', position: 'relative', textDecoration: 'none', overflow: 'hidden' }}>
              <Image
                src={img}
                alt={nameTa}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.6s ease' }}
              />
              {/* Dark gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(3,12,7,0.10) 30%, rgba(3,12,7,0.85) 100%)',
              }} />
              {/* Text */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '28px 24px',
              }}>
                <span style={{
                  display: 'block', fontSize: '0.62rem', letterSpacing: '0.20em',
                  color: 'rgba(245,237,214,0.50)', fontWeight: 600, textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  {badge}
                </span>
                <h2 style={{
                  margin: 0, fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)', fontWeight: 300,
                  color: '#F5EDD6', lineHeight: 1.25,
                }}>
                  {nameTa}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.70rem', color: 'rgba(245,237,214,0.42)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {nameEn}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CollectionsSection({ products, onAddToCart, onWishlist }: { products: SeedMedicine[]; onAddToCart: (p: SeedMedicine) => void; onWishlist: (p: SeedMedicine) => void }) {
  return (
    <section style={{ background: '#030C07', padding: '80px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 36px' }}>

        {/* Section header */}
        <div className="vt-section-header">
          <div>
            <p style={{
              margin: '0 0 10px', fontSize: '0.65rem', letterSpacing: '0.22em',
              textTransform: 'uppercase', color: '#3D8A5C', fontWeight: 600,
            }}>COLLECTIONS</p>
            <h2 style={{
              margin: 0, fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300,
              color: '#F5EDD6', letterSpacing: '-0.01em', lineHeight: 1.1,
            }}>சிறந்த விற்பனைப் பொருட்கள் (Bestsellers)</h2>
          </div>
          <Link href="/products" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.78rem', color: '#3D8A5C', fontWeight: 600,
            textDecoration: 'none', borderBottom: '1px solid rgba(61,138,92,0.35)',
            paddingBottom: 2, whiteSpace: 'nowrap',
          }}>
            அனைத்து மருந்துகளையும் காண்க (View All)
            <FontAwesomeIcon icon={faArrowRight} style={{ width: 12 }} />
          </Link>
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="vt-card vt-empty-state" style={{ padding: '40px 0' }}>
            <p className="vt-muted" style={{ margin: 0 }}>இப்பொழுது தயாரிப்புகள் இல்லை.</p>
          </div>
        ) : (
          <div className="vt-grid">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={product} onAddToCart={onAddToCart} onWishlist={onWishlist} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TRUST STRIP — 4 feature badges
══════════════════════════════════════════════════════════════════ */
function TrustStrip() {
  const items = [
    { icon: faShieldHalved, en: 'VERIFIED CATALOGUE',  desc: 'Every product verified and certified to ensure its purity.' },
    { icon: faFileArrowUp,  en: 'RX-SAFE CHECKOUT',   desc: 'Secure review of prescription recommendations to you.' },
    { icon: faHeartPulse,   en: 'TAMIL FIRST',         desc: 'Wholly Tamil support. Heritage recommendations in your language.' },
    { icon: faTruck,        en: 'TRACK EVERY ORDER',   desc: 'Worry-free delivery experience from our real-time systems.' },
  ];

  return (
    <section style={{
      background: 'rgba(10,20,15,0.60)',
      borderTop:    '1px solid rgba(61,138,92,0.12)',
      borderBottom: '1px solid rgba(61,138,92,0.12)',
      padding: '48px 36px',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 32,
      }}>
        {items.map(({ icon, en, desc }) => (
          <div key={en} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FontAwesomeIcon icon={icon} style={{ width: 22, height: 22, color: '#3D8A5C' }} />
            <strong style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#F5EDD6', fontWeight: 700 }}>
              {en}
            </strong>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(245,237,214,0.45)', lineHeight: 1.65 }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CONCERN SECTION — 7 health goals + Agasthiyan AI card
══════════════════════════════════════════════════════════════════ */
function ConcernSection() {
  const concerns = [
    { slug: 'digestive-care', nameTa: 'செரிமான பராமரிப்பு', nameEn: 'Digestive Care', icon: faAppleWhole, color: '#E8A820' },
    { slug: 'skin-care', nameTa: 'தோல் பராமரிப்பு', nameEn: 'Skin Care', icon: faSun, color: '#3D8A5C' },
    { slug: 'hair-care', nameTa: 'முடி பராமரிப்பு', nameEn: 'Hair Care', icon: faDroplet, color: '#3D8A5C' },
    { slug: 'immunity-support', nameTa: 'நோய் எதிர்ப்பு ஆதரவு', nameEn: 'Immunity Support', icon: faShieldHalved, color: '#E8A820' },
    { slug: 'general-wellness', nameTa: 'பொது நலன்', nameEn: 'General Wellness', icon: faHeartPulse, color: '#3D8A5C' },
    { slug: 'pain-relief', nameTa: 'வலி நிவாரணம்', nameEn: 'Pain Relief', icon: faStethoscope, color: '#E8A820' },
    { slug: 'fever-care', nameTa: 'காய்ச்சல் பராமரிப்பு', nameEn: 'Fever Care', icon: faThermometer, color: '#E8A820' },
  ];

  return (
    <section style={{ padding: '80px 36px', background: '#030C07', borderTop: '1px solid rgba(61,138,92,0.10)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Heading */}
        <p style={{
          margin: '0 0 10px', fontSize: '0.65rem', letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#3D8A5C', fontWeight: 600,
        }}>SHOP BY CONCERN</p>
        <h2 style={{
          margin: '0 0 12px',
          fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          fontWeight: 300, color: '#F5EDD6', lineHeight: 1.2,
        }}>
          சுகாதாரப் பிரச்சினைகள் வாரியாக வாங்குங்கள்
        </h2>
        <p style={{ margin: '0 0 40px', fontSize: '0.9rem', color: 'rgba(245,237,214,0.6)', lineHeight: 1.6 }}>
          உங்கள் குறிப்பிட்ட ஆரோக்கிய தேவைகளுக்கான சரியான சித்த மற்றும் ஆயுர்வேத தீர்வுகளைக் கண்டறியவும்.
        </p>

        {/* 8-card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {concerns.map((c) => (
            <Link key={c.slug} href={`/products?category=${c.slug}`} style={concernCardLink}>
              <div style={concernCard}>
                <FontAwesomeIcon icon={c.icon} style={{ width: 26, height: 26, color: c.color, marginBottom: 4 }} />
                <h3 style={concernTitle}>{c.nameTa}</h3>
                <p style={concernDesc}>{c.nameEn}</p>
                <span style={concernBtn}>
                  கண்டறியுங்கள் <FontAwesomeIcon icon={faArrowRight} style={{ width: 11 }} />
                </span>
              </div>
            </Link>
          ))}

          {/* Agasthiyan AI Assistant Card */}
          <div style={agasthiyanCard}>
            <FontAwesomeIcon icon={faMessage} style={{ width: 26, height: 26, color: '#E8A820', marginBottom: 4 }} />
            <h3 style={concernTitle}>அகஸ்தியன் AI உதவியாளர்</h3>
            <p style={concernDesc}>உங்களுக்கு தேவையான மூலிகை மருந்துகளையும் அவற்றின் பயன்களையும் கண்டறிய எங்களது AI உதவியாளருடன் உரையாடுங்கள்.</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-agasthiyan'))}
              style={agasthiyanBtn}
            >
              அகஸ்தியனுடன் பேசுங்கள் <FontAwesomeIcon icon={faArrowRight} style={{ width: 11 }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const concernCardLink: React.CSSProperties = {
  textDecoration: 'none',
  display: 'block',
};

const concernCard: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(13,34,24,0.60), rgba(5,12,8,0.75))',
  border: '1px solid rgba(61,138,92,0.12)',
  borderRadius: 8, padding: '28px 24px',
  display: 'flex', flexDirection: 'column', gap: 10,
  height: '100%',
  transition: 'transform 0.2s, border-color 0.2s',
  cursor: 'pointer',
};

const agasthiyanCard: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(20,34,13,0.60), rgba(12,8,5,0.75))',
  border: '1px solid rgba(201,146,42,0.18)',
  borderRadius: 8, padding: '28px 24px',
  display: 'flex', flexDirection: 'column', gap: 10,
  height: '100%',
};

const concernTitle: React.CSSProperties = {
  margin: 0, fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
  fontSize: '1.15rem', fontWeight: 500, color: '#F5EDD6', lineHeight: 1.35,
};

const concernDesc: React.CSSProperties = {
  margin: 0, fontSize: '0.80rem', color: 'rgba(245,237,214,0.45)', lineHeight: 1.6,
  flexGrow: 1,
};

const concernBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
  fontSize: '0.82rem', fontWeight: 600, color: '#3D8A5C', transition: 'color 0.2s',
};

const agasthiyanBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
  padding: '10px 18px', borderRadius: 4,
  background: 'linear-gradient(135deg, #C9922A, #E8A820)',
  color: '#0A1A10', fontSize: '0.82rem', fontWeight: 700,
  border: 'none', cursor: 'pointer',
  letterSpacing: '0.03em', width: 'max-content',
};
