'use client';

/**
 * apps/web/app/order/failure/page.tsx
 *
 * Vaithiyam — Order Failure Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Route ───────────────────────────────────────────────────────────────────
 *   /order/failure?orderId=<id>&error=<message>&code=<RAZORPAY_CODE>&amount=<INR>
 *
 * ─── Flow ────────────────────────────────────────────────────────────────────
 *   1. Checkout's useRazorpay onFailure callback navigates here with params
 *   2. Reads params via useSearchParams()
 *   3. Renders OrderFailureCard with mapped props
 *   4. Generic fallback if no params are present (direct URL access)
 *
 * ─── Components used ─────────────────────────────────────────────────────────
 *   OrderFailureCard  (apps/web/components/order/OrderFailureCard.tsx)
 */

import { Suspense }               from 'react';
import { useSearchParams }        from 'next/navigation';
import Link                       from 'next/link';
import { FontAwesomeIcon }        from '@fortawesome/react-fontawesome';
import {
  faMobileScreen, faMoneyBill, faCreditCard, faBuilding, faPhone,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition }    from '@fortawesome/fontawesome-svg-core';
import OrderFailureCard           from '../../../components/order/OrderFailureCard';
import { CustomerHeader, CustomerFooter, MobileBottomNav } from '@/components/layout/CustomerShell';

// ─── Design tokens (mirrors all order components exactly) ─────────────────────
const T = {
  forestPrimary: 'var(--vt-forest-700)',
  forestDark:    'var(--vt-forest-900)',
  creamBase:     'var(--vt-void)',
  creamAlt:      'rgba(255, 255, 255, 0.05)',
  gold:          'var(--vt-gold-500)',
  goldPale:      'var(--vt-gold-300)',
  leaf:          'var(--vt-forest-600)',
  saffron:       'var(--vt-saffron)',
  terracotta:    'var(--vt-coral-500)',
  darkText:      'var(--vt-ink)',
  secondaryText: 'var(--vt-ink-80)',
  muted:         'var(--vt-muted)',
  border:        'var(--vt-border)',
} as const;

