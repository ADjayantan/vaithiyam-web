'use client';

/**
 * apps/web/components/payment/RazorpayButton.tsx
 *
 * Vaithiyam — Razorpay Payment CTA Button
 * Next.js 14 · TypeScript strict · Tamil-first · Mobile-responsive
 *
 * ─── Design system ────────────────────────────────────────────────────────────
 *   Mirrors PlaceOrderButton.tsx tokens exactly:
 *   Forest Primary #1A3A2A · Gold Pale #F0C96E · Cream #F5EFE0
 *   Fonts: Mukta Malar (display) · Hind Madurai (body) · Lora (serif)
 *
 * ─── Features ─────────────────────────────────────────────────────────────────
 *   • Initiates the full Razorpay flow via useRazorpay() internally
 *   • Loading state: spinner + "கட்டணம் செய்கிறோம்..." — button frozen
 *   • Script-load state: subtle pulse while checkout.js pre-loads
 *   • Disabled state: greyed, not-allowed cursor, optional reason hint
 *   • Amount display: ₹ formatted in Tamil locale (ta-IN) inside the CTA
 *   • Secure indicators: lock icon · SSL badge · payment network logos
 *   • Error banner: Tamil message with dismiss ×
 *   • stickyOnMobile: fixed bottom bar on < 768 px viewports
 *   • Idle pulse animation after 2 s to draw attention
 *
 * ─── Props ────────────────────────────────────────────────────────────────────
 *   See RazorpayButtonProps below.
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 *   <RazorpayButton
 *     vaithiyamOrderId={order.id}
 *     amount={totals.total}
 *     preferredMethod={paymentMethod}   // 'upi' | 'debit_card' | ...
 *     prefill={{ name: user.name, contact: user.phone, vpa: upiId }}
 *     onSuccess={(orderId) => router.push(`/orders/${orderId}/success`)}
 *     onDismiss={() => setStep(1)}
 *     onFailure={(msg) => toast.error(msg)}
 *     disabled={!isAddressReady}
 *     disabledReason="டெலிவரி முகவரி தேர்வு செய்யவும்"
 *     stickyOnMobile
 *   />
 */

import { useState, useEffect }  from 'react';
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome';
import { faLock, faCircleCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition }  from '@fortawesome/fontawesome-svg-core';
import { useRazorpay }          from '../../hooks/useRazorpay';
import { formatAmountTa }       from '../../lib/payments/razorpay';
import type { InitiatePaymentParams } from '../../hooks/useRazorpay';

// ─── Design tokens (mirrors checkout page / PlaceOrderButton exactly) ─────────

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

// ─── Trust strip items ────────────────────────────────────────────────────────

const TRUST_ITEMS: { icon: IconDefinition; label: string }[] = [
  { icon: faLock,        label: '256-bit SSL'          },
  { icon: faCircleCheck, label: 'பாதுகாப்பான கட்டணம்'   },
  { icon: faRotateLeft,  label: '7 நாள் திரும்பல்'      },
];

// ─── Payment network badges ───────────────────────────────────────────────────

