'use client';

/**
 * apps/web/app/order/[orderId]/page.tsx
 *
 * Vaithiyam — Order Detail Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Route ───────────────────────────────────────────────────────────────────
 *   /order/:orderId
 *
 * ─── Flow ────────────────────────────────────────────────────────────────────
 *   1. Reads orderId from useParams()
 *   2. Fetches full order from GET /api/orders/:orderId
 *   3. Renders:
 *        • Sticky header with order ID + status badge + back link
 *        • OrderTimeline   — live status tracker with timestamps
 *        • OrderSummary    — items, pricing breakdown, address, payment info
 *        • Support section — WhatsApp + phone with reorder CTA
 *   4. Skeleton loading state while fetching
 *   5. Soft error state (retry + home) on fetch failure
 *   6. Not-found state on 404
 *
 * ─── Components used ─────────────────────────────────────────────────────────
 *   OrderTimeline  (apps/web/components/order/OrderTimeline.tsx)
 *   OrderSummary   (apps/web/components/order/OrderSummary.tsx)
 *   OrderData type (apps/web/components/order/OrderSummary.tsx)
 */

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter }  from 'next/navigation';
import Link                      from 'next/link';
import { FontAwesomeIcon }       from '@fortawesome/react-fontawesome';
import {
  faGift, faCalendarDays, faPhone, faBox, faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { CustomerHeader, CustomerFooter, MobileBottomNav } from '@/components/layout/CustomerShell';
import OrderTimeline             from '../../../components/order/OrderTimeline';
import OrderSummary              from '../../../components/order/OrderSummary';
import type { OrderData, OrderStatus } from '../../../components/order/OrderSummary';

// ─── Design tokens (mirrors all order components exactly) ─────────────────────
const T = {
  forestPrimary: 'var(--vt-forest-800)',
  forestDark:    'var(--vt-deep)',
  creamBase:     'var(--vt-void)',
  creamAlt:      'rgba(255, 255, 255, 0.05)',
  gold:          'var(--vt-gold-500)',
  goldPale:      'var(--vt-gold-200)',
  leaf:          'var(--vt-forest-600)',
  saffron:       'var(--vt-gold-500)',
  terracotta:    'var(--vt-coral-500)',
  darkText:      'var(--vt-ink)',
  secondaryText: 'var(--vt-muted)',
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

// ─── Status badge config (subset — active + cancelled only) ──────────────────
const STATUS_BADGE: Record<OrderStatus, { labelTa: string; bg: string; color: string; border: string }> = {
  placed:           { labelTa: 'பதிவாயிற்று',     bg: 'rgba(201,146,42,0.10)',  color: T.gold,          border: 'rgba(201,146,42,0.28)' },
  confirmed:        { labelTa: 'உறுதிப்பட்டது',   bg: 'rgba(61,122,85,0.10)',   color: T.leaf,          border: 'rgba(61,122,85,0.28)'  },
  packed:           { labelTa: 'பேக் ஆயிற்று',     bg: 'rgba(26,58,42,0.08)',    color: T.forestPrimary, border: 'rgba(26,58,42,0.22)'   },
  shipped:          { labelTa: 'அனுப்பப்பட்டது',   bg: 'rgba(224,123,57,0.10)', color: T.saffron,       border: 'rgba(224,123,57,0.28)' },
  out_for_delivery: { labelTa: 'டெலிவரி வழியில்',  bg: 'rgba(224,123,57,0.15)', color: '#B85D1A',       border: 'rgba(224,123,57,0.32)' },
  delivered:        { labelTa: 'டெலிவரி ஆயிற்று', bg: 'rgba(61,122,85,0.12)',   color: T.leaf,          border: 'rgba(61,122,85,0.30)'  },
  cancelled:        { labelTa: 'ரத்து ஆயிற்று',   bg: 'rgba(139,58,47,0.10)',   color: T.terracotta,    border: 'rgba(139,58,47,0.24)'  },
};

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  return (
    <div
      style={{
        minHeight:     '100dvh',
        background:    'var(--vt-void)',
        paddingBottom: '80px',
      }}
    >
      <CustomerHeader />

      {/* ── Content (useParams doesn't require Suspense, but we wrap
             to get the skeleton during data fetching as a unified UX) */}
      <Suspense fallback={<PageShellSkeleton />}>
        <OrderDetailContent />
      </Suspense>

      <CustomerFooter />
      <MobileBottomNav />

      <style>{`
        @keyframes vt-od-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vt-od-fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes vt-od-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes vt-od-pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ─── Main content component ───────────────────────────────────────────────────
function OrderDetailContent() {
  const params  = useParams();
  const router = useRouter();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const [order,   setOrder]   = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId.trim()) {
      setError('ஆர்டர் எண் கிடைக்கவில்லை.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        headers: authHeaders(),
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace(`/auth/login?next=/order/${encodeURIComponent(orderId)}`);
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as { message?: string }).message
            ?? 'ஆர்டர் விவரங்கள் பெற முடியவில்லை.',
        );
      }

      const data = (await res.json()) as OrderData;
      setOrder(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'சேவையகத்தில் பிழை ஏற்பட்டது. சற்று நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return <LoadingView />;

  // ── Not found ──────────────────────────────────────────────────────────
  if (notFound) return <NotFoundView orderId={orderId} />;

  // ── Error ──────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <ErrorView
        error={error ?? 'ஆர்டர் கண்டுபிடிக்கவில்லை.'}
        orderId={orderId}
        onRetry={fetchOrder}
      />
    );
  }

  // ── Success ────────────────────────────────────────────────────────────
  const badge        = STATUS_BADGE[order.status];
  const isDelivered  = order.status === 'delivered';
  const isCancelled  = order.status === 'cancelled';
  const placedDateFmt = formatDate(order.placedAt);

  return (
    <>
      {/* Back to list and ID heading for context */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 16px 0',
          maxWidth: '660px',
          margin: '0 auto',
        }}
      >
        <Link
          href="/account/orders"
          style={{
            fontFamily: FONT.body,
            fontSize: '13px',
            color: 'var(--vt-emerald-400)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← என் ஆர்டர்கள்
        </Link>
        <span style={{ color: 'var(--vt-muted)' }}>|</span>
        <h2 style={{ fontSize: '14px', margin: 0, fontFamily: FONT.display, color: T.gold }}>
          ஆர்டர் #{order.orderId}
        </h2>
        <span
          style={{
            fontFamily:    FONT.body,
            fontSize:      '10px',
            fontWeight:    700,
            background:    badge.bg,
            color:         badge.color,
            border:        `1px solid ${badge.border}`,
            padding:       '2px 8px',
            borderRadius:  '100px',
            marginLeft:    'auto',
          }}
        >
          {badge.labelTa}
        </span>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth:  '660px',
          margin:    '0 auto',
          padding:   '20px 16px',
          display:   'flex',
          flexDirection: 'column',
          gap:       '16px',
          animation: 'vt-od-fade-in 350ms cubic-bezier(0.34,1.20,0.64,1) forwards',
        }}
        aria-label={`ஆர்டர் ${order.orderId} விவரங்கள்`}
      >
        {/* ── 1. Delivered celebration banner ────────────────────────── */}
        {isDelivered && (
          <div
            role="status"
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '14px',
              padding:      '16px 20px',
              background:   'linear-gradient(135deg,rgba(61,122,85,0.08) 0%,rgba(61,122,85,0.03) 100%)',
              border:       '1px solid rgba(61,122,85,0.22)',
              borderRadius: '20px',
              boxShadow:    '0 2px 12px rgba(61,122,85,0.08)',
            }}
          >
            <span style={{ flexShrink: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
              <FontAwesomeIcon icon={faGift} style={{ width: 24, height: 24, color: T.leaf }} />
            </span>
            <div>
              <p
                style={{
                  fontFamily: FONT.display,
                  fontSize:   '16px',
                  fontWeight: 700,
                  color:      T.leaf,
                  margin:     '0 0 3px',
                  lineHeight: 1.3,
                }}
              >
                டெலிவரி வெற்றிகரமாக முடிந்தது!
              </p>
              <p
                style={{
                  fontFamily: FONT.body,
                  fontSize:   '13px',
                  color:      T.secondaryText,
                  margin:     0,
                  lineHeight: 1.5,
                }}
              >
                உங்கள் ஆரோக்கிய பயணத்திற்கு நன்றி
              </p>
            </div>
          </div>
        )}

        {/* ── 2. Estimated delivery callout (not delivered/cancelled) ─── */}
        {!isDelivered && !isCancelled && order.estimatedDelivery && (
          <div
            role="status"
            aria-label={`எதிர்பார்க்கப்படும் டெலிவரி ${order.estimatedDelivery}`}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '14px',
              padding:      '14px 20px',
              background:   'rgba(201,146,42,0.06)',
              border:       '1px solid rgba(201,146,42,0.20)',
              borderRadius: '20px',
            }}
          >
            <span style={{ flexShrink: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
              <FontAwesomeIcon icon={faCalendarDays} style={{ width: 20, height: 20, color: '#C9922A' }} />
            </span>
            <div>
              <p
                style={{
                  fontFamily:    FONT.body,
                  fontSize:      '10px',
                  color:         T.muted,
                  margin:        '0 0 2px',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  lineHeight:    1.3,
                }}
              >
                எதிர்பார்க்கப்படும் டெலிவரி
              </p>
              <p
                style={{
                  fontFamily: FONT.display,
                  fontSize:   '15px',
                  fontWeight: 700,
                  color:      T.gold,
                  margin:     0,
                  lineHeight: 1.3,
                }}
              >
                {formatDeliveryDate(order.estimatedDelivery)}
              </p>
            </div>
          </div>
        )}

        {/* ── 3. Order Timeline ──────────────────────────────────────────── */}
        <OrderTimeline
          currentStatus={order.status}
          statusHistory={order.statusHistory}
          estimatedDelivery={order.estimatedDelivery}
          placedAt={order.placedAt}
        />

        {/* ── 4. Order Summary (items + pricing + address + payment) ──────── */}
        <OrderSummary
          order={order}
          collapsible={false}
          showAddress={true}
          showPayment={true}
        />

        {/* ── 5. Reorder CTA (only when delivered) ────────────────────── */}
        {isDelivered && (
          <section
            aria-label="மீண்டும் ஆர்டர் செய்யவும்"
            style={{
              background:   'var(--vt-card)',
              border:       `1px solid ${T.border}`,
              borderRadius: '20px',
              padding:      '20px',
              boxShadow:    'var(--vt-shadow-sm)',
              textAlign:    'center',
            }}
          >
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '16px',
                fontWeight: 700,
                color:      T.darkText,
                margin:     '0 0 6px',
                lineHeight: 1.3,
              }}
            >
              மீண்டும் வாங்க விரும்புகிறீர்களா?
            </p>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '13px',
                color:      T.muted,
                margin:     '0 0 16px',
                lineHeight: 1.5,
              }}
            >
              ஒரே கிளிக்கில் இதே பொருட்களை கூடையில் சேர்க்கலாம்
            </p>
            <button
              type="button"
              aria-label="இந்த ஆர்டரை மீண்டும் செய்யவும்"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
                height:         '50px',
                padding:        '0 28px',
                borderRadius:   '14px',
                background:     `linear-gradient(135deg,${T.forestPrimary} 0%,#254D38 100%)`,
                border:         'none',
                color:          T.goldPale,
                fontFamily:     FONT.display,
                fontSize:       '15px',
                fontWeight:     700,
                cursor:         'pointer',
                boxShadow:      '0 4px 14px rgba(26,58,42,0.22)',
                letterSpacing:  '0.02em',
                transition:     'transform 150ms ease, box-shadow 150ms ease',
              }}
              onClick={() => {
                // In Phase 2 this will call reorder mutation:
                // reorder(order.orderId) → addAllToCart(order.items) → router.push('/cart')
                window.location.href = `/cart?reorder=${order.orderId}`;
              }}
            >
              <ReorderIcon />
              மீண்டும் ஆர்டர் செய்யவும்
            </button>
          </section>
        )}

        {/* ── 6. Cancellation note ─────────────────────────────────────── */}
        {isCancelled && (
          <div
            role="note"
            style={{
              padding:      '14px 20px',
              background:   'rgba(139,58,47,0.04)',
              border:       '1px solid rgba(139,58,47,0.14)',
              borderRadius: '16px',
              display:      'flex',
              alignItems:   'flex-start',
              gap:          '10px',
            }}
          >
            <span style={{ flexShrink: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'flex-start', paddingTop: 2 }} aria-hidden="true">
              <FontAwesomeIcon icon={faCreditCard} style={{ width: 14, height: 14, color: '#6b7f74' }} />
            </span>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '13px',
                color:      T.secondaryText,
                margin:     0,
                lineHeight: 1.7,
              }}
            >
              பணம் செலுத்தப்பட்டிருந்தால், திரும்பப் பெறும் தொகை{' '}
              <strong>5–7 வணிக நாட்களில்</strong> உங்கள் கணக்கில் வரும்.
            </p>
          </div>
        )}

        {/* ── 7. Support section ────────────────────────────────────────── */}
        <SupportSection orderId={order.orderId} />

        {/* ── 8. Continue shopping link ─────────────────────────────────── */}
        <div style={{ textAlign: 'center', paddingTop: '4px', marginBottom: '24px' }}>
          <Link
            href="/products"
            style={{
              fontFamily:     FONT.body,
              fontSize:       '13px',
              fontWeight:     600,
              color:          'var(--vt-emerald-400)',
              textDecoration: 'none',
            }}
          >
            கொள்முதல் தொடரவும் →
          </Link>
        </div>
      </main>
    </>
  );
}