const FONT = {
  display: "var(--vt-font-display)",
  body:    "var(--vt-font-body)",
  serif:   "var(--vt-font-serif)",
} as const;

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function OrderFailurePage() {
  return (
    <div
      style={{
        minHeight:     '100dvh',
        background:    T.creamBase,
        display:       'flex',
        flexDirection: 'column',
      }}
    >
      <CustomerHeader />

      <main
        style={{
          flex:       1,
          maxWidth:   '600px',
          width:      '100%',
          margin:     '0 auto',
          padding:    '24px 16px 48px',
          boxSizing:  'border-box',
          display:    'flex',
          flexDirection: 'column',
        }}
        aria-label="கட்டண தோல்வி பக்கம்"
      >
        {/*
          Wrapping in Suspense satisfies Next.js App Router requirement
          for components that call useSearchParams() at any depth.
        */}
        <Suspense fallback={<FailurePageSkeleton />}>
          <FailureContent />
        </Suspense>
      </main>

      <CustomerFooter />
      <MobileBottomNav />

      <style>{`
        @keyframes vt-fp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vt-fp-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

// ─── Inner component (inside Suspense, uses useSearchParams) ──────────────────
function FailureContent() {
  const params = useSearchParams();

  const orderId      = params.get('orderId')      ?? undefined;
  const errorMessage = params.get('error')        ?? undefined;
  const errorCode    = params.get('code')         ?? undefined;
  const amountRaw    = params.get('amount');
  const amount       = amountRaw && !isNaN(parseFloat(amountRaw))
    ? parseFloat(amountRaw)
    : undefined;

  // If navigated directly without any params, show a generic fallback
  const hasContext = !!(orderId || errorMessage || errorCode || amount);

  return (
    <div
      style={{
        display:    'flex',
        flexDirection: 'column',
        gap:        '16px',
        animation:  'vt-fp-fade-in 350ms cubic-bezier(0.34,1.20,0.64,1) forwards',
      }}
    >
      {/* ── Main failure card ──────────────────────────────────────────── */}
      <OrderFailureCard
        orderId={orderId}
        errorMessage={
          errorMessage
            ?? (hasContext
              ? undefined
              : 'கட்டணம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.')
        }
        errorCode={errorCode}
        amount={amount}
      />

      {/* ── Alternative payment options (if we have an orderId) ─────────── */}
      {orderId && (
        <section
          aria-label="வேறு கட்டண முறைகள்"
          style={{
            background:   'var(--vt-card)',
            backdropFilter: 'blur(12px)',
            border:       `1px solid ${T.border}`,
            borderRadius: '20px',
            padding:      '20px',
            boxShadow:    'var(--vt-shadow-md)',
          }}
        >
          <p
            style={{
              fontFamily: FONT.display,
              fontSize:   '15px',
              fontWeight: 700,
              color:      T.darkText,
              margin:     '0 0 14px',
              lineHeight: 1.3,
            }}
          >
            வேறு கட்டண முறையில் முயற்சிக்கவும்
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* UPI */}
            <PaymentOptionLink
              href={`/checkout?orderId=${orderId}&method=upi`}
              icon={faMobileScreen}
              label="UPI (PhonePe, GPay, Paytm)"
              badge="பரிந்துரை"
              badgeColor={T.leaf}
            />
            {/* COD */}
            <PaymentOptionLink
              href={`/checkout?orderId=${orderId}&method=cod`}
              icon={faMoneyBill}
              label="பணமாக கொடுங்கள் (COD)"
              badge="கட்டணம் இல்லை"
              badgeColor={T.saffron}
            />
            {/* Card */}
            <PaymentOptionLink
              href={`/checkout?orderId=${orderId}&method=card`}
              icon={faCreditCard}
              label="டெபிட் / கிரெடிட் கார்டு"
            />
            {/* Net banking */}
            <PaymentOptionLink
              href={`/checkout?orderId=${orderId}&method=netbanking`}
              icon={faBuilding}
              label="நெட் பேங்கிங்"
            />
          </div>
        </section>
      )}

      {/* ── Help section ──────────────────────────────────────────────── */}
      <section
        aria-label="உதவி மையம்"
        style={{
          background:   'rgba(255, 255, 255, 0.02)',
          border:       `1px solid ${T.border}`,
          borderRadius: '16px',
          padding:      '16px 20px',
        }}
      >
        <p
          style={{
            fontFamily: FONT.display,
            fontSize:   '14px',
            fontWeight: 700,
            color:      T.secondaryText,
            margin:     '0 0 4px',
            lineHeight: 1.4,
          }}
        >
          கட்டண சிக்கல் தொடர்கிறதா?
        </p>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '13px',
            color:      T.muted,
            margin:     '0 0 12px',
            lineHeight: 1.6,
          }}
        >
          உங்கள் வங்கி கணக்கில் பணம் கழிக்கப்பட்டிருந்தால், 24 மணி நேரத்தில்
          திரும்பப் பெறப்படும்.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="https://wa.me/918800000000?text=கட்டண தோல்வி சிக்கல்"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '9px 16px',
              background:     'rgba(37,211,102,0.08)',
              border:         '1px solid rgba(37,211,102,0.22)',
              borderRadius:   '100px',
              textDecoration: 'none',
              fontFamily:     FONT.display,
              fontSize:       '13px',
              fontWeight:     700,
              color:          '#25D366',
              transition:     'background 150ms ease',
            }}
          >
            <span aria-hidden="true">💬</span>
            WhatsApp உதவி
          </a>
          <a
            href="tel:+918800000000"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '9px 16px',
              background:     'rgba(255, 255, 255, 0.03)',
              border:         `1px solid ${T.border}`,
              borderRadius:   '100px',
              textDecoration: 'none',
              fontFamily:     FONT.display,
              fontSize:       '13px',
              fontWeight:     700,
              color:          T.gold,
              transition:     'background 150ms ease',
            }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faPhone} style={{ width: 14, height: 14 }} />
            </span>
            +91 88000 00000
          </a>
        </div>
      </section>

      {/* ── Continue shopping ──────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', paddingTop: '4px' }}>
        <Link
          href="/products"
          style={{
            fontFamily:     FONT.body,
            fontSize:       '13px',
            fontWeight:     600,
            color:          T.muted,
            textDecoration: 'none',
          }}
        >
          கொள்முதல் தொடரவும் →
        </Link>
      </div>
    </div>
  );
}

// ─── PaymentOptionLink ────────────────────────────────────────────────────────
function PaymentOptionLink({
  href,
  icon,
  label,
  badge,
  badgeColor,
}: {
  href:        string;
  icon:        IconDefinition;
  label:       string;
  badge?:      string;
  badgeColor?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '12px',
        padding:        '13px 16px',
        background:     'rgba(255, 255, 255, 0.02)',
        border:         `1px solid ${T.border}`,
        borderRadius:   '14px',
        textDecoration: 'none',
        transition:     'border-color 150ms ease, background 150ms ease',
      }}
    >
      <span style={{ lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
        <FontAwesomeIcon icon={icon} style={{ width: 18, height: 18, color: T.gold }} />
      </span>
      <span
        style={{
          fontFamily: FONT.display,
          fontSize:   '14px',
          fontWeight: 600,
          color:      T.darkText,
          flex:       1,
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
      {badge && (
        <span
          style={{
            fontFamily:   FONT.body,
            fontSize:     '10px',
            fontWeight:   700,
            color:        badgeColor ?? T.muted,
            background:   `${badgeColor ?? T.muted}18`,
            border:       `1px solid ${badgeColor ?? T.muted}28`,
            padding:      '2px 8px',
            borderRadius: '100px',
            whiteSpace:   'nowrap',
            lineHeight:   1.6,
            flexShrink:   0,
          }}
        >
          {badge}
        </span>
      )}
      <ChevronRightIcon />
    </Link>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function FailurePageSkeleton() {
  return (
    <div
      role="status"
      aria-label="ஏற்றுகிறோம்..."
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* Main card skeleton */}
      <div
        style={{
          background:   'var(--vt-card)',
          backdropFilter: 'blur(12px)',
          border:       `1px solid ${T.border}`,
          borderRadius: '24px',
          overflow:     'hidden',
        }}
      >
        <div style={{ height: '220px', background: 'linear-gradient(150deg,#3A1510,#2A0E0A)' }} />
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SkeletonBar height="56px" radius="14px" />
          <SkeletonBar height="72px" radius="14px" />
          <SkeletonBar height="54px" radius="14px" />
          <SkeletonBar height="50px" radius="14px" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton helper ──────────────────────────────────────────────────────────
function SkeletonBar({ height, radius, width = '100%' }: { height: string; radius?: string; width?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        width,
        borderRadius: radius ?? '8px',
        background:   'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation:    'vt-skeleton-shimmer 1.8s linear infinite',
      }}
    />
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M11 4L6 9l5 5"
        stroke="rgba(255,220,200,0.80)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.40 }}>
      <path d="M6 4l4 4-4 4" stroke={T.darkText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
