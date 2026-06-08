'use client';

/**
 * apps/web/components/order/OrderFailureCard.tsx
 *
 * Vaithiyam — Order Failure Card
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Animated X / warning SVG with pulse ring
 *   • Tamil payment failure headline + error reason
 *   • Order ID display (if available)
 *   • Amount attempted (if available)
 *   • "மீண்டும் முயற்சிக்கவும்" retry CTA  →  back to checkout
 *   • "வேறு கட்டண முறை" alternate method CTA
 *   • "கார்ட்டிற்கு திரும்பு" secondary link
 *   • Support contact row (phone + WhatsApp)
 */

import { useState, useEffect }  from 'react';
import Link                     from 'next/link';
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome';
import { faPhone }              from '@fortawesome/free-solid-svg-icons';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  forestPrimary: '#1A3A2A',
  forestDark:    '#0F2A1C',
  creamBase:     '#F5EFE0',
  creamAlt:      '#EDE3CE',
  gold:          '#C9922A',
  goldPale:      '#F0C96E',
  leaf:          '#3D7A55',
  saffron:       '#E07B39',
  terracotta:    '#8B3A2F',
  errorBg:       '#FDF3F1',
  errorBorder:   'rgba(139,58,47,0.22)',
  darkText:      '#1C1410',
  secondaryText: '#5C4A30',
  muted:         '#9C8060',
  border:        '#DDD0B8',
} as const;

const FONT = {
  display: "'Mukta Malar', sans-serif",
  body:    "'Hind Madurai', sans-serif",
  serif:   "'Lora', serif",
} as const;

