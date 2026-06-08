'use client';

/**
 * apps/web/components/checkout/OrderNotes.tsx
 *
 * Delivery instructions text area — Zone E.3
 *
 * Spec: vaithiyam-cart-checkout-spec.md § Zone E.3 (Order Notes)
 *
 * Features:
 *  - Controlled textarea for special delivery instructions
 *  - Live character counter (0 / 200) with colour shift as limit approaches
 *  - Hard cap at MAX_CHARS (200) — graceful clamp, no crash on paste overflow
 *  - Validation: no HTML, no phone numbers (basic Rx-style gate)
 *  - Tamil helper text with common instruction suggestions
 *  - Quick-insert suggestion chips (one tap to append)
 *  - Focused border with forest-primary ring
 *  - Error message with shake animation
 *  - Accessible: aria-describedby on textarea, role="status" on counter
 *  - Mobile responsive
 */

import { useState, useCallback, useId }  from 'react';
import { FontAwesomeIcon }               from '@fortawesome/react-fontawesome';
import {
  faDoorOpen, faBellSlash, faSun, faMoon,
  faHouseChimney, faHandshake,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition }           from '@fortawesome/fontawesome-svg-core';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  forestPrimary: '#1A3A2A',
  creamBase:     '#F5EFE0',
  creamAlt:      '#EDE3CE',
  gold:          '#C9922A',
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
} as const;

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CHARS   = 200;
const WARN_CHARS  = 160; // counter turns orange above this
const DANGER_CHARS= 185; // counter turns red above this

// ─── Quick-insert suggestion chips ───────────────────────────────────────────
const SUGGESTIONS: { ta: string; icon: IconDefinition }[] = [
  { ta: 'வாசலில் விடவும்',         icon: faDoorOpen    },
  { ta: 'மணி அடிக்காதீர்கள்',      icon: faBellSlash   },
  { ta: 'காலை வேளையில் கொடுக்கவும்', icon: faSun         },
  { ta: 'மாலையில் கொடுக்கவும்',    icon: faMoon        },
  { ta: 'அண்டை வீட்டில் கொடுக்கலாம்', icon: faHouseChimney },
  { ta: 'நேரில் வாங்குவேன்',        icon: faHandshake   },
];

// ─── Validation ───────────────────────────────────────────────────────────────
function validateNotes(value: string): string {
  if (!value.trim()) return '';

  // Reject HTML-like content
  if (/<[^>]*>/.test(value)) {
    return 'சிறப்பு குறியீடுகள் (HTML) அனுமதிக்கப்படாது.';
  }

  // Reject phone numbers embedded in notes (security / privacy)
  if (/[6-9]\d{9}/.test(value.replace(/\s/g, ''))) {
    return 'தொலைபேசி எண்களை இங்கே சேர்க்காதீர்கள். தனி தொடர்பு கட்டத்தில் சேர்க்கலாம்.';
  }

  if (value.trim().length < 3) {
    return 'குறைந்தது 3 எழுத்துகள் தேவை.';
  }

  return '';
}

