'use client';

/**
 * apps/web/components/checkout/PlaceOrderButton.tsx
 *
 * Place Order CTA — Zone F.2 / Zone F.3
 *
 * Spec: vaithiyam-cart-checkout-spec.md § Zone F.2 (Place Order CTA)
 *                                      § Zone F.3 (Mobile Sticky Footer)
 *
 * Features:
 *  - Primary CTA: "ஆர்டர் செய்யுங்கள்" with total amount displayed inline
 *  - Loading state: spinner + "ஆர்டர் செய்கிறோம்..." — button frozen
 *  - Disabled state: reduced opacity + not-allowed cursor
 *  - Mobile sticky footer: fixed bar at bottom on viewports < 768px
 *  - Security trust indicators: lock icon + "பாதுகாப்பான கட்டணம்"
 *  - Order policy micro-links: Returns & Terms (non-blocking)
 *  - Razorpay/payment logo strip
 *  - Pulse animation on idle state to draw attention
 *  - Accessible: aria-live on status, aria-busy on loading
 *
 * Usage:
 *   <PlaceOrderButton
 *     total={totals.total}
 *     onPlaceOrder={handlePlaceOrder}
 *     isLoading={isSubmitting}
 *     disabled={!addressSelected || !paymentSelected}
 *     disabledReason="முகவரி தேர்வு செய்யவும்"
 *   />
 */

import { useState, useEffect }  from 'react';
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome';
import { faLock, faRotateLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition }  from '@fortawesome/fontawesome-svg-core';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  forestPrimary: '#1A3A2A',
  forestDark:    '#0F2A1C',
  creamBase:     '#F5EFE0',
  creamAlt:      '#EDE3CE',
  gold:          '#C9922A',
  goldPale:      '#F0C96E',
  saffron:       '#E07B39',
  leaf:          '#3D7A55',
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

// ─── Trust indicator items ────────────────────────────────────────────────────
const TRUST_ITEMS: { icon: IconDefinition; label: string }[] = [
  { icon: faLock,        label: 'பாதுகாப்பான கட்டணம்' },
  { icon: faRotateLeft,  label: '7 நாள் திரும்பல்'    },
  { icon: faCircleCheck, label: 'AYUSH அங்கீகாரம்'    },
];

// ─── Payment network badges ───────────────────────────────────────────────────
const PAYMENT_NETWORKS = ['UPI', 'Visa', 'MC', 'RuPay'];

