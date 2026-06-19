'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faFileArrowUp, faShieldHalved,
  faTruck, faHeartPulse, faCalendarDays, faClock, faBolt
} from '@fortawesome/free-solid-svg-icons';
import type { SeedMedicine } from '@/lib/medicineData';
import { CustomerHeader, MobileBottomNav, CustomerFooter } from '@/components/layout/CustomerShell';
import { useCartStore } from '@/stores/cartStore';
import { useLanguageStore } from '@/stores/languageStore';
import { ProductCard } from '@/components/products/ProductCard';

/* ─── token helpers ─────────────────────────────────────────────── */
function getToken(): string | null {
  try { return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token'); }
  catch { return null; }
}

const STATIC_PRODUCTS = [
  {
    id: 'prod-1',
    img: '/prod-restoration.png',
    badge: 'ORGANIC',
    nameEn: 'Pure Ashwagandha Extract',
    desc: 'Restoration Adaptogen',
    price: '₹1,850',
    href: '/products/ashwagandha-churnam',
  },
  {
    id: 'prod-2',
    img: '/prod-harmony.png',
    badge: 'HERBAL',
    nameEn: 'Triphala Churna Tablets',
    desc: 'Digestive Harmony',
    price: '₹1,200',
    href: '/products/triphala-churnam',
  },
  {
    id: 'prod-3',
    img: '/prod-tonic.png',
    badge: 'NATURAL',
    nameEn: 'Karpasasthiyadi Thailam',
    desc: 'Resolves Toxins',
    price: '₹1,450',
    href: '/products/neem-leaf-powder',
  },
];

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
    fetch('/api/products?sort=rating&limit=4', { cache: 'no-store' })
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

      {/* ══ CONSULT SECTION ════════════════════════════════════ */}
      <ConsultSection />

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
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ta';

  return (
    <section className="vt-landing-hero" style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      padding: '142px 32px 60px',
      marginTop: -62,
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
          fontFamily: "'Cormorant Garamond', 'Noto Serif Tamil', Georgia, serif",
          fontSize: 'clamp(1.8rem, 6vw, 4.2rem)',
          fontWeight: 300, lineHeight: 1.15,
          color: '#F5EDD6',
          margin: '0 0 36px',
          letterSpacing: '-0.01em',
          textShadow: '0 2px 40px rgba(0,0,0,0.60)',
        }}>
          {currentLang === 'ta' ? (
            <>
              பாரம்பரிய சித்த <br />
              மற்றும் ஆயுர்வேதம். <br />
              பண்டைய ஞானம், <br />
              மேம்படுத்தப்பட்டது.
            </>
          ) : (
            <>
              Authentic Siddha & Ayurveda. <br />
              Ancient Wisdom, Elevated.
            </>
          )}
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
          {currentLang === 'ta' ? 'தயாரிப்புகளை காணுங்கள்' : 'SHOP MEDICINES'}
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
    { img: '/cat-siddha.png',   badge: 'INSIGHTS', nameTa: 'Siddha Medicine',   href: '/products?tradition=siddha'   },
    { img: '/cat-ayurveda.png', badge: 'GUIDES',   nameTa: 'Ayurvedic Medicine', href: '/products?tradition=ayurveda' },
    { img: '/cat-natural.png',  badge: 'HERBS',    nameTa: 'Natural Wellness',   href: '/products?tradition=natural'  },
  ];

  return (
    <section style={{
      background: '#030C07',
      padding: '0 0 80px',
    }}>
      <div className="vt-traditions-grid">
        {cats.map(({ img, badge, nameTa, href }, i) => (
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
                  margin: 0, fontFamily: "'Cormorant Garamond',serif",
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)', fontWeight: 300,
                  color: '#F5EDD6', lineHeight: 1.25,
                }}>
                  {nameTa}
                </h2>
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
              margin: 0, fontFamily: "'Cormorant Garamond',serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300,
              color: '#F5EDD6', letterSpacing: '-0.01em', lineHeight: 1.1,
            }}>The Apotheccary</h2>
          </div>
          <Link href="/products" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.78rem', color: '#3D8A5C', fontWeight: 600,
            textDecoration: 'none', borderBottom: '1px solid rgba(61,138,92,0.35)',
            paddingBottom: 2, whiteSpace: 'nowrap',
          }}>
            View All Products
            <FontAwesomeIcon icon={faArrowRight} style={{ width: 12 }} />
          </Link>
        </div>

        {/* Static featured products grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 50 }}>
          {STATIC_PRODUCTS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <Link href={p.href} style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                textDecoration: 'none',
                background: 'rgba(10,20,15,0.90)',
                border: '1px solid rgba(61,138,92,0.16)',
                borderRadius: 0, overflow: 'hidden',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}>
                {/* Product image */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
                  <Image
                    src={p.img}
                    alt={p.nameEn}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                  {p.badge && (
                    <span style={{
                      position: 'absolute', top: 14, left: 14,
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(245,237,214,0.70)',
                      fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                      padding: '4px 10px', borderRadius: 0, textTransform: 'uppercase',
                    }}>
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Product info */}
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{
                    margin: '0 0 4px',
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: '1.2rem', fontWeight: 500,
                    color: '#F5EDD6', lineHeight: 1.3,
                  }}>
                    {p.nameEn}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(245,237,214,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {p.desc}
                  </p>
                  
                  {/* Spacer */}
                  <div style={{ flexGrow: 1, minHeight: 12 }} />
                  
                  {p.price && (
                    <p style={{
                      margin: 0,
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: '1.25rem', fontStyle: 'italic', fontWeight: 600,
                      color: '#F5EDD6',
                    }}>
                      {p.price}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Dynamic DB products if available */}
        {products.length > 0 && (
          <div style={{ marginTop: 60 }}>
            <p style={{
              margin: '0 0 10px', fontSize: '0.65rem', letterSpacing: '0.22em',
              textTransform: 'uppercase', color: '#3D8A5C', fontWeight: 600,
            }}>MORE FROM THE CATALOGUE</p>
            <h2 style={{
              margin: '0 0 28px', fontFamily: "'Cormorant Garamond',serif",
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 300,
              color: '#F5EDD6', letterSpacing: '-0.01em', lineHeight: 1.1,
            }}>Catalog Formulations</h2>
            <div className="vt-products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onWishlist={onWishlist} />
              ))}
            </div>
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
    { icon: faShieldHalved, en: 'VERIFIED CATALOGUE',  desc: 'Every batch lab-tested and certified to guarantee purity.' },
    { icon: faFileArrowUp,  en: 'RX-SAFE CHECKOUT',   desc: 'Secure validation of practitioner recommendations.' },
    { icon: faHeartPulse,   en: 'TAMIL FIRST',         desc: 'Rooted in heritage, personalized to your language.' },
    { icon: faTruck,        en: 'TRACK EVERY ORDER',   desc: 'Worry-free delivery experience with real-time updates.' },
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
   CONSULT SECTION — matches screenshot's 3-card grid
══════════════════════════════════════════════════════════════════ */
function ConsultSection() {
  return (
    <section style={{ padding: '80px 36px', background: '#030C07', borderTop: '1px solid rgba(61,138,92,0.10)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Heading */}
        <h2 style={{
          margin: '0 0 40px',
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          fontWeight: 300, color: '#F5EDD6', lineHeight: 1.2,
        }}>
          Your Health Consultations
        </h2>

        {/* 3 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          {/* Card 1 */}
          <div style={consultCard}>
            <span style={{ fontSize: '1.4rem', marginBottom: 4 }}>
              <FontAwesomeIcon icon={faCalendarDays} style={{ width: 26, height: 26, color: '#C9922A' }} />
            </span>
            <h3 style={consultTitle}>Book New Consultation</h3>
            <p style={consultDesc}>
              Schedule with specialists like Oncologists, Nutritionists.
            </p>
            <Link href="/help" style={consultBtn}>
              Book Appointment
            </Link>
          </div>

          {/* Card 2 */}
          <div style={consultCard}>
            <span style={{ fontSize: '1.4rem', marginBottom: 4 }}>
              <FontAwesomeIcon icon={faClock} style={{ width: 26, height: 26, color: '#4DA870' }} />
            </span>
            <h3 style={consultTitle}>Upcoming Appointments</h3>
            <div style={{ margin: '4px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <p style={{ ...consultDesc, fontWeight: 600, color: '#F5EDD6' }}>Dr. Sharma (Oncologist)</p>
              <p style={consultDesc}>Oct 25, 10:00 AM</p>
              <p style={{ ...consultDesc, color: 'rgba(245,237,214,0.35)' }}>Virtual Call</p>
            </div>
            <Link href="/help" style={consultBtn}>
              Join Meeting
            </Link>
            <Link href="/help" style={{ color: '#E8A820', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'underline', width: 'max-content', marginTop: 4 }}>
              Message Doctor
            </Link>
          </div>

          {/* Card 3 */}
          <div style={consultCard}>
            <span style={{ fontSize: '1.4rem', marginBottom: 4 }}>
              <FontAwesomeIcon icon={faBolt} style={{ width: 26, height: 26, color: '#F5EDD6' }} />
            </span>
            <h3 style={consultTitle}>Past Consultation Summaries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <div>
                <p style={{ ...consultDesc, fontWeight: 600, color: '#F5EDD6' }}>Dr. Lee (Nutritionist)</p>
                <p style={consultDesc}>Sept 15</p>
                <Link href="/help" style={{ color: '#E8A820', fontSize: '0.76rem', fontWeight: 600, textDecoration: 'underline' }}>
                  View Summary
                </Link>
              </div>
              <div>
                <p style={{ ...consultDesc, fontWeight: 600, color: '#F5EDD6' }}>Dr. Sharma</p>
                <p style={consultDesc}>Aug 01</p>
                <Link href="/help" style={{ color: '#E8A820', fontSize: '0.76rem', fontWeight: 600, textDecoration: 'underline' }}>
                  View Summary
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const consultCard: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(13,34,24,0.80), rgba(5,12,8,0.95))',
  border: '1px solid rgba(61,138,92,0.18)',
  borderRadius: 8, padding: '32px 28px',
  display: 'flex', flexDirection: 'column', gap: 10,
};
const consultTitle: React.CSSProperties = {
  margin: 0, fontFamily: "'Cormorant Garamond',serif",
  fontSize: '1.10rem', fontWeight: 500, color: '#F5EDD6', lineHeight: 1.35,
};
const consultDesc: React.CSSProperties = {
  margin: 0, fontSize: '0.80rem', color: 'rgba(245,237,214,0.50)', lineHeight: 1.65,
};
const consultBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
  padding: '10px 20px', borderRadius: 4,
  background: 'linear-gradient(135deg, #C9922A, #E8A820)',
  color: '#0A1A10', fontSize: '0.82rem', fontWeight: 700,
  textDecoration: 'none', letterSpacing: '0.03em', width: 'max-content',
};