// ─── Counter colour ───────────────────────────────────────────────────────────
function counterColor(len: number): string {
  if (len >= DANGER_CHARS) return T.terracotta;
  if (len >= WARN_CHARS)   return T.saffron;
  return T.muted;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface OrderNotesProps {
  value:     string;
  onChange:  (v: string) => void;
  disabled?: boolean;
  /** Show initial suggestions in collapsed state; default true */
  showSuggestions?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderNotes({
  value,
  onChange,
  disabled = false,
  showSuggestions = true,
}: OrderNotesProps) {
  const [focused,      setFocused]      = useState(false);
  const [touched,      setTouched]      = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const textareaId = useId();
  const errorId    = useId();
  const counterId  = useId();

  const errorMsg = touched ? validateNotes(value) : '';
  const charLen  = value.length;
  const atLimit  = charLen >= MAX_CHARS;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (raw: string) => {
      // Clamp at MAX_CHARS — graceful paste overflow guard
      const clamped = raw.slice(0, MAX_CHARS);
      onChange(clamped);

      // If at limit, briefly shake the textarea
      if (raw.length > MAX_CHARS && !shakeTrigger) {
        setShakeTrigger(true);
        setTimeout(() => setShakeTrigger(false), 380);
      }

      // Re-validate on change once touched
      if (touched) {
        // error recomputes from `value` prop on next render — no setState needed
      }
    },
    [onChange, touched, shakeTrigger],
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    setTouched(true);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (disabled) return;
      const sep      = value.trim().length > 0 ? ', ' : '';
      const appended = (value + sep + suggestion).slice(0, MAX_CHARS);
      onChange(appended);
    },
    [value, onChange, disabled],
  );

  // ── Border logic ──────────────────────────────────────────────────────────
  const borderColor = errorMsg
    ? 'rgba(139,58,47,0.80)'
    : focused
    ? 'rgba(26,58,42,0.55)'
    : value.trim()
    ? 'rgba(26,58,42,0.25)'
    : T.border;

  const boxShadow = focused
    ? errorMsg
      ? '0 0 0 3px rgba(139,58,47,0.10)'
      : '0 0 0 3px rgba(26,58,42,0.08)'
    : 'none';

  return (
    <section
      aria-label="டெலிவரி குறிப்புகள்"
      style={{
        background:   '#FFFFFF',
        border:       `1px solid ${T.border}`,
        borderRadius: '20px',
        overflow:     'hidden',
        boxShadow:    '0 2px 10px rgba(26,58,42,0.06)',
      }}
    >
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div
          style={{
            display:     'flex',
            alignItems:  'flex-start',
            gap:         '10px',
            marginBottom:'14px',
          }}
        >
          <NoteIcon />
          <div>
            <h3
              style={{
                fontFamily: FONT.display,
                fontSize:   '16px',
                fontWeight: 700,
                color:      T.darkText,
                margin:     0,
                lineHeight: 1.3,
              }}
            >
              டெலிவரி குறிப்புகள்
            </h3>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '12px',
                color:      T.muted,
                margin:     '3px 0 0',
                lineHeight: 1.5,
              }}
            >
              விரும்பினால் சேர்க்கலாம் — எங்கள் டெலிவரி குழு பார்ப்பார்கள்
            </p>
          </div>
        </div>

        {/* Textarea */}
        <div
          style={{
            position:  'relative',
            animation: shakeTrigger ? 'vt-notes-shake 320ms ease' : 'none',
          }}
        >
          <textarea
            id={textareaId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label="டெலிவரி குறிப்புகள்"
            aria-describedby={`${counterId}${errorMsg ? ` ${errorId}` : ''}`}
            aria-invalid={!!errorMsg}
            placeholder="உதாரணம்: வாசலில் விடவும், மாலை 5 மணிக்கு பிறகு கொடுங்கள்..."
            rows={4}
            style={{
              width:        '100%',
              padding:      '12px 14px',
              fontFamily:   FONT.body,
              fontSize:     '14px',
              lineHeight:   1.65,
              color:        T.darkText,
              background:   disabled ? T.creamBase : '#FFFFFF',
              border:       `1.5px solid ${borderColor}`,
              borderRadius: '10px',
              outline:      'none',
              resize:       'vertical',
              minHeight:    '96px',
              maxHeight:    '200px',
              transition:   'border-color 150ms ease, box-shadow 150ms ease',
              boxSizing:    'border-box',
              boxShadow,
              cursor:       disabled ? 'not-allowed' : 'text',
              opacity:      disabled ? 0.65 : 1,
            }}
          />

          {/* Character counter */}
          <div
            id={counterId}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${charLen} / ${MAX_CHARS} எழுத்துகள்`}
            style={{
              position:   'absolute',
              bottom:     '10px',
              right:      '12px',
              fontFamily: FONT.body,
              fontSize:   '11px',
              fontWeight: atLimit ? 700 : 500,
              color:      counterColor(charLen),
              lineHeight: 1,
              transition: 'color 200ms ease',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {charLen} / {MAX_CHARS}
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <p
            id={errorId}
            role="alert"
            style={{
              fontFamily: FONT.body,
              fontSize:   '12px',
              color:      T.terracotta,
              margin:     '7px 0 0',
              display:    'flex',
              alignItems: 'flex-start',
              gap:        '5px',
              lineHeight: 1.5,
              animation:  'vt-notes-error-in 180ms ease-out',
            }}
          >
            <span aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>⚠</span>
            {errorMsg}
          </p>
        )}

        {/* At-limit notice */}
        {atLimit && !errorMsg && (
          <p
            role="status"
            style={{
              fontFamily: FONT.body,
              fontSize:   '11px',
              color:      T.terracotta,
              margin:     '6px 0 0',
              fontWeight: 600,
            }}
          >
            அதிகபட்ச எழுத்து வரம்பை அடைந்தீர்கள் ({MAX_CHARS}).
          </p>
        )}

        {/* Quick-insert suggestions */}
        {showSuggestions && (
          <div style={{ marginTop: '14px' }}>
            <p
              style={{
                fontFamily:    FONT.body,
                fontSize:      '11px',
                fontWeight:    600,
                color:         T.muted,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin:        '0 0 8px',
              }}
            >
              விரைவான குறிப்புகள்
            </p>
            <div
              style={{
                display:  'flex',
                flexWrap: 'wrap',
                gap:      '7px',
              }}
            >
              {SUGGESTIONS.map((s) => {
                const wouldOverflow =
                  (value.trim().length > 0 ? value.length + 2 : value.length) +
                  s.ta.length > MAX_CHARS;

                return (
                  <button
                    key={s.ta}
                    type="button"
                    onClick={() => handleSuggestionClick(s.ta)}
                    disabled={disabled || wouldOverflow}
                    aria-label={`"${s.ta}" சேர்க்கவும்`}
                    style={{
                      display:      'inline-flex',
                      alignItems:   'center',
                      gap:          '5px',
                      padding:      '6px 12px',
                      borderRadius: '100px',
                      border:       `1px solid ${wouldOverflow || disabled ? T.border : 'rgba(201,146,42,0.30)'}`,
                      background:   wouldOverflow || disabled ? T.creamAlt : T.creamBase,
                      fontFamily:   FONT.body,
                      fontSize:     '12px',
                      fontWeight:   500,
                      color:        wouldOverflow || disabled ? T.muted : T.secondaryText,
                      cursor:       wouldOverflow || disabled ? 'not-allowed' : 'pointer',
                      opacity:      wouldOverflow || disabled ? 0.55 : 1,
                      transition:   'all 130ms ease',
                      lineHeight:   1.4,
                      whiteSpace:   'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!wouldOverflow && !disabled) {
                        (e.currentTarget as HTMLElement).style.borderColor = T.gold;
                        (e.currentTarget as HTMLElement).style.color = T.darkText;
                        (e.currentTarget as HTMLElement).style.background = 'rgba(201,146,42,0.07)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!wouldOverflow && !disabled) {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,146,42,0.30)';
                        (e.currentTarget as HTMLElement).style.color = T.secondaryText;
                        (e.currentTarget as HTMLElement).style.background = T.creamBase;
                      }
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
                      <FontAwesomeIcon icon={s.icon} style={{ width: 12, height: 12 }} />
                    </span>
                    {s.ta}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Helper text */}
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '11px',
            color:      T.muted,
            margin:     '12px 0 0',
            lineHeight: 1.6,
            display:    'flex',
            alignItems: 'flex-start',
            gap:        '5px',
          }}
        >
          <InfoIcon />
          இந்த குறிப்புகள் டெலிவரி பங்காளருக்கு மட்டுமே காட்டப்படும்.
          மருந்து தொடர்பான கேள்விகளுக்கு வாடிக்கையாளர் சேவையை தொடர்பு கொள்ளுங்கள்.
        </p>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes vt-notes-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-4px); }
          40%      { transform: translateX(4px); }
          60%      { transform: translateX(-2px); }
          80%      { transform: translateX(2px); }
        }
        @keyframes vt-notes-error-in {
          from { opacity: 0; transform: translateY(-3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        textarea:focus {
          outline: none;
        }
      `}</style>
    </section>
  );
}

// ─── Icon sub-components ──────────────────────────────────────────────────────

function NoteIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M5 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        fill="rgba(201,146,42,0.08)"
        stroke={T.gold}
        strokeWidth="1.4"
      />
      <path
        d="M7 7h6M7 10h6M7 13h3"
        stroke={T.gold}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: '1px' }}
    >
      <circle cx="7" cy="7" r="5.5" stroke={T.muted} strokeWidth="1.3" />
      <path
        d="M7 6.5v4"
        stroke={T.muted}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="7" cy="4.5" r="0.75" fill={T.muted} />
    </svg>
  );
}