// ─── Props ────────────────────────────────────────────────────────────────────
export interface PlaceOrderButtonProps {
  /** Grand total in INR — shown inside the button */
  total: number;
  /** Called when user confirms the order */
  onPlaceOrder: () => void;
  /** Show spinner + frozen state */
  isLoading?: boolean;
  /** Prevent click — greys out the button */
  disabled?: boolean;
  /**
   * Tamil explanation shown below the button when `disabled` is true.
   * E.g. "முகவரி தேர்வு செய்யவும்" or "கட்டண முறை தேர்வு செய்யவும்"
   */
  disabledReason?: string;
  /**
   * Render as a mobile sticky footer bar.
   * Adds `position: fixed; bottom: 0` with safe-area padding.
   * Desktop: always rendered inline; this flag only changes mobile layout.
   */
  stickyOnMobile?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlaceOrderButton({
  total,
  onPlaceOrder,
  isLoading      = false,
  disabled       = false,
  disabledReason = '',
  stickyOnMobile = true,
}: PlaceOrderButtonProps) {
  const isInteractive = !isLoading && !disabled;

  // Idle pulse — draws attention after 2s of no interaction
  const [pulseActive, setPulseActive] = useState(false);
  useEffect(() => {
    if (!isInteractive) { setPulseActive(false); return; }
    const id = setTimeout(() => setPulseActive(true), 2200);
    return () => clearTimeout(id);
  }, [isInteractive, total]);

  return (
    <>
      {/* ── Desktop inline version ──────────────────────────────────────── */}
      <div className="vt-place-order-desktop">
        <InnerButton
          total={total}
          onPlaceOrder={onPlaceOrder}
          isLoading={isLoading}
          disabled={disabled}
          disabledReason={disabledReason}
          pulseActive={pulseActive && isInteractive}
        />
      </div>

      {/* ── Mobile sticky footer ─────────────────────────────────────────── */}
      {stickyOnMobile && (
        <div
          className="vt-place-order-mobile"
          style={{
            display:    'none',
            position:   'fixed',
            bottom:     0,
            left:       0,
            right:      0,
            zIndex:     400,
            background: '#FFFFFF',
            borderTop:  `1px solid ${T.border}`,
            boxShadow:  '0 -4px 20px rgba(26,58,42,0.12)',
            padding:    '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <InnerButton
            total={total}
            onPlaceOrder={onPlaceOrder}
            isLoading={isLoading}
            disabled={disabled}
            disabledReason={disabledReason}
            pulseActive={pulseActive && isInteractive}
            compact
          />
        </div>
      )}

      {/* Responsive show/hide */}
      <style>{`
        @media (max-width: 767px) {
          .vt-place-order-desktop { display: none !important; }
          .vt-place-order-mobile  { display: block !important; }
        }
        @keyframes vt-order-pulse {
          0%,100% { box-shadow: 0 4px 16px rgba(26,58,42,0.20), 0 0 0 0 rgba(26,58,42,0); }
          60%      { box-shadow: 0 6px 24px rgba(26,58,42,0.28), 0 0 0 8px rgba(26,58,42,0); }
        }
        @keyframes vt-order-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vt-order-loading-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
}

// ─── Inner button (shared between desktop and mobile sticky) ──────────────────
function InnerButton({
  total,
  onPlaceOrder,
  isLoading,
  disabled,
  disabledReason,
  pulseActive,
  compact = false,
}: {
  total:           number;
  onPlaceOrder:    () => void;
  isLoading:       boolean;
  disabled:        boolean;
  disabledReason?: string;
  pulseActive:     boolean;
  compact?:        boolean;
}) {
  const isInteractive = !isLoading && !disabled;

  const buttonHeight = compact ? '52px' : '60px';
  const fontSize     = compact ? '15px' : '17px';

  return (
    <div>
      {/* Disabled reason hint */}
      {disabled && disabledReason && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '7px',
            padding:      '9px 14px',
            marginBottom: '10px',
            background:   'rgba(201,146,42,0.07)',
            border:       '1px solid rgba(201,146,42,0.20)',
            borderRadius: '10px',
          }}
        >
          <WarningIcon />
          <span
            style={{
              fontFamily: FONT.body,
              fontSize:   '13px',
              color:      T.secondaryText,
              lineHeight: 1.4,
            }}
          >
            {disabledReason}
          </span>
        </div>
      )}

      {/* Main CTA button */}
      <button
        type="button"
        onClick={isInteractive ? onPlaceOrder : undefined}
        disabled={!isInteractive}
        aria-label={
          isLoading
            ? 'ஆர்டர் செய்கிறோம், காத்திருங்கள்'
            : disabled
            ? `ஆர்டர் செய்ய இயலாது: ${disabledReason}`
            : `ஆர்டர் செய்யுங்கள் — ₹${total.toLocaleString('ta-IN')}`
        }
        aria-busy={isLoading}
        aria-disabled={!isInteractive}
        style={{
          position:       'relative',
          width:          '100%',
          height:         buttonHeight,
          borderRadius:   '14px',
          border:         'none',
          background:     disabled
            ? 'rgba(26,58,42,0.25)'
            : isLoading
            ? T.forestPrimary
            : `linear-gradient(135deg, ${T.forestPrimary} 0%, #254D38 100%)`,
          color:          disabled ? 'rgba(245,239,224,0.55)' : T.goldPale,
          fontFamily:     FONT.display,
          fontSize,
          fontWeight:     700,
          letterSpacing:  '0.02em',
          cursor:         isInteractive ? 'pointer' : 'not-allowed',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '10px',
          boxShadow:      disabled
            ? 'none'
            : pulseActive
            ? undefined  // handled by animation
            : '0 4px 16px rgba(26,58,42,0.20)',
          animation:      pulseActive && !disabled && !isLoading
            ? 'vt-order-pulse 2.0s ease-in-out infinite'
            : 'none',
          transition:     'background 200ms ease, box-shadow 200ms ease, opacity 200ms ease',
          overflow:       'hidden',
          userSelect:     'none',
        }}
      >
        {/* Loading shimmer bar */}
        {isLoading && (
          <div
            aria-hidden="true"
            style={{
              position:   'absolute',
              inset:      0,
              overflow:   'hidden',
              borderRadius: '14px',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position:   'absolute',
                top:        0,
                left:       0,
                width:      '60%',
                height:     '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(240,201,110,0.15) 50%, transparent 100%)',
                animation:  'vt-order-loading-bar 1.6s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Button content */}
        {isLoading ? (
          <>
            <Spinner />
            <span>ஆர்டர் செய்கிறோம்...</span>
          </>
        ) : (
          <>
            <LockIcon />
            <span>ஆர்டர் செய்யுங்கள்</span>
            <span
              aria-hidden="true"
              style={{
                fontFamily:   FONT.serif,
                fontSize:     compact ? '15px' : '17px',
                fontWeight:   700,
                color:        disabled ? 'rgba(240,201,110,0.55)' : T.goldPale,
                opacity:      0.90,
                borderLeft:   `1px solid rgba(240,201,110,0.25)`,
                paddingLeft:  '12px',
                marginLeft:   '4px',
                lineHeight:   1,
              }}
            >
              ₹{total.toLocaleString('ta-IN')}
            </span>
          </>
        )}
      </button>

      {/* Trust indicators */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'center',
          gap:            '16px',
          flexWrap:       'wrap',
          marginTop:      compact ? '8px' : '12px',
        }}
      >
        {TRUST_ITEMS.map(({ icon, label }) => (
          <span
            key={label}
            style={{
              fontFamily: FONT.body,
              fontSize:   '11px',
              color:      T.muted,
              display:    'flex',
              alignItems: 'center',
              gap:        '4px',
              lineHeight: 1.5,
            }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={icon} style={{ width: 11, height: 11 }} />
            </span>
            {label}
          </span>
        ))}
      </div>

      {/* Payment network strip */}
      {!compact && (
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '8px',
            marginTop:      '12px',
            flexWrap:       'wrap',
          }}
        >
          <span
            style={{
              fontFamily: FONT.body,
              fontSize:   '10px',
              color:      T.muted,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginRight:   '2px',
            }}
          >
            ஆதரிக்கப்படுகிறது:
          </span>
          {PAYMENT_NETWORKS.map((net) => (
            <span
              key={net}
              style={{
                fontFamily:   FONT.body,
                fontSize:     '11px',
                fontWeight:   700,
                color:        T.secondaryText,
                background:   T.creamBase,
                border:       `1px solid ${T.border}`,
                borderRadius: '5px',
                padding:      '2px 8px',
                letterSpacing: '0.03em',
                lineHeight:   1.6,
              }}
            >
              {net}
            </span>
          ))}
        </div>
      )}

      {/* Policy micro-links */}
      {!compact && (
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '11px',
            color:      T.muted,
            textAlign:  'center',
            margin:     '10px 0 0',
            lineHeight: 1.6,
          }}
        >
          "ஆர்டர் செய்யுங்கள்" அழுத்துவதன் மூலம்{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color:          T.secondaryText,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            பயன்பாட்டு விதிமுறைகள்
          </a>
          {' '}மற்றும்{' '}
          <a
            href="/returns"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color:          T.secondaryText,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            திரும்பல் கொள்கை
          </a>
          {' '}ஏற்கிறீர்கள்.
        </p>
      )}
    </div>
  );
}

// ─── Icon sub-components ──────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect
        x="3"
        y="8"
        width="12"
        height="9"
        rx="2"
        fill="rgba(240,201,110,0.20)"
        stroke={T.goldPale}
        strokeWidth="1.5"
      />
      <path
        d="M5.5 8V5.5a3.5 3.5 0 0 1 7 0V8"
        stroke={T.goldPale}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="12" r="1.5" fill={T.goldPale} opacity="0.80" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      style={{ animation: 'vt-order-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="rgba(240,201,110,0.25)"
        strokeWidth="2.2"
      />
      <path
        d="M9 2a7 7 0 0 1 7 7"
        stroke={T.goldPale}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M8 2L1.5 13.5h13L8 2z"
        fill="rgba(201,146,42,0.12)"
        stroke={T.gold}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8 7v3"
        stroke={T.gold}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.5" r="0.75" fill={T.gold} />
    </svg>
  );
}
