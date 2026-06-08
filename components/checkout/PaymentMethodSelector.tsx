'use client';

/**
 * apps/web/components/checkout/PaymentMethodSelector.tsx
 *
 * Payment method selection — Zone E.2 (Checkout step 2: கட்டணம்)
 *
 * Spec: vaithiyam-cart-checkout-spec.md § Zone E.2 (Payment Methods)
 * Migration: MedPlus selectPayment() / COD|UPI|Card|NetBanking → typed React component
 *
 * Payment methods (UI-level):
 *   upi          → maps to PaymentMethod 'upi'  (recommended)
 *   debit_card   → maps to PaymentMethod 'razorpay'
 *   credit_card  → maps to PaymentMethod 'razorpay'
 *   net_banking  → maps to PaymentMethod 'razorpay'
 *   cod          → maps to PaymentMethod 'cod'
 *
 * Features:
 *   - Recommended badge on UPI
 *   - Security lock indicator on all online methods
 *   - UPI ID sub-input when UPI is selected
 *   - Card number hint (last 4 digits only) placeholder for card methods
 *   - Popular bank logos row for Net Banking
 *   - COD extra-charge note (if applicable)
 *   - Selected state: forest-primary border + left accent bar + check
 *   - Mobile-responsive full-width layout
 */

import { useState, useCallback, useId } from 'react';
import { FontAwesomeIcon }              from '@fortawesome/react-fontawesome';
import { faMoneyBill }                  from '@fortawesome/free-solid-svg-icons';
import type { PaymentMethod }           from '../../types/order';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  forestPrimary: '#1A3A2A',
  forestDark:    '#0F2A1C',
  creamBase:     '#F5EFE0',
  creamAlt:      '#EDE3CE',
  gold:          '#C9922A',
  goldPale:      '#F0C96E',
  leaf:          '#3D7A55',
  saffron:       '#E07B39',
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

// ─── UI-level payment method type ─────────────────────────────────────────────
export type UiPaymentMethod =
  | 'upi'
  | 'debit_card'
  | 'credit_card'
  | 'net_banking'
  | 'cod';

/** Map UI method → API PaymentMethod */
export function toApiPaymentMethod(ui: UiPaymentMethod): PaymentMethod {
  if (ui === 'cod') return 'cod';
  if (ui === 'upi') return 'upi';
  return 'razorpay';
}

// ─── Method config ────────────────────────────────────────────────────────────
interface MethodConfig {
  id:           UiPaymentMethod;
  labelTa:      string;
  labelEn:      string;
  descTa:       string;
  icon:         React.ReactNode;
  recommended?: boolean;
  secure?:      boolean;
  codNote?:     string;
}

const METHODS: MethodConfig[] = [
  {
    id:          'upi',
    labelTa:     'UPI',
    labelEn:     'Unified Payments Interface',
    descTa:      'Google Pay, PhonePe, Paytm மற்றும் எல்லா UPI ஆப்களும்',
    icon:        <UpiIcon />,
    recommended: true,
    secure:      true,
  },
  {
    id:      'debit_card',
    labelTa: 'டெபிட் கார்டு',
    labelEn: 'Debit Card',
    descTa:  'Visa, Mastercard, RuPay',
    icon:    <DebitCardIcon />,
    secure:  true,
  },
  {
    id:      'credit_card',
    labelTa: 'கிரெடிட் கார்டு',
    labelEn: 'Credit Card',
    descTa:  'Visa, Mastercard, Amex, Diners',
    icon:    <CreditCardIcon />,
    secure:  true,
  },
  {
    id:      'net_banking',
    labelTa: 'நெட் பேங்கிங்',
    labelEn: 'Net Banking',
    descTa:  'SBI, HDFC, ICICI, Axis மற்றும் 50+ வங்கிகள்',
    icon:    <BankIcon />,
    secure:  true,
  },
  {
    id:      'cod',
    labelTa: 'பணமாக கொடுங்கள்',
    labelEn: 'Cash on Delivery',
    descTa:  'டெலிவரியின் போது நேரில் கட்டலாம்',
    icon:    <CodIcon />,
    secure:  false,
  },
];

// Popular banks for Net Banking expand row
const POPULAR_BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Yes Bank'];

