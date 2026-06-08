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
    <section className="vt-hero">
      <div className="vt-container vt-hero-grid">
        <motion.div
          className="vt-hero-text"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="vt-hero-eyebrow">
            <span style={{ display:'block', width:28, height:1, background:'var(--vt-saffron)', flexShrink:0 }} />
            Antigravity Wellness
            <span style={{ fontFamily:'var(--vt-font-display)', fontStyle:'italic', color:'rgba(245,237,214,0.5)', letterSpacing:'0.05em', fontSize:'0.85rem' }}>
              சித்த மருத்துவம் · ஆயுர்வேதம்
            </span>
          </span>
          <h1 className="vt-hero-h1">
            Authentic<br />Siddha &amp;<br />
            <span className="vt-hero-h1-accent">
              <span className="vt-hero-h1-float">Ayurveda</span>
            </span>
            <strong>Medicine</strong>
          </h1>
          <p className="vt-hero-copy">
            Verified traditional medicines with Tamil-first labels,
            prescription-aware checkout, and educational safety information.
            Ancient wisdom. Elevated.
          </p>
          <div className="vt-hero-actions">
            <ButtonLink href="/products" variant="gold">
              🌿 Shop Medicines
            </ButtonLink>
            <ButtonLink href="/prescriptions" variant="ghost">
              <FontAwesomeIcon icon={faFileArrowUp} style={{ width: 16 }} /> Upload Rx
            </ButtonLink>
          </div>

          {/* Trust badges */}
          <div className="vt-hero-trust">
            {[
              [faShieldHalved, 'Prescription-aware'],
              [faCircleCheck,  'Verified products'],
              [faHeadphones,   'Tamil support'],
            ].map(([icon, label]) => (
              <span key={String(label)} className="vt-hero-trust-item">
                <FontAwesomeIcon icon={icon as IconDefinition} style={{ width: 13 }} aria-hidden />
                {String(label)}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="vt-hero-stats">
            <div className="vt-hero-stat">
              <span className="vt-hero-stat-num">2,400<span>+</span></span>
              <span className="vt-hero-stat-label">Products</span>
            </div>
            <div className="vt-hero-stat-divider" />
            <div className="vt-hero-stat">
              <span className="vt-hero-stat-num">100<span>%</span></span>
              <span className="vt-hero-stat-label">Verified</span>
            </div>
            <div className="vt-hero-stat-divider" />
            <div className="vt-hero-stat">
              <span className="vt-hero-stat-num">24<span>h</span></span>
              <span className="vt-hero-stat-label">Dispatch</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="vt-hero-visual"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
        {/* Hero floating product cards */}
        {[
          {
            icon: '🪴', iconColor: '#00c8c2', iconBg: 'rgba(0,200,194,0.18)',
            badge: 'Siddha', badgeColor: '#00c8c2',
            nameTa: 'அஸ்வகந்தா சூர்ணம்', sub: 'Ashwagandha Churnam · 100g',
            price: '₹185', mrp: '₹220', off: '16%',
            glow: 'rgba(0,200,194,0.22)', delay: 0,
          },
          {
            icon: '🌿', iconColor: '#f0c84a', iconBg: 'rgba(240,200,74,0.18)',
            badge: 'Ayurveda', badgeColor: '#f0c84a',
            nameTa: 'திரிபல சூரணம்', sub: 'Triphala Churnam · 100g',
            price: '₹180', mrp: '₹220', off: '18%',
            glow: 'rgba(240,200,74,0.20)', delay: 0.8,
          },
          {
            icon: '🌱', iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.18)',
            badge: 'Natural', badgeColor: '#a78bfa',
            nameTa: 'நெல்லிக்காய் ஜூஸ்', sub: 'Amla Juice · 500ml',
            price: '₹95', mrp: '₹120', off: '21%',
            glow: 'rgba(167,139,250,0.20)', delay: 1.4,
          },
        ].map((card) => (
          <motion.div
            key={card.nameTa}
            className="vt-hero-float-card"
            style={{ '--card-glow': card.glow } as React.CSSProperties}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
          >
            {/* Icon column */}
            <span className="vt-hero-fc-icon" style={{ background: card.iconBg, fontSize: '1.6rem' }}>
              {card.icon}
            </span>
            {/* Info column */}
            <div className="vt-hero-fc-info">
              <span className="vt-hero-fc-badge" style={{ color: card.badgeColor }}>
                {card.badge}
              </span>
              <strong className="vt-hero-fc-name">{card.nameTa}</strong>
              <span className="vt-hero-fc-sub">{card.sub}</span>
              <div className="vt-hero-fc-price">
                <span>{card.price}</span>
                <span className="vt-mrp">{card.mrp}</span>
                <span className="vt-hero-fc-off">{card.off} off</span>
              </div>
            </div>
          </motion.div>
        ))}
          <span className="vt-hero-leaf vt-hero-leaf-1" />
          <span className="vt-hero-leaf vt-hero-leaf-2" />
        </motion.div>
      </div>
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
  return (
    <section className="vt-consult-section">
      <div className="vt-container vt-consult-inner">
        <span className="vt-consult-icon" aria-hidden>
          <FontAwesomeIcon icon={faStethoscope} style={{ width: 30, height: 30 }} />
        </span>
        <div className="vt-consult-text">
          <h2 className="vt-consult-h2">மருத்துவர் ஆலோசனை தேவையா?</h2>
          <p className="vt-consult-sub">
            Not sure which medicine is right for you? Our partner AYUSH-registered vaidyas can guide you to the right product.
          </p>
          <div className="vt-consult-trust">
            <span>✓ AYUSH Registered</span><span>·</span>
            <span>✓ Tamil-speaking</span><span>·</span>
            <span>✓ Online consultation</span>
          </div>
        </div>
        <div className="vt-consult-actions">
          <ButtonLink href="/help" variant="gold">Book Free Consultation</ButtonLink>
          <ButtonLink href="/prescriptions" variant="ghost">
            <FontAwesomeIcon icon={faFileArrowUp} style={{ width: 15 }} /> Upload Prescription
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