const PAYMENT_NETWORKS = ['UPI', 'Visa', 'MC', 'RuPay', 'NB', 'Wallet'] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RazorpayButtonProps
  extends Pick<InitiatePaymentParams,
    | 'vaithiyamOrderId'
    | 'amount'
    | 'prefill'
    | 'preferredMethod'
    | 'notes'
    | 'onSuccess'
    | 'onDismiss'
    | 'onFailure'
  > {
  /**
   * Disable the button externally (e.g. address not yet selected).
   * Different from isProcessing (which the button manages internally).
   */
  disabled?:      boolean;
  /** Tamil hint shown when disabled=true */
  disabledReason?: string;
  /**
   * Render as a sticky bottom bar on mobile (< 768 px).
   * Desktop always uses the inline variant.
   */
  stickyOnMobile?: boolean;
  /** Override CTA label (default: "கட்டணம் செய்யுங்கள்") */
  ctaLabel?: string;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RazorpayButton({
  vaithiyamOrderId,
  amount,
  prefill,
  preferredMethod,
  notes,
  onSuccess,
  onDismiss,
  onFailure,
  disabled       = false,
  disabledReason = '',
  stickyOnMobile = true,
  ctaLabel       = 'கட்டணம் செய்யுங்கள்',
}: RazorpayButtonProps) {
  const {
    isScriptLoading,
    isProcessing,
    isLoading,
    error,
    resetError,
    initiatePayment,
  } = useRazorpay();

  // Idle pulse — starts 2.2 s after mount when interactive
  const isInteractive = !isLoading && !disabled;
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    if (!isInteractive) { setPulseActive(false); return; }
    const id = setTimeout(() => setPulseActive(true), 2200);
    return () => clearTimeout(id);
  }, [isInteractive, amount]);

  const handleClick = (): void => {
    if (!isInteractive) return;
    void initiatePayment({
      vaithiyamOrderId,
      amount,
      prefill,
      preferredMethod,
      notes,
      onSuccess,
      onDismiss,
      onFailure,
    });
  };

  return (
    <>
      {/* ── Desktop inline ──────────────────────────────────────────────── */}
      <div className="vt-rzp-desktop">
        <Inner
          amount={amount}
          ctaLabel={ctaLabel}
          isScriptLoading={isScriptLoading}
          isProcessing={isProcessing}
          isLoading={isLoading}
          disabled={disabled}
          disabledReason={disabledReason}
          pulseActive={pulseActive && isInteractive}
          error={error}
          onResetError={resetError}
          onClick={handleClick}
        />
      </div>

      {/* ── Mobile sticky footer ─────────────────────────────────────────── */}
      {stickyOnMobile && (
        <div
          className="vt-rzp-mobile"
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
            padding:    'calc(10px + env(safe-area-inset-bottom, 0px)) 16px 12px',
          }}
        >
          <Inner
            amount={amount}
            ctaLabel={ctaLabel}
            isScriptLoading={isScriptLoading}
            isProcessing={isProcessing}
            isLoading={isLoading}
            disabled={disabled}
            disabledReason={disabledReason}
            pulseActive={pulseActive && isInteractive}
            error={error}
            onResetError={resetError}
            onClick={handleClick}
            compact
          />
        </div>
      )}

      {/* Global styles — identical keyframe names to PlaceOrderButton */}
      <style>{`
        @media (max-width: 767px) {
          .vt-rzp-desktop { display: none !important; }
          .vt-rzp-mobile  { display: block !important; }
        }
        @keyframes vt-rzp-pulse {
          0%,100% { box-shadow: 0 4px 16px rgba(26,58,42,0.20), 0 0 0 0 rgba(26,58,42,0); }
          60%     { box-shadow: 0 6px 24px rgba(26,58,42,0.28), 0 0 0 8px rgba(26,58,42,0); }
        }
        @keyframes vt-rzp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vt-rzp-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes vt-rzp-fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vt-rzp-script-pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.65; }
        }
      `}</style>
    </>
  );
}

// ─── Inner button (shared between desktop and mobile sticky) ──────────────────

interface InnerProps {
  amount:          number;
  ctaLabel:        string;
  isScriptLoading: boolean;
  isProcessing:    boolean;
  isLoading:       boolean;
  disabled:        boolean;
  disabledReason:  string;
  pulseActive:     boolean;
  error:           string | null;
  onResetError:    () => void;
  onClick:         () => void;
  compact?:        boolean;
}