// ─── Support Section ──────────────────────────────────────────────────────────
function SupportSection({ orderId }: { orderId: string }) {
  const waMessage = encodeURIComponent(
    `வணக்கம்! என் ஆர்டர் #${orderId} பற்றி உதவி தேவை.`,
  );

  return (
    <section
      aria-label="உதவி மையம்"
      style={{
        background:   'var(--vt-card)',
        border:       `1px solid ${T.border}`,
        borderRadius: '20px',
        overflow:     'hidden',
        boxShadow:    'var(--vt-shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '10px',
          padding:    '16px 20px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: `1px solid var(--vt-border)`,
        }}
      >
        <SupportIcon />
        <h2
          style={{
            fontFamily: FONT.display,
            fontSize:   '16px',
            fontWeight: 700,
            color:      T.darkText,
            margin:     0,
            lineHeight: 1.3,
          }}
        >
          உதவி தேவையா?
        </h2>
      </div>

      {/* Contacts */}
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '13px',
            color:      T.muted,
            margin:     '0 0 4px',
            lineHeight: 1.5,
          }}
        >
          ஆர்டர் <strong>#{orderId}</strong> பற்றிய கேள்விகளுக்கு எங்களை தொடர்பு கொள்ளுங்கள்.
        </p>

        {/* WhatsApp — preferred */}
        <a
          href={`https://wa.me/918800000000?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '12px',
            padding:        '13px 16px',
            background:     'rgba(37,211,102,0.05)',
            border:         '1px solid rgba(37,211,102,0.22)',
            borderRadius:   '14px',
            textDecoration: 'none',
            transition:     'background 150ms ease',
          }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💬</span>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '14px',
                fontWeight: 700,
                color:      T.darkText,
                margin:     0,
                lineHeight: 1.3,
              }}
            >
              WhatsApp உதவி
            </p>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '12px',
                color:      T.muted,
                margin:     '2px 0 0',
                lineHeight: 1.3,
              }}
            >
              விரைவான பதில் · +91 88000 00000
            </p>
          </div>
          <span
            style={{
              fontFamily:   FONT.body,
              fontSize:     '10px',
              fontWeight:   700,
              color:        '#1A7A3A',
              background:   'rgba(37,211,102,0.10)',
              border:       '1px solid rgba(37,211,102,0.20)',
              padding:      '2px 8px',
              borderRadius: '100px',
              lineHeight:   1.6,
              flexShrink:   0,
              whiteSpace:   'nowrap',
            }}
          >
            விரைவு பதில்
          </span>
        </a>

        {/* Phone */}
        <a
          href="tel:+918800000000"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '12px',
            padding:        '13px 16px',
            background:     'rgba(255, 255, 255, 0.02)',
            border:         `1px solid ${T.border}`,
            borderRadius:   '14px',
            textDecoration: 'none',
            transition:     'background 150ms ease',
          }}
        >
          <span style={{ lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
            <FontAwesomeIcon icon={faPhone} style={{ width: 16, height: 16, color: 'var(--vt-forest-600)' }} />
          </span>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '14px',
                fontWeight: 700,
                color:      T.darkText,
                margin:     0,
                lineHeight: 1.3,
              }}
            >
              +91 88000 00000
            </p>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '12px',
                color:      T.muted,
                margin:     '2px 0 0',
                lineHeight: 1.3,
              }}
            >
              காலை 9 மணி – இரவு 9 மணி · தினமும்
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}

// ─── Loading view ─────────────────────────────────────────────────────────────
function LoadingView() {
  return (
    <div role="status" aria-label="ஆர்டர் விவரங்கள் ஏற்றுகிறோம்...">
      {/* Skeleton body */}
      <div
        style={{
          maxWidth: '660px',
          margin:   '0 auto',
          padding:  '20px 16px',
          display:  'flex',
          flexDirection: 'column',
          gap:      '16px',
        }}
      >
        {/* Timeline skeleton */}
        <SkeletonCard height="300px" />
        {/* Summary skeleton */}
        <SkeletonCard height="420px" />
        {/* Address skeleton */}
        <SkeletonCard height="140px" />
        {/* Payment skeleton */}
        <SkeletonCard height="120px" />
      </div>
    </div>
  );
}

function PageShellSkeleton() {
  return <LoadingView />;
}

function SkeletonCard({ height }: { height: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        borderRadius: '20px',
        background:   'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation:    'vt-od-shimmer 1.8s linear infinite',
        border:       `1px solid ${T.border}`,
      }}
    />
  );
}

// ─── Not found view ───────────────────────────────────────────────────────────
function NotFoundView({ orderId }: { orderId: string }) {
  return (
    <div>
      <main
        style={{
          maxWidth:  '660px',
          margin:    '0 auto',
          padding:   '32px 16px',
          animation: 'vt-od-fade-in 300ms ease forwards',
        }}
      >
        <div
          style={{
            background:   'var(--vt-card)',
            border:       '1px solid var(--vt-border)',
            borderRadius: '24px',
            padding:      '40px 24px',
            textAlign:    'center',
            boxShadow:    'var(--vt-shadow-sm)',
          }}
        >
          <span style={{ marginBottom: '20px', lineHeight: 1, display: 'flex', justifyContent: 'center' }} aria-hidden="true">
            <FontAwesomeIcon icon={faBox} style={{ width: 48, height: 48, color: 'rgba(26,58,42,0.35)' }} />
          </span>
          <h2
            style={{
              fontFamily: FONT.display,
              fontSize:   '22px',
              fontWeight: 700,
              color:      T.darkText,
              margin:     '0 0 10px',
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
              margin:     '0 0 6px',
              lineHeight: 1.6,
            }}
          >
            <code
              style={{
                fontFamily:    'monospace',
                background:    T.creamAlt,
                padding:       '2px 8px',
                borderRadius:  '6px',
                letterSpacing: '0.04em',
                fontSize:      '13px',
              }}
            >
              #{orderId}
            </code>{' '}
            என்ற ஆர்டர் கண்டுபிடிக்கவில்லை.
          </p>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '13px',
              color:      T.muted,
              margin:     '0 0 28px',
              lineHeight: 1.6,
            }}
          >
            ஆர்டர் எண் சரியாக உள்ளதா என சரிபார்க்கவும்.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '320px', margin: '0 auto' }}>
            <Link
              href="/account/orders"
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                height:         '50px',
                borderRadius:   '14px',
                background:     `linear-gradient(135deg,${T.forestPrimary} 0%,#254D38 100%)`,
                color:          T.goldPale,
                fontFamily:     FONT.display,
                fontSize:       '15px',
                fontWeight:     700,
                textDecoration: 'none',
                boxShadow:      '0 4px 14px rgba(26,58,42,0.18)',
              }}
            >
              என் ஆர்டர்களைப் பார்க்க
            </Link>
            <Link
              href="/products"
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                height:         '46px',
                borderRadius:   '14px',
                background:     'transparent',
                border:         `1.5px solid rgba(26,58,42,0.20)`,
                color:          T.forestPrimary,
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
      </main>
    </div>
  );
}

