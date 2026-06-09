'use client';

/**
 * apps/web/app/order/success/page.tsx
 *
 * Vaithiyam — Order Success Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Route ───────────────────────────────────────────────────────────────────
 *   /order/success?orderId=<vaithiyam-order-id>
 *
 * ─── Flow ────────────────────────────────────────────────────────────────────
 *   1. Reads orderId from search params
 *   2. Fetches full order from GET /api/orders/:orderId
 *   3. Renders OrderSuccessCard with live order data
 *   4. Loading skeleton while fetching
 *   5. Soft error state (with home + retry) if fetch fails
 *
 * ─── Components used ─────────────────────────────────────────────────────────
 *   OrderSuccessCard  (apps/web/components/order/OrderSuccessCard.tsx)
 *   OrderData type    (apps/web/components/order/OrderSummary.tsx)
 */

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams }  from 'next/navigation';
import Link                 from 'next/link';
import OrderSuccessCard     from '../../../components/order/OrderSuccessCard';
import type { OrderData }   from '../../../components/order/OrderSummary';
import { CustomerHeader, CustomerFooter, MobileBottomNav } from '@/components/layout/CustomerShell';

// ─── Design tokens ────────────────────────────────────────────────────────────
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

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function OrderSuccessPage() {
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
        aria-label="ஆர்டர் வெற்றி பக்கம்"
      >
        <Suspense fallback={<LoadingScreen />}>
          <OrderSuccessContent />
        </Suspense>
      </main>

      <CustomerFooter />
      <MobileBottomNav />

      <style>{`
        @keyframes vt-os-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vt-os-fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

// ─── Inner component (uses useSearchParams → must be inside Suspense) ─────────
function OrderSuccessContent() {
  const params  = useSearchParams();
  const orderId = params.get('orderId');

  const [order,   setOrder]   = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId?.trim()) {
      setError('ஆர்டர் எண் கிடைக்கவில்லை. முகப்பு பக்கத்திற்கு செல்லவும்.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        headers: authHeaders(),
        cache: 'no-store',
      });

      if (res.status === 404) {
        throw new Error('ஆர்டர் கண்டுபிடிக்கவில்லை.');
      }
      if (!res.ok) {
        throw new Error('ஆர்டர் விவரங்கள் பெற முடியவில்லை.');
      }

      const data = (await res.json()) as OrderData;
      setOrder(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ஆர்டர் விவரங்கள் கிடைக்கவில்லை. சற்று நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <ErrorScreen
        error={error ?? 'ஆர்டர் கண்டுபிடிக்கவில்லை.'}
        orderId={orderId ?? undefined}
        onRetry={fetchOrder}
      />
    );
  }

  // ── Map OrderData → OrderSuccessCard props ───────────────────────────────
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div
      style={{
        animation: 'vt-os-fade-in 360ms cubic-bezier(0.34,1.20,0.64,1) forwards',
      }}
    >
      <OrderSuccessCard
        orderId={order.orderId}
        total={order.total}
        itemCount={itemCount}
        paymentMethod={order.paymentMethod}
        paymentId={order.paymentId}
        upiId={order.upiId}
        placedAt={order.placedAt}
        estimatedDelivery={order.estimatedDelivery}
        savings={order.savings}
      />
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      role="status"
      aria-label="ஆர்டர் விவரங்கள் ஏற்றுகிறோம்..."
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '60px 24px',
        gap:            '20px',
      }}
    >
      {/* Spinning herb mark */}
      <div
        aria-hidden="true"
        style={{
          width:          '72px',
          height:         '72px',
          borderRadius:   '50%',
          background:     'rgba(255,255,255,0.02)',
          border:         `2px solid var(--vt-border)`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          animation:      'vt-os-spin 1.4s linear infinite',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 72 72" fill="none">
          <path
            d="M36 8C26 14 18 22 18 34a18 18 0 0 0 18 18 18 18 0 0 0 18-18C54 22 46 14 36 8z"
            stroke={T.gold}
            strokeWidth="2"
            fill="rgba(201,146,42,0.08)"
          />
          <path d="M36 22v26" stroke={T.gold} strokeWidth="2" strokeLinecap="round" />
          <path d="M26 32c5-2 10-2 10 0" stroke={T.leaf} strokeWidth="2" strokeLinecap="round" />
          <path d="M46 38c-5-2-10-2-10 0" stroke={T.leaf} strokeWidth="2" strokeLinecap="round" />
          <circle cx="36" cy="52" r="3" fill={T.leaf} opacity="0.40" />
        </svg>
      </div>

      <p
        style={{
          fontFamily: FONT.display,
          fontSize:   '15px',
          fontWeight: 600,
          color:      T.secondaryText,
          margin:     0,
          textAlign:  'center',
          lineHeight: 1.4,
        }}
      >
        ஆர்டர் விவரங்கள் ஏற்றுகிறோம்...
      </p>
    </div>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────
function ErrorScreen({
  error,
  orderId,
  onRetry,
}: {
  error:    string;
  orderId?: string;
  onRetry:  () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '16px',
        animation:     'vt-os-fade-in 280ms ease forwards',
      }}
    >
      {/* Error card */}
      <div
        style={{
          background:   'var(--vt-card)',
          backdropFilter: 'blur(12px)',
          border:       '1px solid var(--vt-border)',
          borderRadius: '20px',
          overflow:     'hidden',
          boxShadow:    'var(--vt-shadow-md)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:    '28px 24px 24px',
            textAlign:  'center',
            background: 'rgba(249,92,56,0.03)',
            borderBottom: '1px solid var(--vt-border)',
          }}
        >
          <span style={{ fontSize: '44px', display: 'block', marginBottom: '14px' }} aria-hidden="true">
            😕
          </span>
          <h2
            style={{
              fontFamily: FONT.display,
              fontSize:   '20px',
              fontWeight: 700,
              color:      T.terracotta,
              margin:     '0 0 8px',
              lineHeight: 1.3,
            }}
          >
            ஆர்டர் கண்டுபிடிக்கவில்லை
          </h2>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '14px',
              color:      T.secondaryText,
              margin:     0,
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
          {orderId && (
            <p
              style={{
                fontFamily:    'monospace',
                fontSize:      '12px',
                color:         T.muted,
                margin:        '8px 0 0',
                letterSpacing: '0.04em',
              }}
            >
              {orderId}
            </p>
          )}
        </div>

        {/* CTAs */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={onRetry}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
              height:         '50px',
              borderRadius:   '14px',
              background:     'linear-gradient(135deg, var(--vt-gold-700), var(--vt-gold-500))',
              border:         'none',
              color:          '#030C07',
              fontFamily:     FONT.display,
              fontSize:       '15px',
              fontWeight:     700,
              cursor:         'pointer',
              boxShadow:      '0 4px 16px rgba(201,146,42,0.18)',
              letterSpacing:  '0.02em',
            }}
          >
            <RetryIcon />
            மீண்டும் முயற்சிக்கவும்
          </button>

          <Link
            href="/products"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              height:         '46px',
              borderRadius:   '14px',
              background:     'transparent',
              border:         `1.5px solid ${T.border}`,
              color:          T.gold,
              fontFamily:     FONT.display,
              fontSize:       '14px',
              fontWeight:     700,
              textDecoration: 'none',
            }}
          >
            கொள்முதல் தொடரவும்
          </Link>
        </div>
      </div>

      {/* Support contact */}
      <div
        style={{
          background:   'rgba(255,255,255,0.02)',
          border:       `1px solid ${T.border}`,
          borderRadius: '16px',
          padding:      '16px 20px',
          textAlign:    'center',
        }}
      >
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '13px',
            color:      T.muted,
            margin:     '0 0 6px',
            lineHeight: 1.5,
          }}
        >
          உதவி தேவையா? எங்களை தொடர்பு கொள்ளவும்
        </p>
        <a
          href="tel:+918800000000"
          style={{
            fontFamily:     FONT.display,
            fontSize:       '15px',
            fontWeight:     700,
            color:          T.gold,
            textDecoration: 'none',
          }}
        >
          +91 88000 00000
        </a>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function RetryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M3 9a6 6 0 1 1 1.4 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 13.5V9H7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