// ─── Props ────────────────────────────────────────────────────────────────────
export interface PaymentMethodSelectorProps {
  value:    UiPaymentMethod;
  onChange: (method: UiPaymentMethod) => void;
  /** UPI ID value (controlled by parent) */
  upiId?:       string;
  onUpiChange?: (id: string) => void;
  /** Disable all methods (e.g. while order is processing) */
  disabled?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PaymentMethodSelector({
  value,
  onChange,
  upiId = '',
  onUpiChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const groupId = useId();
  const [upiError,    setUpiError]    = useState('');
  const [upiTouched,  setUpiTouched]  = useState(false);
  const [bankExpanded,setBankExpanded] = useState(false);

  const handleSelect = useCallback(
    (id: UiPaymentMethod) => {
      if (disabled) return;
      onChange(id);
      // Clear UPI error when switching away
      if (id !== 'upi') {
        setUpiError('');
        setUpiTouched(false);
      }
    },
    [onChange, disabled],
  );

  const handleUpiChange = useCallback(
    (raw: string) => {
      onUpiChange?.(raw);
      if (upiTouched) {
        setUpiError(validateUpi(raw));
      }
    },
    [onUpiChange, upiTouched],
  );

  const handleUpiBlur = useCallback(() => {
    setUpiTouched(true);
    setUpiError(validateUpi(upiId));
  }, [upiId]);

  return (
    <section aria-label="கட்டண முறை தேர்வு">
      {/* Section header */}
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '8px',
          marginBottom:'14px',
        }}
      >
        <LockShieldIcon />
        <h3
          style={{
            fontFamily: FONT.display,
            fontSize:   '17px',
            fontWeight: 700,
            color:      T.darkText,
            margin:     0,
          }}
        >
          கட்டண முறை
        </h3>
      </div>

      {/* SSL trust strip */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          marginBottom: '16px',
          padding:      '8px 12px',
          background:   'rgba(61,122,85,0.06)',
          border:       '1px solid rgba(61,122,85,0.15)',
          borderRadius: '8px',
        }}
      >
        <SslIcon />
        <span
          style={{
            fontFamily: FONT.body,
            fontSize:   '11px',
            color:      T.leaf,
            fontWeight: 600,
          }}
        >
          256-bit SSL குறியாக்கம் — உங்கள் தகவல் முழுமையாக பாதுகாக்கப்படுகிறது
        </span>
      </div>

      {/* Method cards */}
      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {METHODS.map((method) => {
          const isSelected = value === method.id;

          return (
            <div key={method.id}>
              {/* Main card */}
              <div
                role="radio"
                aria-checked={isSelected}
                aria-label={method.labelTa}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleSelect(method.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(method.id);
                  }
                }}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '14px',
                  padding:      '14px 16px',
                  borderRadius: '14px',
                  border:       isSelected
                    ? `1.5px solid ${T.forestPrimary}`
                    : `1.5px solid ${T.border}`,
                  background:   isSelected
                    ? 'rgba(26,58,42,0.04)'
                    : '#FFFFFF',
                  cursor:       disabled ? 'not-allowed' : 'pointer',
                  opacity:      disabled ? 0.6 : 1,
                  borderLeft:   isSelected
                    ? `4px solid ${T.forestPrimary}`
                    : `4px solid transparent`,
                  boxShadow:    isSelected
                    ? '0 2px 12px rgba(26,58,42,0.10)'
                    : '0 1px 4px rgba(26,58,42,0.05)',
                  transition:   'all 180ms ease',
                  position:     'relative',
                  userSelect:   'none',
                }}
              >
                {/* Payment icon */}
                <div
                  aria-hidden="true"
                  style={{
                    flexShrink:     0,
                    width:          '44px',
                    height:         '44px',
                    borderRadius:   '10px',
                    background:     isSelected
                      ? 'rgba(26,58,42,0.08)'
                      : 'rgba(245,239,224,0.60)',
                    border:         `1px solid ${isSelected ? 'rgba(26,58,42,0.15)' : T.border}`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    transition:     'background 180ms ease',
                  }}
                >
                  {method.icon}
                </div>