function Inner({
  amount,
  ctaLabel,
  isScriptLoading,
  isProcessing,
  isLoading,
  disabled,
  disabledReason,
  pulseActive,
  error,
  onResetError,
  onClick,
  compact = false,
}: InnerProps) {
  const isInteractive = !isLoading && !disabled;
  const buttonHeight  = compact ? '52px' : '60px';
  const fontSize      = compact ? '15px' : '17px';

  return (
    <div>
      {/* ── Hook-level error banner ─────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          '10px',
            padding:      '12px 14px',
            marginBottom: '10px',
            background:   'rgba(139,58,47,0.07)',
            border:       '1px solid rgba(139,58,47,0.22)',
            borderRadius: '12px',
            animation:    'vt-rzp-fade-in 200ms ease-out',
          }}
        >
          <ErrorIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '13px',
                fontWeight: 700,
                color:      T.terracotta,
                margin:     '0 0 2px',
                lineHeight: 1.3,
              }}
            >
              கட்டணத்தில் பிழை
            </p>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '12px',
                color:      T.terracotta,
                margin:     0,
                lineHeight: 1.5,
                opacity:    0.85,
              }}
            >
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={onResetError}
            aria-label="பிழையை மூடவும்"
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      T.terracotta,
              padding:    '2px',
              lineHeight: 1,
              flexShrink: 0,
              opacity:    0.7,
            }}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* ── Disabled reason hint ────────────────────────────────────────── */}
      {disabled && disabledReason && !isLoading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
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

      {/* ── Script pre-loading hint ─────────────────────────────────────── */}
      {isScriptLoading && !isProcessing && (
        <div
          aria-live="polite"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '7px',
            padding:      '7px 12px',
            marginBottom: '8px',
            background:   'rgba(61,122,85,0.06)',
            border:       '1px solid rgba(61,122,85,0.14)',
            borderRadius: '8px',
            animation:    'vt-rzp-script-pulse 1.8s ease-in-out infinite',
          }}
        >
          <ScriptLoadIcon />
          <span
            style={{
              fontFamily: FONT.body,
              fontSize:   '11px',
              color:      T.leaf,
              fontWeight: 600,
            }}
          >
            கட்டண சேவை தயாராகிறது...
          </span>
        </div>
      )}

      {/* ── Main CTA button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={isInteractive ? onClick : undefined}
        disabled={!isInteractive}
        aria-label={
          isProcessing
            ? 'கட்டணம் செய்கிறோம், காத்திருங்கள்'
            : disabled
            ? `கட்டணம் செய்ய இயலாது: ${disabledReason}`
            : `${ctaLabel} — ${formatAmountTa(amount)}`
        }
        aria-busy={isProcessing}
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
          animation:      pulseActive && !disabled && !isLoading
            ? 'vt-rzp-pulse 2.0s ease-in-out infinite'
            : 'none',
          boxShadow: disabled || isLoading
            ? 'none'
            : '0 4px 16px rgba(26,58,42,0.22)',
          transition:   'background 200ms ease, box-shadow 200ms ease',
          overflow:     'hidden',
          userSelect:   'none',
        }}
        onMouseEnter={(e) => {
          if (!isInteractive) return;
          e.currentTarget.style.background = T.forestDark;
          e.currentTarget.style.boxShadow  = '0 6px 22px rgba(26,58,42,0.30)';
        }}
        onMouseLeave={(e) => {
          if (!isInteractive) return;
          e.currentTarget.style.background =
            `linear-gradient(135deg, ${T.forestPrimary} 0%, #254D38 100%)`;
          e.currentTarget.style.boxShadow  = '0 4px 16px rgba(26,58,42,0.22)';
        }}
      >
        {/* Loading shimmer bar */}
        {isLoading && (
          <div
            aria-hidden="true"
            style={{
              position:     'absolute',
              inset:        0,
              overflow:     'hidden',
              borderRadius: '14px',
              pointerEvents:'none',
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
                animation:  'vt-rzp-shimmer 1.6s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Button content */}
        {isProcessing ? (
          <>
            <Spinner />
            <span>கட்டணம் செய்கிறோம்...</span>
          </>
        ) : isScriptLoading ? (
          <>
            <ScriptSpinner />
            <span>{ctaLabel}</span>
          </>
        ) : (
          <>
            <LockIcon />
            <span>{ctaLabel}</span>

            {/* Amount — separated by a faint divider */}
            <span
              aria-hidden="true"
              style={{
                fontFamily:  FONT.serif,
                fontSize,
                fontWeight:  700,
                color:       disabled ? 'rgba(240,201,110,0.55)' : T.goldPale,
                opacity:     0.92,
                borderLeft:  `1px solid rgba(240,201,110,0.25)`,
                paddingLeft: '12px',
                marginLeft:  '4px',
                lineHeight:  1,
              }}
            >
              {formatAmountTa(amount)}
            </span>
          </>
        )}
      </button>

      {/* ── Trust strip ─────────────────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'center',
          alignItems:     'center',
          gap:            compact ? '12px' : '18px',
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
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={icon} style={{ width: 11, height: 11 }} />
            </span>
            {label}
          </span>
        ))}
      </div>

      {/* ── Payment network strip (desktop only) ────────────────────────── */}
      {!compact && (
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '7px',
            marginTop:      '12px',
            flexWrap:       'wrap',
          }}
        >
          <span
            style={{
              fontFamily:    FONT.body,
              fontSize:      '10px',
              color:         T.muted,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            ஆதரிக்கப்படுகிறது:
          </span>
          {PAYMENT_NETWORKS.map((net) => (
            <span
              key={net}
              style={{
                fontFamily:    FONT.body,
                fontSize:      '11px',
                fontWeight:    700,
                color:         T.secondaryText,
                background:    T.creamBase,
                border:        `1px solid ${T.border}`,
                borderRadius:  '5px',
                padding:       '2px 8px',
                letterSpacing: '0.03em',
                lineHeight:    1.6,
              }}
            >
              {net}
            </span>
          ))}
        </div>
      )}

      {/* ── Powered-by Razorpay note ─────────────────────────────────────── */}
      {!compact && (
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '10px',
            color:      T.muted,
            textAlign:  'center',
            margin:     '10px 0 0',
            lineHeight: 1.6,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap:        '5px',
          }}
        >
          <RazorpayBadgeIcon />
          Razorpay மூலம் பாதுகாக்கப்படுகிறது
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
      style={{ animation: 'vt-rzp-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <circle cx="9" cy="9" r="7" stroke="rgba(240,201,110,0.25)" strokeWidth="2.2" />
      <path
        d="M9 2a7 7 0 0 1 7 7"
        stroke={T.goldPale}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScriptSpinner() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ animation: 'vt-rzp-spin 1.0s linear infinite', flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="6" stroke="rgba(240,201,110,0.20)" strokeWidth="2" />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="rgba(240,201,110,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScriptLoadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 1L2.5 3v3.5c0 2.8 2 5 4.5 6 2.5-1 4.5-3.2 4.5-6V3L7 1z"
        fill="rgba(61,122,85,0.15)"
        stroke={T.leaf}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M5 7l1.5 1.5 2.5-3"
        stroke={T.leaf}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      <path d="M8 7v3" stroke={T.gold} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill={T.gold} />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: '1px' }}
    >
      <circle cx="8" cy="8" r="6.5" fill="rgba(139,58,47,0.10)" stroke={T.terracotta} strokeWidth="1.3" />
      <path d="M8 5v4" stroke={T.terracotta} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.85" fill={T.terracotta} />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 3.5l7 7M10.5 3.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RazorpayBadgeIcon() {
  // Minimal "R" shield mark in forest green
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 1L2 3.5v4C2 10 4 12.5 7 13.5c3-1 5-3.5 5-6V3.5L7 1z"
        fill="rgba(26,58,42,0.12)"
        stroke={T.muted}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 5h2.2c.7 0 1.3.5 1.3 1.2 0 .6-.4 1-1 1.1L9.5 9H8.3L7 7.3H6.5V9H5.5V5z"
        fill={T.muted}
      />
    </svg>
  );
}