// ─── Error view ───────────────────────────────────────────────────────────────
function ErrorView({
  error,
  orderId,
  onRetry,
}: {
  error:    string;
  orderId:  string;
  onRetry:  () => void;
}) {
  return (
    <div>
      <main
        style={{
          maxWidth:  '660px',
          margin:    '0 auto',
          padding:   '32px 16px',
          animation: 'vt-od-fade-in 300ms ease forwards',
        }}
      >
        <div
          role="alert"
          style={{
            background:   'var(--vt-card)',
            border:       '1px solid var(--vt-border)',
            borderRadius: '24px',
            overflow:     'hidden',
            boxShadow:    'var(--vt-shadow-sm)',
          }}
        >
          {/* Error header */}
          <div
            style={{
              padding:      '28px 24px 22px',
              textAlign:    'center',
              background:   'rgba(139,58,47,0.03)',
              borderBottom: '1px solid rgba(139,58,47,0.10)',
            }}
          >
            <span style={{ fontSize: '44px', display: 'block', marginBottom: '14px', lineHeight: 1 }} aria-hidden="true">
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
              ஏதோ தவறு நடந்தது
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
                background:     `linear-gradient(135deg,${T.forestPrimary} 0%,#254D38 100%)`,
                border:         'none',
                color:          T.goldPale,
                fontFamily:     FONT.display,
                fontSize:       '15px',
                fontWeight:     700,
                cursor:         'pointer',
                boxShadow:      '0 4px 14px rgba(26,58,42,0.18)',
                letterSpacing:  '0.02em',
              }}
            >
              <RetryIcon />
              மீண்டும் முயற்சிக்கவும்
            </button>

            <Link
              href="/account/orders"
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                height:         '46px',
                borderRadius:   '14px',
                background:     'transparent',
                border:         `1.5px solid rgba(26,58,42,0.20)`,
                color:          T.forestPrimary,
                fontFamily:     FONT.display,
                fontSize:       '14px',
                fontWeight:     700,
                textDecoration: 'none',
              }}
            >
              என் ஆர்டர்களைப் பார்க்க
            </Link>
          </div>
        </div>

        {/* Support */}
        <div
          style={{
            marginTop:    '16px',
            background:   'rgba(245,239,224,0.60)',
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
            href="https://wa.me/918800000000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily:     FONT.display,
              fontSize:       '14px',
              fontWeight:     700,
              color:          T.forestPrimary,
              textDecoration: 'none',
            }}
          >
            💬 WhatsApp: +91 88000 00000
          </a>
        </div>
      </main>
    </div>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ta-IN', {
      day:    'numeric',
      month:  'long',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function formatDeliveryDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ta-IN', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
    });
  } catch {
    return iso;
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HerbIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path
        d="M36 8C26 14 18 22 18 34a18 18 0 0 0 18 18 18 18 0 0 0 18-18C54 22 46 14 36 8z"
        stroke={color}
        strokeWidth="2.5"
        fill={`${color}1A`}
      />
      <path d="M36 22v26"         stroke={color}     strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 32c5-2 10-2 10 0" stroke={T.leaf} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 38c-5-2-10-2-10 0" stroke={T.leaf} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M11 4L6 9l5 5"
        stroke="rgba(240,201,110,0.80)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="7" stroke={T.forestPrimary} strokeWidth="1.5" />
      <path d="M9 6v4M9 11.5v.5" stroke={T.forestPrimary} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M3 9a6 6 0 1 1 1.4 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 13.5V9H7.5"           stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReorderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2 5l7-3 7 3v8l-7 3-7-3V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 2v13M2 5l7 3 7-3"        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