                {/* Label + description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        '7px',
                      flexWrap:   'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT.display,
                        fontSize:   '15px',
                        fontWeight: isSelected ? 700 : 600,
                        color:      isSelected ? T.darkText : T.secondaryText,
                        transition: 'color 180ms ease',
                      }}
                    >
                      {method.labelTa}
                    </span>

                    {/* Recommended badge */}
                    {method.recommended && (
                      <span
                        style={{
                          fontFamily:  FONT.body,
                          fontSize:    '10px',
                          fontWeight:  700,
                          background:  T.leaf,
                          color:       '#FFFFFF',
                          padding:     '2px 8px',
                          borderRadius:'100px',
                          lineHeight:  1.6,
                          whiteSpace:  'nowrap',
                          letterSpacing: '0.02em',
                        }}
                      >
                        பரிந்துரை
                      </span>
                    )}

                    {/* Secure badge */}
                    {method.secure && (
                      <span
                        aria-label="பாதுகாப்பான கட்டணம்"
                        style={{
                          display:    'inline-flex',
                          alignItems: 'center',
                          gap:        '3px',
                          fontFamily: FONT.body,
                          fontSize:   '10px',
                          fontWeight: 600,
                          color:      T.muted,
                          lineHeight: 1.5,
                        }}
                      >
                        <MiniLockIcon />
                        பாதுகாப்பானது
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      fontFamily: FONT.body,
                      fontSize:   '12px',
                      color:      T.muted,
                      margin:     '3px 0 0',
                      lineHeight: 1.4,
                    }}
                  >
                    {method.descTa}
                  </p>
                </div>

