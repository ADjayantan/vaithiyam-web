'use client';

/**
 * apps/web/components/order/OrderSuccessCard.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Order Success Card
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Animated SVG checkmark (circle draws then check strokes in)
 *   • Floating herb-leaf decorative particles
 *   • Order ID with one-tap copy button
 *   • Payment summary strip (method, ID, total)
 *   • Estimated delivery callout badge
 *   • Savings celebration row
 *   • Download invoice CTA  →  GET /api/orders/:id/invoice
 *   • Continue shopping CTA →  /products
 *   • View order details     →  /order/:orderId
 */

import { useState, useEffect }  from 'react';
import Link                     from 'next/link';
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome';
import { faLeaf, faTruck }      from '@fortawesome/free-solid-svg-icons';

// ─── Design tokens (mirrors checkout / RazorpayButton exactly) ─────────────────
const T = {
  forestPrimary: 'var(--vt-forest-700)',
  forestDark:    'var(--vt-forest-900)',
  creamBase:     'rgba(13,34,24,0.35)', // dark glassmorphic input background
  creamAlt:      'rgba(13,34,24,0.60)', // dark selector background
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

const PAYMENT_LABELS: Record<string, string> = {
  upi:      'UPI',
  cod:      'பணமாக கொடுங்கள்',
  razorpay: 'ஆன்லைன் கட்டணம்',
};

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface OrderSuccessCardProps {
  orderId:            string;
  total:              number;
  itemCount:          number;
  paymentMethod:      'upi' | 'cod' | 'razorpay';
  paymentId?:         string;
  upiId?:             string;
  placedAt:           string;   // ISO date string
  estimatedDelivery?: string;   // ISO date string
  savings?:           number;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderSuccessCard({
  orderId,
  total,
  itemCount,
  paymentMethod,
  paymentId,
  upiId,
  placedAt,
  estimatedDelivery,
  savings = 0,
}: OrderSuccessCardProps) {
  const [copied,       setCopied]       = useState(false);
  const [mounted,      setMounted]      = useState(false);
  const [downloading,  setDownloading]  = useState(false);

  useEffect(() => {
    // Stagger slightly so the card enter animation plays first
    const id = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(id);
  }, []);

  // ── Copy order ID ──────────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore — clipboard may be blocked */ }
  };

  // ── Invoice download ───────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`, { headers: authHeaders() });
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `iyarkai-nala-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* silently fail */ } finally {
      setDownloading(false);
    }
  };

  // ── Formatted dates ────────────────────────────────────────────────────────
  const formattedPlaced = (() => {
    try {
      return new Date(placedAt).toLocaleString('ta-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  })();

  const formattedDelivery = (() => {
    if (!estimatedDelivery) return null;
    try {
      return new Date(estimatedDelivery).toLocaleDateString('ta-IN', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
    } catch { return null; }
  })();

  const paymentLabel =
    paymentMethod === 'upi' && upiId
      ? `UPI · ${upiId}`
      : (PAYMENT_LABELS[paymentMethod] ?? paymentMethod);

  return (
    <article
      aria-label="ஆர்டர் வெற்றி விவரங்கள்"
      style={{
        background:   'var(--vt-card)',
        backdropFilter: 'blur(12px)',
        border:       `1px solid ${T.border}`,
        borderRadius: '24px',
        overflow:     'hidden',
        boxShadow:    'var(--vt-shadow-lg)',
        animation:    mounted ? 'vt-sc-enter 420ms cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
        opacity:      mounted ? undefined : 0,
      }}
    >
      {/* ════════════════════════════════════════════════════════════════════
          HEADER — dark forest with floating herb particles + checkmark
      ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: `linear-gradient(150deg, ${T.forestPrimary} 0%, #0D2419 100%)`,
          padding:    '40px 24px 36px',
          textAlign:  'center',
          position:   'relative',
          overflow:   'hidden',
        }}
      >
        {/* Floating leaf particles */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[
            { l: '8%',  t: '-5%',  s: 1.2, d: 0,    r: 0   },
            { l: '20%', t: '60%',  s: 0.8, d: 0.6,  r: 45  },
            { l: '75%', t: '-8%',  s: 1.0, d: 0.9,  r: -20 },
            { l: '88%', t: '55%',  s: 0.7, d: 0.3,  r: 60  },
            { l: '50%', t: '80%',  s: 0.6, d: 1.2,  r: -45 },
            { l: '35%', t: '5%',   s: 0.9, d: 0.7,  r: 30  },
          ].map(({ l, t, s, d, r }, i) => (
            <div
              key={i}
              style={{
                position:  'absolute',
                left:      l,
                top:       t,
                fontSize:  `${22 * s}px`,
                opacity:   0.08,
                animation: `vt-sc-float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${d}s`,
                transform: `rotate(${r}deg)`,
              }}
            >
              <FontAwesomeIcon
                icon={faLeaf}
                style={{
                  width: 16, height: 16,
                  color: 'rgba(61,122,85,0.45)',
                }}
              />
            </div>
          ))}
        </div>

        {/* Animated checkmark */}
        <div
          style={{
            position:       'relative',
            zIndex:         1,
            display:        'inline-flex',
            alignItems:     'center',
            justifyContent: 'center',
            marginBottom:   '22px',
          }}
        >
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            fill="none"
            aria-hidden="true"
          >
            {/* Halo ring */}
            <circle
              cx="48" cy="48" r="46"
              fill="rgba(61,122,85,0.08)"
              stroke="rgba(240,201,110,0.10)"
              strokeWidth="2"
            />
            {/* Animated circle */}
            <circle
              cx="48" cy="48" r="36"
              fill="rgba(61,122,85,0.18)"
              stroke={T.leaf}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeDasharray="226"
              strokeDashoffset={mounted ? '0' : '226'}
              style={{
                transformOrigin: '50% 50%',
                transform:       'rotate(-90deg)',
                transition:      'stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1) 150ms',
              }}
            />
            {/* Checkmark */}
            <path
              d="M30 48L42 60L66 36"
              stroke={T.goldPale}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="52"
              strokeDashoffset={mounted ? '0' : '52'}
              style={{
                transition: 'stroke-dashoffset 520ms cubic-bezier(0.4,0,0.2,1) 950ms',
              }}
            />
          </svg>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: FONT.display,
            fontSize:   'clamp(18px,5vw,23px)',
            fontWeight: 800,
            color:      T.goldPale,
            margin:     '0 0 8px',
            lineHeight: 1.3,
            position:   'relative',
            zIndex:     1,
          }}
        >
          ஆர்டர் வெற்றிகரமாக பதிவாயிற்று!
        </h1>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '14px',
            color:      'rgba(240,201,110,0.72)',
            margin:     '0 0 6px',
            lineHeight: 1.6,
            position:   'relative',
            zIndex:     1,
          }}
        >
          உங்கள் ஆர்டர் பெற்றோம், நன்றி!
        </p>
        {formattedPlaced && (
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '12px',
              color:      'rgba(240,201,110,0.45)',
              margin:     0,
              lineHeight: 1.5,
              position:   'relative',
              zIndex:     1,
            }}
          >
            {formattedPlaced}
          </p>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CONTENT
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '24px' }}>

        {/* Order ID row */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            '10px',
            padding:        '14px 18px',
            background:     'rgba(255, 255, 255, 0.02)',
            border:         `1px solid ${T.border}`,
            borderRadius:   '14px',
            marginBottom:   '16px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily:    FONT.body,
                fontSize:      '10px',
                color:         T.muted,
                margin:        '0 0 3px',
                lineHeight:    1.3,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              ஆர்டர் எண்
            </p>
            <p
              style={{
                fontFamily:    'monospace',
                fontSize:      '14px',
                fontWeight:    700,
                color:         T.gold,
                margin:        0,
                lineHeight:    1.2,
                letterSpacing: '0.05em',
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap',
              }}
            >
              {orderId}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="ஆர்டர் எண் நகலெடுக்கவும்"
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '5px',
              padding:      '7px 14px',
              flexShrink:   0,
              background:   copied ? 'rgba(61,122,85,0.10)' : 'transparent',
              border:       `1px solid ${copied ? T.leaf : 'rgba(255,255,255,0.18)'}`,
              borderRadius: '8px',
              cursor:       'pointer',
              fontFamily:   FONT.body,
              fontSize:     '12px',
              fontWeight:   600,
              color:        copied ? T.leaf : T.secondaryText,
              transition:   'all 160ms ease',
              whiteSpace:   'nowrap',
            }}
          >
            {copied ? <CheckSmIcon /> : <CopyIcon />}
            {copied ? 'நகலெடுக்கப்பட்டது' : 'நகலெடு'}
          </button>
        </div>

        {/* Info table */}
        <div
          style={{
            background:   'rgba(255, 255, 255, 0.02)',
            border:       `1px solid ${T.border}`,
            borderRadius: '14px',
            overflow:     'hidden',
            marginBottom: '16px',
          }}
        >
          <InfoRow label="பொருட்கள்"  value={`${itemCount} items`} />
          <InfoDivider />
          <InfoRow
            label="மொத்த தொகை"
            value={`₹${total.toLocaleString('ta-IN')}`}
            valueColor={T.gold}
            bold
          />
          <InfoDivider />
          <InfoRow label="கட்டண முறை" value={paymentLabel} />
          {paymentId && (
            <>
              <InfoDivider />
              <InfoRow label="கட்டண ஐடி" value={paymentId} mono />
            </>
          )}
        </div>

        {/* Estimated delivery */}
        {formattedDelivery && (
          <div
            role="status"
            aria-label={`எதிர்பார்க்கப்படும் டெலிவரி ${formattedDelivery}`}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '14px',
              padding:      '14px 18px',
              background:   'rgba(201,146,42,0.06)',
              border:       `1px solid rgba(201,146,42,0.22)`,
              borderRadius: '14px',
              marginBottom: '14px',
            }}
          >
            <span style={{ flexShrink: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
              <FontAwesomeIcon icon={faTruck} style={{ width: 22, height: 22, color: '#C9922A' }} />
            </span>
            <div>
              <p
                style={{
                  fontFamily:    FONT.body,
                  fontSize:      '10px',
                  color:         T.muted,
                  margin:        '0 0 3px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight:    1.3,
                }}
              >
                எதிர்பார்க்கப்படும் டெலிவரி
              </p>
              <p
                style={{
                  fontFamily: FONT.display,
                  fontSize:   '16px',
                  fontWeight: 700,
                  color:      T.gold,
                  margin:     0,
                  lineHeight: 1.3,
                }}
              >
                {formattedDelivery}
              </p>
            </div>
          </div>
        )}

        {/* Savings row */}
        {savings > 0 && (
          <div
            role="status"
            aria-label={`இந்த ஆர்டரில் ₹${savings.toLocaleString('ta-IN')} சேமித்தீர்கள்`}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
              padding:      '12px 18px',
              background:   'linear-gradient(135deg,rgba(61,122,85,0.18) 0%,rgba(61,122,85,0.06) 100%)',
              border:       `1px solid rgba(61,122,85,0.30)`,
              borderRadius: '14px',
              marginBottom: '20px',
            }}
          >
            <span style={{ lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
              <FontAwesomeIcon icon={faLeaf} style={{ width: 18, height: 18, color: '#3D7A55' }} />
            </span>
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '14px',
                fontWeight: 700,
                color:      T.leaf,
                margin:     0,
                lineHeight: 1.4,
              }}
            >
              இந்த ஆர்டரில்{' '}
              <strong style={{ fontFamily: FONT.serif }}>
                ₹{savings.toLocaleString('ta-IN')}
              </strong>{' '}
              சேமித்தீர்கள்!
            </p>
          </div>
        )}

        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Primary: Continue Shopping */}
          <Link
            href="/products"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '9px',
              height:         '54px',
              borderRadius:   '14px',
              background:     'linear-gradient(135deg, var(--vt-gold-700), var(--vt-gold-500))',
              color:          '#030C07',
              fontFamily:     FONT.display,
              fontSize:       '16px',
              fontWeight:     700,
              letterSpacing:  '0.02em',
              textDecoration: 'none',
              boxShadow:      '0 4px 16px rgba(201,146,42,0.18)',
              transition:     'background 200ms ease',
              userSelect:     'none',
            }}
          >
            <BagIcon />
            கொள்முதல் தொடரவும்
          </Link>

          {/* Secondary: View Order Details */}
          <Link
            href={`/order/${orderId}`}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
              height:         '50px',
              borderRadius:   '14px',
              background:     'transparent',
              border:         `1.5px solid ${T.border}`,
              color:          T.gold,
              fontFamily:     FONT.display,
              fontSize:       '15px',
              fontWeight:     700,
              textDecoration: 'none',
              transition:     'all 160ms ease',
              userSelect:     'none',
            }}
          >
            <ReceiptIcon />
            ஆர்டர் விவரம் பார்க்கவும்
          </Link>

          {/* Tertiary: Download Invoice */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            aria-label="இன்வாய்ஸ் பதிவிறக்கம்"
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             '7px',
              height:          '42px',
              borderRadius:    '10px',
              background:      'transparent',
              border:          'none',
              color:           downloading ? T.muted : T.secondaryText,
              fontFamily:      FONT.body,
              fontSize:        '13px',
              fontWeight:      600,
              cursor:          downloading ? 'not-allowed' : 'pointer',
              textDecoration:  'underline',
              textUnderlineOffset: '3px',
              opacity:         downloading ? 0.65 : 1,
              transition:      'color 150ms ease',
            }}
          >
            <DownloadIcon />
            {downloading ? 'பதிவிறக்கம் செய்கிறோம்...' : 'இன்வாய்ஸ் பதிவிறக்கம்'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes vt-sc-enter {
          from { opacity: 0; transform: scale(0.95) translateY(18px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes vt-sc-float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%     { transform: translateY(-14px) rotate(10deg); }
        }
      `}</style>
    </article>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  valueColor,
  bold,
  mono,
}: {
  label:       string;
  value:       string;
  valueColor?: string;
  bold?:       boolean;
  mono?:       boolean;
}) {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '10px',
        padding:        '12px 18px',
      }}
    >
      <span
        style={{
          fontFamily: FONT.body,
          fontSize:   '13px',
          color:      T.muted,
          lineHeight: 1.5,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily:   mono ? 'monospace' : FONT.display,
          fontSize:     mono ? '12px' : '14px',
          fontWeight:   bold ? 700 : 600,
          color:        valueColor ?? T.darkText,
          lineHeight:   1.3,
          textAlign:    'right',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          maxWidth:     '65%',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function InfoDivider() {
  return <div aria-hidden="true" style={{ height: '1px', background: T.border, margin: '0 18px' }} />;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="4.5" y="4.5" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 9.5V2a1 1 0 0 1 1-1h7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function CheckSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2 6h14l-1.5 9.5H3.5L2 6z" fill="rgba(240,201,110,0.18)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 6V4.5a3 3 0 0 1 6 0V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ReceiptIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M4 2h10v14l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 6h5M6.5 9h3.5M6.5 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M8 2v9M5 9l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 14h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
