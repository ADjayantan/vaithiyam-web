'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faFileArrowUp, faShieldHalved,
  faTruck, faHeartPulse, faRotate,
  faTruck, faHeartPulse,
  faCalendarDays, faClock, faBolt,
  faCartShopping, faMagnifyingGlass,
  faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import type { SeedMedicine } from '@/lib/medicineData';
import { MobileBottomNav } from '@/components/layout/CustomerShell';
/* ─── token helpers ─────────────────────────────────────────────── */
/* ─── Global responsive styles ───────────────────────────────────── */
const GLOBAL_CSS = `
  /* ── Nav ─────────────────────────────────────────── */
  .vt-nav { padding: 0 20px; }
  .vt-nav-links { display: flex; }
  .vt-nav-link  { display: block; }
  /* ── Hero ────────────────────────────────────────── */
  .vt-hero-section { padding: 80px 20px 60px; }
  .vt-hero-h1 {
    font-size: clamp(2rem, 7.5vw, 4.2rem);
    margin-bottom: 32px;
  }
  /* ── Category grid ───────────────────────────────── */
  .vt-cat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .vt-cat-card { aspect-ratio: 3/4; }
  /* ── Collections ─────────────────────────────────── */
  .vt-col-wrap { padding: 80px 32px; }
  .vt-col-header { flex-direction: row; align-items: flex-end; }
  .vt-col-see-all { display: inline-flex; }
  .vt-col-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .vt-mini-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 40px;
  }
  /* ── Trust ───────────────────────────────────────── */
  .vt-trust-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
  }
  /* ── Consult ─────────────────────────────────────── */
  .vt-consult-wrap { padding: 80px 36px; }
  .vt-consult-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  /* ── Footer ──────────────────────────────────────── */
  .vt-footer-inner {
    display: grid;
    grid-template-columns: 1.8fr 1fr 1fr;
    gap: 40px;
  }
  /* ════════════════════════════════════════════════════
     TABLET  ≤ 900px
  ════════════════════════════════════════════════════ */
  @media (max-width: 900px) {
    .vt-nav-links { display: none; }
    .vt-cat-grid {
      grid-template-columns: 1fr;
    }
    .vt-cat-card { aspect-ratio: 16/9; }
    .vt-col-grid {
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .vt-mini-grid {
      grid-template-columns: 1fr 1fr;
    }
    .vt-trust-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    .vt-consult-grid {
      grid-template-columns: 1fr;
    }
    .vt-footer-inner {
      grid-template-columns: 1fr 1fr;
    }
    .vt-footer-brand { grid-column: 1 / -1; }
  }
  /* ════════════════════════════════════════════════════
     MOBILE  ≤ 600px
  ════════════════════════════════════════════════════ */
  @media (max-width: 600px) {
    /* Nav */
    .vt-nav { padding: 0 16px; height: 52px !important; }
    /* Hero */
    .vt-hero-section { padding: 64px 16px 48px; min-height: 90vh !important; }
    .vt-hero-h1 { font-size: clamp(1.7rem, 9vw, 2.6rem) !important; margin-bottom: 24px; }
    .vt-hero-cta {
      width: 100%; justify-content: center;
      padding: 13px 20px !important; font-size: 0.95rem !important;
    }
    /* Categories */
    .vt-cat-grid { grid-template-columns: 1fr; }
    .vt-cat-card { aspect-ratio: 4/3 !important; }
    .vt-cat-title { font-size: 1.3rem !important; }
    /* Collections */
    .vt-col-wrap { padding: 48px 16px 40px; }
    .vt-col-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    .vt-col-h2 { font-size: clamp(1.8rem, 8vw, 2.4rem) !important; }
    .vt-col-grid { grid-template-columns: 1fr; gap: 14px; }
    .vt-mini-grid { grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
    /* Trust */
    .vt-trust-section { padding: 40px 16px !important; }
    .vt-trust-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
    /* Consult */
    .vt-consult-wrap { padding: 48px 16px; }
    .vt-consult-h2 { font-size: clamp(1.5rem, 7vw, 2rem) !important; margin-bottom: 24px !important; }
    .vt-consult-grid { grid-template-columns: 1fr; gap: 12px; }
    .vt-consult-card { padding: 22px 18px !important; }
    .vt-consult-btn { width: 100%; justify-content: center; }
    /* Footer */
    .vt-footer-inner {
      grid-template-columns: 1fr;
      gap: 28px;
    }
    .vt-footer-brand { grid-column: unset; }
    .vt-footer-wrap { padding: 44px 16px 32px !important; }
  }
`;
/* ─── helpers ───────────────────────────────────────────────────── */
function getToken(): string | null {
  try { return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token'); }
  catch { return null; }
  const addToCart = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) { showToast('Please login to add medicines to cart.'); return; }
    if (!token) { showToast('உள்நுழைய வேண்டும்.'); return; }
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
      showToast(`${product.nameTa} சேர்க்கப்பட்டது.`);
    } catch (e) { showToast(e instanceof Error ? e.message : 'Could not add.'); }
  }, [showToast]);
  return (
    <div style={{ background: '#030C07', minHeight: '100dvh', color: '#F5EDD6', fontFamily: "'Outfit','Catamaran',sans-serif" }}>
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background: '#030C07', minHeight: '100dvh', color: '#F5EDD6', fontFamily: "'Outfit','Catamaran',sans-serif" }}>
        <SiteNav cartCount={cartCount} />
        <HeroSection />
        <CategorySection />
        <CollectionsSection products={bestsellers} onAddToCart={addToCart} />
        <TrustStrip />
        <ConsultSection />
        <SiteFooter />
        <MobileBottomNav />
      {/* ══ TOP NAV ══════════════════════════════════════════════ */}
      <SiteNav cartCount={cartCount} />
      {/* ══ HERO ════════════════════════════════════════════════ */}
      <HeroSection />
      {/* ══ CATEGORIES ═════════════════════════════════════════ */}
      <CategorySection />
      {/* ══ COLLECTIONS (Products) ═════════════════════════════ */}
      <CollectionsSection products={bestsellers} onAddToCart={addToCart} />
      {/* ══ TRUST STRIP ════════════════════════════════════════ */}
      <TrustStrip />
      {/* ══ CONSULT CTA ════════════════════════════════════════ */}
      <ConsultSection />
      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <SiteFooter />
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
        {toast && (
          <div role="status" style={{
            position: 'fixed', left: '50%', bottom: 94, zIndex: 150,
            transform: 'translateX(-50%)', whiteSpace: 'nowrap',
            background: 'rgba(61,138,92,0.95)', color: '#fff',
            padding: '10px 20px', borderRadius: 999, fontSize: '0.86rem', fontWeight: 600,
            maxWidth: 'calc(100vw - 32px)', textAlign: 'center', whiteSpaceCollapse: 'collapse',
          }}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
/* ══════════════════════════════════════════════════════════════════
   TOP NAV — matches screenshot: brand left, nav links center, icons right
   TOP NAV
══════════════════════════════════════════════════════════════════ */
function SiteNav({ cartCount }: { cartCount: number }) {
  return (
    <nav style={{
    <nav className="vt-nav" style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(3,12,7,0.82)',
      background: 'rgba(3,12,7,0.88)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(61,138,92,0.12)',
      padding: '0 32px', height: 56,
      height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 20,
      gap: 16,
    }}>
      {/* Brand */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, #3D8A5C, #C9922A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <FontAwesomeIcon icon={faLeaf} style={{ width: 15, height: 15, color: '#fff' }} />
          <FontAwesomeIcon icon={faLeaf} style={{ width: 14, height: 14, color: '#fff' }} />
        </span>
        <span style={{
          fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
          fontSize: '1.15rem', fontWeight: 600, color: '#F5EDD6', letterSpacing: '0.02em',
          fontSize: '1.1rem', fontWeight: 600, color: '#F5EDD6', letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>
          வைத்தியம்
        </span>
      </Link>
      {/* Center nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
      {/* Center nav — hidden on mobile via CSS */}
      <div className="vt-nav-links" style={{ alignItems: 'center', gap: 24, flex: 1, justifyContent: 'center' }}>
        {[
          { label: 'சித்த மருத்துவம்', href: '/products?tradition=siddha' },
          { label: 'ஆயுர்வேதம்',       href: '/products?tradition=ayurveda' },
          { label: 'இயற்கை',            href: '/products?tradition=natural' },
          { label: 'ஆரோக்கியம்',        href: '/products' },
          { label: 'நம்பகம்',           href: '/help' },
        ].map(({ label, href }) => (
          <Link key={label} href={href} style={{
          <Link key={label} href={href} className="vt-nav-link" style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: '0.90rem', color: 'rgba(245,237,214,0.70)',
            textDecoration: 'none', fontWeight: 400, letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s',
            fontSize: '0.88rem', color: 'rgba(245,237,214,0.68)',
            textDecoration: 'none', fontWeight: 400, whiteSpace: 'nowrap',
          }}>
            {label}
          </Link>
        ))}
      </div>
      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Link href="/products" aria-label="Search" style={iconBtn}>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 16, height: 16 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Link href="/products" aria-label="Search" style={iconBtnStyle}>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 15, height: 15 }} />
        </Link>
        <Link href="/cart" aria-label="Cart" style={{ ...iconBtn, position: 'relative' }}>
          <FontAwesomeIcon icon={faCartShopping} style={{ width: 16, height: 16 }} />
        <Link href="/cart" aria-label="Cart" style={{ ...iconBtnStyle, position: 'relative' }}>
          <FontAwesomeIcon icon={faCartShopping} style={{ width: 15, height: 15 }} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 15, height: 15, borderRadius: '50%',
              background: '#D4890A', color: '#000',
              fontSize: '0.58rem', fontWeight: 700,
              fontSize: '0.56rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </Link>
      </div>
    </nav>
  );
}
const iconBtn: React.CSSProperties = {
const iconBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(61,138,92,0.18)',
  color: 'rgba(245,237,214,0.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  textDecoration: 'none',
  textDecoration: 'none', flexShrink: 0,
};
/* ══════════════════════════════════════════════════════════════════
   HERO — full viewport with tropical leaf photo background
   HERO
══════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section style={{
    <section className="vt-hero-section" style={{
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
          background: 'linear-gradient(to bottom, rgba(3,12,7,0.30) 0%, rgba(3,12,7,0.52) 50%, rgba(3,12,7,0.90) 100%)',
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
        <h1 className="vt-hero-h1" style={{
          fontFamily: "'Cormorant Garamond','Noto Serif Tamil',Georgia,serif",
          fontSize: 'clamp(2.2rem, 6vw, 4.2rem)',
          fontWeight: 300, lineHeight: 1.15,
          color: '#F5EDD6',
          margin: '0 0 36px',
          margin: '0 0 32px',
          letterSpacing: '-0.01em',
          textShadow: '0 2px 40px rgba(0,0,0,0.60)',
        }}>
          பாரம்பரிய சித்த மற்றும் ஆயுர்வேதம்.<br />
          பண்டைய ஞானம், மேம்படுத்தப்பட்டது.
        </h1>
        {/* Gold CTA */}
        <Link href="/products" style={{
        <Link href="/products" className="vt-hero-cta" style={{
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
        style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,214,0.45)" strokeWidth="1.5" strokeLinecap="round">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,214,0.40)" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.div>
    </section>
  );
}
/* ══════════════════════════════════════════════════════════════════
   CATEGORIES — 3 dark cards with real product images
   CATEGORIES
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 0,
        maxWidth: '100%',
      }}>
    <section style={{ background: '#030C07', paddingBottom: 64 }}>
      <div className="vt-cat-grid">
        {cats.map(({ img, badge, nameTa, nameEn, href }, i) => (
          <motion.div
            key={badge}
            className="vt-cat-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <Link href={href} style={{ display: 'block', position: 'relative', textDecoration: 'none', overflow: 'hidden', aspectRatio: '3/4' }}>
            <Link href={href} style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none', position: 'relative' }}>
              <Image
                src={img}
                alt={nameTa}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.6s ease' }}
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
              {/* Dark gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(3,12,7,0.10) 30%, rgba(3,12,7,0.85) 100%)',
                background: 'linear-gradient(to bottom, rgba(3,12,7,0.08) 30%, rgba(3,12,7,0.82) 100%)',
              }} />
              {/* Text */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '28px 24px',
              }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px' }}>
                <span style={{
                  display: 'block', fontSize: '0.62rem', letterSpacing: '0.20em',
                  display: 'block', fontSize: '0.60rem', letterSpacing: '0.20em',
                  color: 'rgba(245,237,214,0.50)', fontWeight: 600, textTransform: 'uppercase',
                  marginBottom: 8,
                  marginBottom: 6,
                }}>
                  {badge}
                </span>
                <h2 style={{
                <h2 className="vt-cat-title" style={{
                  margin: 0, fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)', fontWeight: 300,
                  fontSize: 'clamp(1.15rem, 2.5vw, 1.7rem)', fontWeight: 300,
                  color: '#F5EDD6', lineHeight: 1.25,
                }}>
                  {nameTa}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.70rem', color: 'rgba(245,237,214,0.42)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: 'rgba(245,237,214,0.40)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
/* ══════════════════════════════════════════════════════════════════
   COLLECTIONS — product cards with photography
   COLLECTIONS
══════════════════════════════════════════════════════════════════ */
const STATIC_PRODUCTS = [
  {
    id: 'prod-1',
    img: '/prod-restoration.png',
    badge: 'MYTHOLOGY',
    nameTa: 'நூல் அஸ்வந்தர சாறு',
    nameEn: 'Restoration Adaptogen',
    price: null,
    accent: '#C9922A',
    href: '/products',
    id: 'prod-1', img: '/prod-restoration.png', badge: 'MYTHOLOGY',
    nameTa: 'நூல் அஸ்வந்தர சாறு', nameEn: 'Restoration Adaptogen',
    price: null, href: '/products',
  },
  {
    id: 'prod-2',
    img: '/prod-harmony.png',
    badge: 'DILANCO',
    nameTa: 'திபோசா குரண மாந்திரிகள்',
    nameEn: 'Digestive Harmony',
    price: '₹1,850',
    accent: '#3D8A5C',
    href: '/products',
    id: 'prod-2', img: '/prod-harmony.png', badge: 'DILANCO',
    nameTa: 'திபோசா குரண மாந்திரிகள்', nameEn: 'Digestive Harmony',
    price: '₹1,850', href: '/products',
  },
  {
    id: 'prod-3',
    img: '/prod-tonic.png',
    badge: null,
    nameTa: 'கேரழி ஜீரணம்',
    nameEn: 'Kerrine Tonic',
    price: '₹1,200',
    accent: '#4DA870',
    href: '/products',
    id: 'prod-3', img: '/prod-tonic.png', badge: null,
    nameTa: 'கேரழி ஜீரணம்', nameEn: 'Kerrine Tonic',
    price: '₹1,200', href: '/products',
  },
];
function CollectionsSection({ products, onAddToCart }: { products: SeedMedicine[]; onAddToCart: (p: SeedMedicine) => void }) {
  return (
    <section style={{ background: '#030C07', padding: '80px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 36px' }}>
        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
    <section style={{ background: '#030C07' }}>
      <div className="vt-col-wrap">
        {/* Header */}
        <div className="vt-col-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <p style={{
              margin: '0 0 10px', fontSize: '0.65rem', letterSpacing: '0.22em',
              margin: '0 0 10px', fontSize: '0.63rem', letterSpacing: '0.22em',
              textTransform: 'uppercase', color: '#3D8A5C', fontWeight: 600,
            }}>COLLECTIONS</p>
            <h2 style={{
            <h2 className="vt-col-h2" style={{
              margin: 0, fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300,
              fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300,
              color: '#F5EDD6', letterSpacing: '-0.01em', lineHeight: 1.1,
            }}>மருந்தகம்</h2>
          </div>
          <Link href="/products" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.78rem', color: '#3D8A5C', fontWeight: 600,
          <Link href="/products" className="vt-col-see-all" style={{
            alignItems: 'center', gap: 6,
            fontSize: '0.76rem', color: '#3D8A5C', fontWeight: 600,
            textDecoration: 'none', borderBottom: '1px solid rgba(61,138,92,0.35)',
            paddingBottom: 2, whiteSpace: 'nowrap',
            paddingBottom: 2, whiteSpace: 'nowrap', alignSelf: 'flex-end',
          }}>
            தனாளடு தமிழ்ப்புவரையுப்பு காண்க
            <FontAwesomeIcon icon={faArrowRight} style={{ width: 12 }} />
            தனாளடு காண்க
            <FontAwesomeIcon icon={faArrowRight} style={{ width: 11 }} />
          </Link>
        </div>
        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {/* Static product grid */}
        <div className="vt-col-grid">
          {STATIC_PRODUCTS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={p.href} style={{
                display: 'block', textDecoration: 'none',
                background: 'rgba(10,20,15,0.90)',
                border: '1px solid rgba(61,138,92,0.16)',
                borderRadius: 4, overflow: 'hidden',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}>
                {/* Product image */}
                <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                  <Image
                    src={p.img}
                    alt={p.nameTa}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                  <Image src={p.img} alt={p.nameTa} fill style={{ objectFit: 'cover' }} />
                  {p.badge && (
                    <span style={{
                      position: 'absolute', top: 14, left: 14,
                      position: 'absolute', top: 12, left: 12,
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(245,237,214,0.70)',
                      fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                      padding: '4px 10px', borderRadius: 2, textTransform: 'uppercase',
                      fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em',
                      padding: '3px 9px', borderRadius: 2, textTransform: 'uppercase',
                    }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                {/* Product info */}
                <div style={{ padding: '18px 20px' }}>
                <div style={{ padding: '16px 18px' }}>
                  <h3 style={{
                    margin: '0 0 4px',
                    margin: '0 0 3px',
                    fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
                    fontSize: '1.05rem', fontWeight: 500,
                    fontSize: '1.02rem', fontWeight: 500,
                    color: '#F5EDD6', lineHeight: 1.3,
                  }}>
                    {p.nameTa}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(245,237,214,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(245,237,214,0.36)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {p.nameEn}
                  </p>
                  {p.price && (
                    <p style={{
                      margin: '10px 0 0',
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 600,
                      fontSize: '1.05rem', fontStyle: 'italic', fontWeight: 600,
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
        {/* Dynamic DB products */}
        {products.length > 0 && (
          <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <div className="vt-mini-grid">
            {products.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                viewport={{ once: true, amount: 0.2 }}
                style={{
                  background: 'rgba(10,20,15,0.85)', border: '1px solid rgba(61,138,92,0.16)',
                  borderRadius: 4, overflow: 'hidden',
                }}
              >
                <div style={{ padding: 16 }}>
                <div style={{ padding: 14 }}>
                  <div style={{
                    height: 100, background: 'rgba(61,138,92,0.10)', borderRadius: 4,
                    marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem',
                    height: 88, background: 'rgba(61,138,92,0.10)', borderRadius: 3,
                    marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem',
                  }}>🌿</div>
                  <h3 style={{ margin: '0 0 4px', fontFamily: "'Cormorant Garamond',serif", fontSize: '0.95rem', color: '#F5EDD6', fontWeight: 500 }}>
                  <h3 style={{ margin: '0 0 3px', fontFamily: "'Cormorant Garamond',serif", fontSize: '0.90rem', color: '#F5EDD6', fontWeight: 500 }}>
                    {p.nameTa}
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: '0.68rem', color: 'rgba(245,237,214,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '0.63rem', color: 'rgba(245,237,214,0.36)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {p.nameEn}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', fontStyle: 'italic', color: '#F5EDD6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '0.95rem', fontStyle: 'italic', color: '#F5EDD6' }}>
                      ₹{p.price}
                    </span>
                    <button
                      onClick={() => void onAddToCart(p)}
                      style={{
                        padding: '6px 14px', border: 'none', borderRadius: 3,
                        padding: '5px 12px', border: 'none', borderRadius: 3,
                        background: 'linear-gradient(135deg, #2E6845, #3D8A5C)',
                        color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                        color: '#fff', fontSize: '0.70rem', fontWeight: 600, cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Add
                      சேர்
                    </button>
                  </div>
                </div>
}
/* ══════════════════════════════════════════════════════════════════
   TRUST STRIP — 4 feature badges
   TRUST STRIP
══════════════════════════════════════════════════════════════════ */
function TrustStrip() {
  const items = [
    { icon: faShieldHalved, en: 'VERIFIED CATALOGUE',  desc: 'Every product verified and certified to ensure its purity.' },
    { icon: faFileArrowUp,  en: 'RX-SAFE CHECKOUT',   desc: 'Secure review of prescription recommendations to you.' },
    { icon: faHeartPulse,   en: 'TAMIL FIRST',         desc: 'Wholly Tamil support. Heritage recommendations in your language.' },
    { icon: faTruck,        en: 'TRACK EVERY ORDER',   desc: 'Worry-free delivery experience from our real-time systems.' },
    { icon: faHeartPulse,   en: 'TAMIL FIRST',         desc: 'Heritage recommendations in your language, always.' },
    { icon: faTruck,        en: 'TRACK EVERY ORDER',   desc: 'Worry-free delivery from our real-time tracking systems.' },
  ];
  return (
    <section style={{
    <section className="vt-trust-section" style={{
      background: 'rgba(10,20,15,0.60)',
      borderTop:    '1px solid rgba(61,138,92,0.12)',
      borderTop: '1px solid rgba(61,138,92,0.12)',
      borderBottom: '1px solid rgba(61,138,92,0.12)',
      padding: '48px 36px',
      padding: '48px 32px',
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
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="vt-trust-grid">
          {items.map(({ icon, en, desc }) => (
            <div key={en} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FontAwesomeIcon icon={icon} style={{ width: 22, height: 22, color: '#3D8A5C' }} />
              <strong style={{ fontSize: '0.66rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F5EDD6', fontWeight: 700 }}>
                {en}
              </strong>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'rgba(245,237,214,0.44)', lineHeight: 1.65 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
/* ══════════════════════════════════════════════════════════════════
   CONSULT SECTION — matches screenshot's 3-card grid
   CONSULT SECTION
══════════════════════════════════════════════════════════════════ */
function ConsultSection() {
  return (
    <section style={{ padding: '80px 36px', background: '#030C07' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Heading */}
        <h2 style={{
          margin: '0 0 40px',
    <section style={{ background: '#030C07' }}>
      <div className="vt-consult-wrap">
        <h2 className="vt-consult-h2" style={{
          fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 300, color: '#F5EDD6', lineHeight: 1.2,
          margin: '0 0 36px',
        }}>
          உங்கள் சுகாதார ஆலோசனைகள்
        </h2>
        {/* 3 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="vt-consult-grid">
          {/* Card 1 */}
          <div style={consultCard}>
            <span style={{ fontSize: '1.4rem', marginBottom: 4 }}>
              <FontAwesomeIcon icon={faCalendarDays} style={{ width: 26, height: 26, color: '#C9922A' }} />
            </span>
            <h3 style={consultTitle}>புதிய ஆலோசனையை திட்டமிடுங்கள்</h3>
            <p style={consultDesc}>
              Schedule with specialists live on GrowthClinic, daily at 11:30 AM
            </p>
            <Link href="/help" style={consultBtn}>
          <div className="vt-consult-card" style={cCard}>
            <FontAwesomeIcon icon={faCalendarDays} style={{ width: 24, height: 24, color: '#C9922A' }} />
            <h3 style={cTitle}>புதிய ஆலோசனையை திட்டமிடுங்கள்</h3>
            <p style={cDesc}>Schedule with specialists live on GrowthClinic, daily at 11:30 AM</p>
            <Link href="/help" className="vt-consult-btn" style={cBtn}>
              நேரடி தள்ளுவாரை <FontAwesomeIcon icon={faArrowRight} style={{ width: 11 }} />
            </Link>
          </div>
          {/* Card 2 */}
          <div style={consultCard}>
            <FontAwesomeIcon icon={faClock} style={{ width: 26, height: 26, color: '#4DA870', marginBottom: 4 }} />
            <h3 style={consultTitle}>வரவிருக்கும் நியமனங்கள்</h3>
            <p style={consultDesc}>
              அடுத்த ஆலோசனை: Tue, 11:30 AM
            </p>
          <div className="vt-consult-card" style={cCard}>
            <FontAwesomeIcon icon={faClock} style={{ width: 24, height: 24, color: '#4DA870' }} />
            <h3 style={cTitle}>வரவிருக்கும் நியமனங்கள்</h3>
            <p style={cDesc}>அடுத்த ஆலோசனை: Tue, 11:30 AM</p>
            <span style={{
              display: 'inline-block', padding: '5px 12px', borderRadius: 999,
              display: 'inline-block', padding: '4px 12px', borderRadius: 999, width: 'max-content',
              background: 'rgba(212,137,10,0.16)', color: '#E8A820',
              fontSize: '0.70rem', fontWeight: 700, letterSpacing: '0.05em',
              border: '1px solid rgba(212,137,10,0.24)', marginTop: 4,
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
              border: '1px solid rgba(212,137,10,0.24)',
            }}>
              இலவச சிறு உதவி
            </span>
            <Link href="/help" style={{ ...consultBtn, marginTop: 14 }}>
            <Link href="/help" className="vt-consult-btn" style={cBtn}>
              அட்டவணை காண்க <FontAwesomeIcon icon={faArrowRight} style={{ width: 11 }} />
            </Link>
          </div>
          {/* Card 3 */}
          <div style={consultCard}>
            <FontAwesomeIcon icon={faBolt} style={{ width: 26, height: 26, color: '#F5EDD6', marginBottom: 4 }} />
            <h3 style={consultTitle}>உடனடி சுகாதார சிறு சலுகைகள்</h3>
            <p style={consultDesc}>
              Words, great delivery recommendations across our Tamil language systems.
            </p>
            <p style={{ ...consultDesc, marginTop: 6, color: 'rgba(245,237,214,0.35)' }}>
              Wholly great effort
            </p>
          <div className="vt-consult-card" style={cCard}>
            <FontAwesomeIcon icon={faBolt} style={{ width: 24, height: 24, color: '#F5EDD6' }} />
            <h3 style={cTitle}>உடனடி சுகாதார சிறு சலுகைகள்</h3>
            <p style={cDesc}>Tamil language recommendations across our wellness systems.</p>
            <p style={{ ...cDesc, color: 'rgba(245,237,214,0.30)', marginTop: 4 }}>Wholly great effort</p>
          </div>
        </div>
      </div>
    </section>
  );
}
const consultCard: React.CSSProperties = {
const cCard: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(13,34,24,0.80), rgba(5,12,8,0.95))',
  border: '1px solid rgba(61,138,92,0.18)',
  borderRadius: 8, padding: '32px 28px',
  borderRadius: 8, padding: '28px 24px',
  display: 'flex', flexDirection: 'column', gap: 10,
};
const consultTitle: React.CSSProperties = {
const cTitle: React.CSSProperties = {
  margin: 0, fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
  fontSize: '1.10rem', fontWeight: 500, color: '#F5EDD6', lineHeight: 1.35,
  fontSize: '1.08rem', fontWeight: 500, color: '#F5EDD6', lineHeight: 1.35,
};
const consultDesc: React.CSSProperties = {
  margin: 0, fontSize: '0.80rem', color: 'rgba(245,237,214,0.50)', lineHeight: 1.65,
const cDesc: React.CSSProperties = {
  margin: 0, fontSize: '0.78rem', color: 'rgba(245,237,214,0.48)', lineHeight: 1.65,
};
const consultBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
const cBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
  padding: '10px 20px', borderRadius: 4,
  background: 'linear-gradient(135deg, #C9922A, #E8A820)',
  color: '#0A1A10', fontSize: '0.82rem', fontWeight: 700,
  color: '#0A1A10', fontSize: '0.80rem', fontWeight: 700,
  textDecoration: 'none', letterSpacing: '0.03em', width: 'max-content',
};
/* ══════════════════════════════════════════════════════════════════
   FOOTER — matches screenshot dark footer with 3 columns
   FOOTER
══════════════════════════════════════════════════════════════════ */
function SiteFooter() {
  return (
    <footer style={{
    <footer className="vt-footer-wrap" style={{
      background: '#050e08',
      borderTop: '1px solid rgba(61,138,92,0.10)',
      padding: '60px 36px 40px',
      padding: '60px 36px 44px',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.8fr 1fr 1fr',
        gap: 40, alignItems: 'start',
      }}>
        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, #3D7A55, #C9922A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faLeaf} style={{ width: 20, height: 20, color: '#fff' }} />
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="vt-footer-inner">
          {/* Brand */}
          <div className="vt-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #3D7A55, #C9922A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesomeIcon icon={faLeaf} style={{ width: 18, height: 18, color: '#fff' }} />
              </div>
              <div>
                <p style={{
                  margin: 0, fontFamily: "'Cormorant Garamond',serif",
                  fontSize: '1.25rem', fontWeight: 600, color: '#F5EDD6',
                }}>Vaithiyam</p>
                <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(245,237,214,0.32)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Premium Medical-Commerce Demo
                </p>
              </div>
            </div>
            <div>
              <p style={{
                margin: 0, fontFamily: "'Cormorant Garamond',serif",
                fontSize: '1.3rem', fontWeight: 600, color: '#F5EDD6',
              }}>Vaithiyam</p>
              <p style={{ margin: 0, fontSize: '0.60rem', color: 'rgba(245,237,214,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Premium Medical-Commerce Demo
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(245,237,214,0.38)', lineHeight: 1.7, maxWidth: 300 }}>
              Bringing Traditional Indian medicine to the bedside of global luxury medical cuisine.
            </p>
            <p style={{ margin: '24px 0 0', fontSize: '0.64rem', color: 'rgba(245,237,214,0.20)', letterSpacing: '0.03em' }}>
              © 2023 VAITHIYAM, DILANCO MEDICAL CUISINE.
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(245,237,214,0.40)', lineHeight: 1.7, maxWidth: 300 }}>
            Bringing Traditional Indian medicine to<br />
            the bedside of global luxury medical cuisine.
          </p>
          <p style={{ margin: '28px 0 0', fontSize: '0.68rem', color: 'rgba(245,237,214,0.22)', letterSpacing: '0.04em' }}>
            © 2023 VAITHIYAM, DILANCO MEDICAL CUISINE.
          </p>
        </div>
        {/* Categories */}
        <div>
          <h4 style={{
            margin: '0 0 20px', fontSize: '0.65rem', letterSpacing: '0.20em',
            textTransform: 'uppercase', color: 'rgba(245,237,214,0.50)', fontWeight: 600,
          }}>CATEGORIES</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            {['SIDDHA', 'AYURVEDA', 'NATURAL'].map(l => (
              <Link key={l} href={`/products?tradition=${l.toLowerCase()}`} style={{
                fontSize: '0.82rem', color: 'rgba(245,237,214,0.55)', textDecoration: 'none',
                letterSpacing: '0.04em', transition: 'color 0.2s',
              }}>{l}</Link>
            ))}
          {/* Categories */}
          <div>
            <h4 style={{
              margin: '0 0 18px', fontSize: '0.62rem', letterSpacing: '0.20em',
              textTransform: 'uppercase', color: 'rgba(245,237,214,0.48)', fontWeight: 600,
            }}>CATEGORIES</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {['SIDDHA', 'AYURVEDA', 'NATURAL'].map(l => (
                <Link key={l} href={`/products?tradition=${l.toLowerCase()}`} style={{
                  fontSize: '0.80rem', color: 'rgba(245,237,214,0.52)', textDecoration: 'none',
                  letterSpacing: '0.04em',
                }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
        {/* Legals */}
        <div>
          <h4 style={{
            margin: '0 0 20px', fontSize: '0.65rem', letterSpacing: '0.20em',
            textTransform: 'uppercase', color: 'rgba(245,237,214,0.50)', fontWeight: 600,
          }}>LEGALS</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'PRIVACY POLICY',        href: '/privacy' },
              { label: 'TERMS OF SERVICE',       href: '/terms' },
              { label: 'HEALTH DISCLAIMER',      href: '/terms' },
              { label: 'EDITORIAL GUIDELINES',   href: '/terms' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} style={{
                fontSize: '0.78rem', color: 'rgba(245,237,214,0.50)', textDecoration: 'none',
                letterSpacing: '0.04em',
              }}>{label}</Link>
            ))}
          {/* Legals */}
          <div>
            <h4 style={{
              margin: '0 0 18px', fontSize: '0.62rem', letterSpacing: '0.20em',
              textTransform: 'uppercase', color: 'rgba(245,237,214,0.48)', fontWeight: 600,
            }}>LEGALS</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'PRIVACY POLICY',      href: '/privacy' },
                { label: 'TERMS OF SERVICE',     href: '/terms' },
                { label: 'HEALTH DISCLAIMER',    href: '/terms' },
                { label: 'EDITORIAL GUIDELINES', href: '/terms' },
              ].map(({ label, href }) => (
                <Link key={label} href={href} style={{
                  fontSize: '0.76rem', color: 'rgba(245,237,214,0.48)', textDecoration: 'none',
                  letterSpacing: '0.03em',
                }}>{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