                {/* Selection indicator */}
                <div
                  aria-hidden="true"
                  style={{
                    width:          '22px',
                    height:         '22px',
                    borderRadius:   '50%',
                    border:         isSelected
                      ? `2px solid ${T.forestPrimary}`
                      : `2px solid ${T.border}`,
                    background:     isSelected ? T.forestPrimary : '#FFFFFF',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    transition:     'all 180ms ease',
                    flexShrink:     0,
                  }}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6.5l2.5 2.5 5.5-5.5"
                        stroke="#F5EFE0"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* ── UPI sub-input ─────────────────────────────────────── */}
              {isSelected && method.id === 'upi' && (
                <div
                  style={{
                    marginTop:    '-4px',
                    padding:      '16px 16px 14px',
                    background:   'rgba(26,58,42,0.03)',
                    border:       `1.5px solid ${T.forestPrimary}`,
                    borderTop:    'none',
                    borderRadius: '0 0 14px 14px',
                    animation:    'vt-expand-down 180ms ease-out',
                  }}
                >
                  <label
                    htmlFor="vt-upi-id"
                    style={{
                      fontFamily:  FONT.body,
                      fontSize:    '12px',
                      fontWeight:  600,
                      color:       T.secondaryText,
                      display:     'block',
                      marginBottom:'7px',
                    }}
                  >
                    UPI ID
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="vt-upi-id"
                      type="text"
                      value={upiId}
                      onChange={(e) => handleUpiChange(e.target.value)}
                      onBlur={handleUpiBlur}
                      placeholder="name@upi"
                      autoComplete="off"
                      aria-invalid={!!upiError}
                      aria-describedby={upiError ? 'vt-upi-error' : undefined}
                      style={{
                        flex:         1,
                        height:       '44px',
                        padding:      '0 14px',
                        fontFamily:   FONT.body,
                        fontSize:     '14px',
                        color:        T.darkText,
                        background:   '#FFFFFF',
                        border:       `1.5px solid ${upiError ? '#DC2626' : T.border}`,
                        borderRadius: '8px',
                        outline:      'none',
                        transition:   'border-color 150ms ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = upiError
                          ? '#DC2626'
                          : 'rgba(26,58,42,0.50)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,58,42,0.08)';
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      style={{
                        height:       '44px',
                        padding:      '0 16px',
                        background:   T.forestPrimary,
                        color:        T.goldPale,
                        border:       'none',
                        borderRadius: '8px',
                        fontFamily:   FONT.display,
                        fontSize:     '13px',
                        fontWeight:   700,
                        cursor:       'pointer',
                        flexShrink:   0,
                        whiteSpace:   'nowrap',
                        transition:   'background 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.forestDark)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = T.forestPrimary)}
                    >
                      சரிபார்க்கவும்
                    </button>
                  </div>
                  {upiError && (
                    <p
                      id="vt-upi-error"
                      role="alert"
                      style={{
                        fontFamily: FONT.body,
                        fontSize:   '12px',
                        color:      '#DC2626',
                        margin:     '6px 0 0',
                      }}
                    >
                      {upiError}
                    </p>
                  )}
                  <p
                    style={{
                      fontFamily: FONT.body,
                      fontSize:   '11px',
                      color:      T.muted,
                      margin:     '8px 0 0',
                      lineHeight: 1.5,
                    }}
                  >
                    எடுத்துக்காட்டு: mobilenumber@paytm, name@oksbi, name@ybl
                  </p>
                </div>
              )}

              {/* ── Card sub-form ─────────────────────────────────────── */}
              {isSelected && (method.id === 'debit_card' || method.id === 'credit_card') && (
                <div
                  style={{
                    marginTop:    '-4px',
                    padding:      '14px 16px',
                    background:   'rgba(26,58,42,0.03)',
                    border:       `1.5px solid ${T.forestPrimary}`,
                    borderTop:    'none',
                    borderRadius: '0 0 14px 14px',
                    animation:    'vt-expand-down 180ms ease-out',
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONT.body,
                      fontSize:   '12px',
                      color:      T.secondaryText,
                      margin:     0,
                      lineHeight: 1.5,
                      display:    'flex',
                      alignItems: 'center',
                      gap:        '6px',
                    }}
                  >
                    <MiniLockIcon />
                    கார்டு விவரங்கள் Razorpay பாதுகாப்பான gateway மூலம் சேகரிக்கப்படும்.
                    இந்த பக்கத்தில் கார்டு தகவல் தேவையில்லை.
                  </p>
                  {/* Card network logos */}
                  <div
                    style={{
                      display:    'flex',
                      gap:        '8px',
                      marginTop:  '10px',
                      flexWrap:   'wrap',
                    }}
                  >
                    {['Visa', 'Mastercard', 'RuPay', ...(method.id === 'credit_card' ? ['Amex'] : [])].map(
                      (net) => (
                        <span
                          key={net}
                          style={{
                            fontFamily:   FONT.body,
                            fontSize:     '11px',
                            fontWeight:   700,
                            color:        T.muted,
                            background:   T.creamBase,
                            border:       `1px solid ${T.border}`,
                            borderRadius: '6px',
                            padding:      '3px 9px',
                            lineHeight:   1.5,
                          }}
                        >
                          {net}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* ── Net Banking bank row ──────────────────────────────── */}
              {isSelected && method.id === 'net_banking' && (
                <div
                  style={{
                    marginTop:    '-4px',
                    padding:      '14px 16px',
                    background:   'rgba(26,58,42,0.03)',
                    border:       `1.5px solid ${T.forestPrimary}`,
                    borderTop:    'none',
                    borderRadius: '0 0 14px 14px',
                    animation:    'vt-expand-down 180ms ease-out',
                  }}
                >
                  <p
                    style={{
                      fontFamily:  FONT.body,
                      fontSize:    '12px',
                      fontWeight:  600,
                      color:       T.secondaryText,
                      margin:      '0 0 8px',
                    }}
                  >
                    பிரபலமான வங்கிகள்
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {POPULAR_BANKS.slice(0, bankExpanded ? POPULAR_BANKS.length : 4).map(
                      (bank) => (
                        <span
                          key={bank}
                          style={{
                            fontFamily:   FONT.body,
                            fontSize:     '12px',
                            fontWeight:   600,
                            color:        T.secondaryText,
                            background:   T.creamBase,
                            border:       `1px solid ${T.border}`,
                            borderRadius: '6px',
                            padding:      '5px 12px',
                            lineHeight:   1.5,
                          }}
                        >
                          {bank}
                        </span>
                      ),
                    )}
                    {!bankExpanded && (
                      <button
                        type="button"
                        onClick={() => setBankExpanded(true)}
                        style={{
                          fontFamily:   FONT.body,
                          fontSize:     '12px',
                          fontWeight:   600,
                          color:        T.gold,
                          background:   'transparent',
                          border:       'none',
                          cursor:       'pointer',
                          padding:      '5px 0',
                          lineHeight:   1.5,
                        }}
                      >
                        +{POPULAR_BANKS.length - 4} மேலும்
                      </button>
                    )}
                  </div>
                  <p
                    style={{
                      fontFamily: FONT.body,
                      fontSize:   '11px',
                      color:      T.muted,
                      margin:     '8px 0 0',
                      lineHeight: 1.5,
                    }}
                  >
                    50+ வங்கிகள் ஆதரிக்கப்படுகின்றன.
                  </p>
                </div>
              )}

              {/* ── COD note ─────────────────────────────────────────── */}
              {isSelected && method.id === 'cod' && (
                <div
                  style={{
                    marginTop:    '-4px',
                    padding:      '12px 16px',
                    background:   'rgba(201,146,42,0.05)',
                    border:       `1.5px solid ${T.forestPrimary}`,
                    borderTop:    'none',
                    borderRadius: '0 0 14px 14px',
                    animation:    'vt-expand-down 180ms ease-out',
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONT.body,
                      fontSize:   '12px',
                      color:      T.secondaryText,
                      margin:     0,
                      lineHeight: 1.6,
                      display:    'flex',
                      alignItems: 'flex-start',
                      gap:        '6px',
                    }}
                  >
                    <span aria-hidden="true" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                      <FontAwesomeIcon icon={faMoneyBill} style={{ width: 13, height: 13, color: '#6b7f74' }} />
                    </span>
                    <span>
                      டெலிவரி நேரத்தில் சரியான தொகை தயார் வையுங்கள்.
                      பொருட்கள் உங்கள் கதவில் கொண்டு வரும் போது கொடுக்கலாம்.
                    </span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes vt-expand-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          [aria-label="கட்டண முறை தேர்வு"] { font-size: 14px; }
        }
      `}</style>
    </section>
  );
}

// ─── UPI validation ───────────────────────────────────────────────────────────
function validateUpi(id: string): string {
  if (!id.trim()) return '';
  const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
  if (!upiPattern.test(id.trim())) {
    return 'சரியான UPI ID உள்ளிடுங்கள் (எ.கா: name@paytm)';
  }
  return '';
}

// ─── Icon sub-components ──────────────────────────────────────────────────────

function UpiIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L5 8.5v7L12 21l7-5.5v-7L12 3z"
        fill="rgba(26,58,42,0.12)"
        stroke={T.forestPrimary}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.5l2 2 4-4"
        stroke={T.leaf}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DebitCardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2.5"
        fill="rgba(201,146,42,0.10)"
        stroke={T.gold}
        strokeWidth="1.4"
      />
      <path d="M2 9h20" stroke={T.gold} strokeWidth="1.4" />
      <rect x="4.5" y="13" width="6" height="3" rx="1" fill={T.gold} opacity="0.35" />
      <rect x="15" y="13" width="4" height="1.5" rx="0.75" fill={T.gold} opacity="0.35" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2.5"
        fill="rgba(26,58,42,0.08)"
        stroke={T.forestPrimary}
        strokeWidth="1.4"
      />
      <path d="M2 9h20" stroke={T.forestPrimary} strokeWidth="1.4" />
      <circle cx="17.5" cy="14" r="2.5" fill="rgba(201,146,42,0.20)" stroke={T.gold} strokeWidth="1" />
      <circle cx="14.5" cy="14" r="2.5" fill="rgba(201,146,42,0.20)" stroke={T.gold} strokeWidth="1" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 4l9 6.5"
        stroke={T.secondaryText}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 10.5h18v1.5H3z" fill="rgba(92,74,48,0.15)" />
      <path
        d="M6 12v6M10 12v6M14 12v6M18 12v6"
        stroke={T.secondaryText}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M3 18h18" stroke={T.secondaryText} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CodIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        fill="rgba(61,122,85,0.08)"
        stroke={T.leaf}
        strokeWidth="1.4"
      />
      <circle cx="12" cy="12" r="3.5" stroke={T.leaf} strokeWidth="1.4" />
      <path d="M12 10v4M10 12h4" stroke={T.leaf} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function LockShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1.5L3 4v5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4L9 1.5z"
        fill="rgba(61,122,85,0.10)"
        stroke={T.leaf}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 9L8 10.5l3.5-3.5"
        stroke={T.leaf}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniLockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="8" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M4 5V3.5a2 2 0 0 1 4 0V5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SslIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