// Razorpay error code → friendlier Tamil description
const ERROR_HINTS: Record<string, string> = {
  BAD_REQUEST_ERROR:     'கட்டண விவரங்கள் சரியில்லை.',
  GATEWAY_ERROR:         'கட்டண நுழைவாயில் இணைப்பில் சிக்கல்.',
  SERVER_ERROR:          'சேவையகத்தில் தற்காலிக பிழை.',
  NETWORK_ERROR:         'இணைய இணைப்பில் தடை ஏற்பட்டது.',
  BAD_REQUEST_DECLINED:  'வங்கி கட்டணத்தை நிராகரித்தது.',
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface OrderFailureCardProps {
  /** Vaithiyam order ID that was attempted */
  orderId?:      string;
  /** Tamil error message from useRazorpay / verifyPayment */
  errorMessage?: string;
  /** Raw Razorpay error code for look-up */
  errorCode?:    string;
  /** Amount that was attempted, in INR */
  amount?:       number;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderFailureCard({
  orderId,
  errorMessage,
  errorCode,
  amount,
}: OrderFailureCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(id);
  }, []);

  const hint = errorCode ? (ERROR_HINTS[errorCode] ?? null) : null;
  const displayError = errorMessage ?? 'கட்டணம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.';

  // Retry link: back to checkout (optionally pre-selecting order)
  const retryHref = orderId ? `/checkout?orderId=${orderId}` : '/checkout';

  return (
    <article
      aria-label="கட்டண தோல்வி விவரங்கள்"
      style={{
        background:   '#FFFFFF',
        border:       `1px solid ${T.errorBorder}`,
        borderRadius: '24px',
        overflow:     'hidden',
        boxShadow:    '0 8px 40px rgba(139,58,47,0.10)',
        animation:    mounted ? 'vt-fc-enter 380ms cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
        opacity:      mounted ? undefined : 0,
      }}
    >
      {/* ════════════════════════════════════════════════════════════════════
          HEADER — warm terracotta gradient
      ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: 'linear-gradient(150deg, #6B2A22 0%, #4A1A14 100%)',
          padding:    '40px 24px 36px',
          textAlign:  'center',
          position:   'relative',
          overflow:   'hidden',
        }}
      >
        {/* Subtle texture dots */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06 }}>
          {[10, 30, 55, 75, 90].map((l, i) => (
            <div
              key={i}
              style={{
                position:  'absolute',
                left:      `${l}%`,
                top:       `${20 + (i % 3) * 25}%`,
                width:     '8px',
                height:    '8px',
                borderRadius: '50%',
                background: 'rgba(255,200,150,0.7)',
                animation: `vt-fc-pulse ${2 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Animated X icon */}
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
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
            {/* Pulse ring */}
            <circle
              cx="48" cy="48" r="46"
              fill="none"
              stroke="rgba(255,120,80,0.12)"
              strokeWidth="2"
              style={{ animation: mounted ? 'vt-fc-ring 2s ease-out infinite' : 'none' }}
            />
            {/* Main circle */}
            <circle
              cx="48" cy="48" r="36"
              fill="rgba(139,58,47,0.22)"
              stroke="rgba(255,150,100,0.70)"
              strokeWidth="2.8"
              strokeDasharray="226"
              strokeDashoffset={mounted ? '0' : '226'}
              style={{
                transformOrigin: '50% 50%',
                transform:       'rotate(-90deg)',
                transition:      'stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1) 150ms',
              }}
            />
            {/* X mark */}
            <path
              d="M34 34l28 28M62 34L34 62"
              stroke="rgba(255,200,170,0.90)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray="42"
              strokeDashoffset={mounted ? '0' : '42'}
              style={{
                transition: 'stroke-dashoffset 480ms cubic-bezier(0.4,0,0.2,1) 900ms',
              }}
            />
          </svg>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: FONT.display,
            fontSize:   'clamp(18px,5vw,22px)',
            fontWeight: 800,
            color:      'rgba(255,220,200,0.95)',
            margin:     '0 0 8px',
            lineHeight: 1.3,
            position:   'relative',
            zIndex:     1,
          }}
        >
          கட்டணம் தோல்வியடைந்தது
        </h1>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '14px',
            color:      'rgba(255,200,170,0.72)',
            margin:     0,
            lineHeight: 1.6,
            position:   'relative',
            zIndex:     1,
          }}
        >
          கவலைப்பட வேண்டாம் — மீண்டும் முயற்சிக்கலாம்.
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CONTENT
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '24px' }}>

        {/* Error message banner */}
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          '12px',
            padding:      '14px 18px',
            background:   T.errorBg,
            border:       `1px solid ${T.errorBorder}`,
            borderRadius: '14px',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1.4 }} aria-hidden="true">⚠️</span>
          <div>
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '14px',
                fontWeight: 700,
                color:      T.terracotta,
                margin:     '0 0 4px',
                lineHeight: 1.3,
              }}
            >
              {displayError}
            </p>
            {hint && (
              <p
                style={{
                  fontFamily: FONT.body,
                  fontSize:   '12px',
                  color:      T.terracotta,
                  margin:     0,
                  opacity:    0.80,
                  lineHeight: 1.5,
                }}
              >
                {hint}
              </p>
            )}
          </div>
        </div>

        {/* Order meta */}
        {(orderId || amount) && (
          <div
            style={{
              background:   'rgba(245,239,224,0.45)',
              border:       `1px solid ${T.border}`,
              borderRadius: '14px',
              overflow:     'hidden',
              marginBottom: '20px',
            }}
          >
            {orderId && (
              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'center',
                  padding:        '12px 18px',
                }}
              >
                <span style={{ fontFamily: FONT.body, fontSize: '13px', color: T.muted }}>
                  ஆர்டர் எண்
                </span>
                <span
                  style={{
                    fontFamily:    'monospace',
                    fontSize:      '13px',
                    fontWeight:    600,
                    color:         T.darkText,
                    letterSpacing: '0.04em',
                  }}
                >
                  {orderId}
                </span>
              </div>
            )}
            {orderId && amount && (
              <div aria-hidden="true" style={{ height: '1px', background: T.border, margin: '0 18px' }} />
            )}
            {amount && (
              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'center',
                  padding:        '12px 18px',
                }}
              >
                <span style={{ fontFamily: FONT.body, fontSize: '13px', color: T.muted }}>
                  முயன்ற தொகை
                </span>
                <span
                  style={{
                    fontFamily: FONT.serif,
                    fontSize:   '15px',
                    fontWeight: 700,
                    color:      T.terracotta,
                  }}
                >
                  ₹{amount.toLocaleString('ta-IN')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Primary: Retry */}
          <Link
            href={retryHref}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '9px',
              height:         '54px',
              borderRadius:   '14px',
              background:     `linear-gradient(135deg,${T.forestPrimary} 0%,#254D38 100%)`,
              color:          T.goldPale,
              fontFamily:     FONT.display,
              fontSize:       '16px',
              fontWeight:     700,
              letterSpacing:  '0.02em',
              textDecoration: 'none',
              boxShadow:      '0 4px 16px rgba(26,58,42,0.22)',
              transition:     'background 200ms ease',
              userSelect:     'none',
            }}
          >
            <RetryIcon />
            மீண்டும் முயற்சிக்கவும்
          </Link>

          {/* Secondary: Cart */}
          <Link
            href="/cart"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
              height:         '50px',
              borderRadius:   '14px',
              background:     'transparent',
              border:         `1.5px solid rgba(26,58,42,0.20)`,
              color:          T.forestPrimary,
              fontFamily:     FONT.display,
              fontSize:       '15px',
              fontWeight:     700,
              textDecoration: 'none',
              transition:     'all 160ms ease',
              userSelect:     'none',
            }}
          >
            <CartIcon />
            கார்ட்டிற்கு திரும்பு
          </Link>
        </div>

        {/* ── Support contact ───────────────────────────────────────────────── */}
        <div
          style={{
            marginTop:    '20px',
            padding:      '16px 18px',
            background:   'rgba(245,239,224,0.50)',
            border:       `1px solid ${T.border}`,
            borderRadius: '14px',
          }}
        >
          <p
            style={{
              fontFamily: FONT.display,
              fontSize:   '13px',
              fontWeight: 700,
              color:      T.secondaryText,
              margin:     '0 0 10px',
              lineHeight: 1.4,
            }}
          >
            உதவி தேவையா?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a
              href="tel:+918800000000"
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '10px',
                padding:        '10px 14px',
                background:     '#FFFFFF',
                border:         `1px solid ${T.border}`,
                borderRadius:   '10px',
                textDecoration: 'none',
                transition:     'border-color 150ms ease',
              }}
            >
              <span style={{ lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
                <FontAwesomeIcon icon={faPhone} style={{ width: 14, height: 14, color: '#1A3A2A' }} />
              </span>
              <span style={{ fontFamily: FONT.body, fontSize: '13px', fontWeight: 600, color: T.darkText }}>
                +91 88000 00000
              </span>
              <span style={{ fontFamily: FONT.body, fontSize: '11px', color: T.muted, marginLeft: 'auto' }}>
                காலை 9 – இரவு 9
              </span>
            </a>
            <a
              href="https://wa.me/918800000000"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '10px',
                padding:        '10px 14px',
                background:     '#FFFFFF',
                border:         `1px solid rgba(37,211,102,0.30)`,
                borderRadius:   '10px',
                textDecoration: 'none',
                transition:     'border-color 150ms ease',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💬</span>
              <span style={{ fontFamily: FONT.body, fontSize: '13px', fontWeight: 600, color: T.darkText }}>
                WhatsApp ஆதரவு
              </span>
              <span style={{ fontFamily: FONT.body, fontSize: '11px', color: T.leaf, marginLeft: 'auto', fontWeight: 600 }}>
                விரைவு பதில்
              </span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vt-fc-enter {
          from { opacity: 0; transform: scale(0.95) translateY(18px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes vt-fc-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          80%  { transform: scale(1.18); opacity: 0; }
          100% { transform: scale(1.18); opacity: 0; }
        }
        @keyframes vt-fc-pulse {
          0%,100% { transform: scale(1);   opacity: 1; }
          50%     { transform: scale(1.8); opacity: 0.4; }
        }
      `}</style>
    </article>
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
function CartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M1 1h2.5l2 9h8.5l1.5-6H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
