'use client';

/**
 * apps/web/components/auth/OtpVerification.tsx
 *
 * Iyarkai Nala Maruthuvamanai — OTP Verification Component
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • 6 separate OTP digit input boxes
 *   • Auto-focus next box on digit entry
 *   • Backspace clears current box and navigates to previous
 *   • Arrow key navigation (←/→) between boxes
 *   • Paste full 6-digit OTP into any box position
 *   • Auto-submits when all 6 digits are filled
 *   • Resend OTP button with 60-second countdown timer (resets on each resend)
 *   • Loading state  — inputs + buttons disabled, spinner on submit button
 *   • Error state    — red ring on all boxes + dismissable error banner
 *   • Success state  — animated check mark + Tamil confirmation message
 *   • Tamil-first labels and messages throughout
 *   • Mobile responsive (fluid box sizing, 44×56px touch targets)
 *   • Accessible: ARIA group, aria-label per box, aria-live for errors/success
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See OtpVerificationProps below.
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';

// ─── Design tokens (identical to LoginForm / RegisterForm) ─────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const OTP_LENGTH     = 6;
const RESEND_SECONDS = 60;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OtpVerificationProps {
  /**
   * Masked mobile number displayed to the user.
   * e.g. "+91 98765•••10"
   * Pass the raw number — masking should be done by the parent before passing.
   */
  maskedMobile: string;

  /**
   * Called when all 6 digits are entered and the form auto-submits
   * or the user clicks the verify button. Parent owns the API call.
   */
  onVerify: (otp: string) => Promise<void>;

  /**
   * Called when user clicks "மீண்டும் அனுப்பவும்" after the countdown expires.
   * Parent owns the API call. Timer resets automatically after this resolves.
   */
  onResend: () => Promise<void>;

  /** Server-side error message (e.g. "தவறான OTP"). Shown as an error banner. */
  serverError?: string;

  /** Clear serverError when user starts editing again. */
  onClearServerError?: () => void;

  /**
   * Freeze all inputs and buttons (e.g. while parent is navigating after success).
   * Component manages its own submitting/resending flags internally.
   */
  disabled?: boolean;

  /**
   * Triggers the success animation overlay.
   * Parent sets this to true once onVerify resolves without throwing.
   */
  isSuccess?: boolean;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18, light = true }: { size?: number; light?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ animation: 'vt-otp-spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes vt-otp-spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12" cy="12" r="10"
        stroke={light ? 'rgba(255,255,255,0.30)' : 'rgba(26,58,42,0.18)'}
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={light ? '#ffffff' : T.forestPrimary}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Animated success check ───────────────────────────────────────────────────
function SuccessCheck() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
      style={{ animation: 'vt-otp-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      <style>{`
        @keyframes vt-otp-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes vt-otp-ring {
          0%   { stroke-dashoffset: 226; }
          100% { stroke-dashoffset: 0;   }
        }
        @keyframes vt-otp-tick {
          0%   { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0;  }
        }
      `}</style>
      {/* Soft fill */}
      <circle cx="36" cy="36" r="34" fill={T.leaf} opacity="0.10" />
      {/* Animated ring */}
      <circle
        cx="36" cy="36" r="34"
        stroke={T.leaf}
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="226"
        strokeDashoffset="226"
        strokeLinecap="round"
        style={{ animation: 'vt-otp-ring 0.5s ease forwards 0.1s' }}
        transform="rotate(-90 36 36)"
      />
      {/* Animated tick */}
      <path
        d="M20 38 l12 12 20-22"
        stroke={T.leaf}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="60"
        strokeDashoffset="60"
        style={{ animation: 'vt-otp-tick 0.35s ease forwards 0.45s' }}
      />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function OtpVerification({
  maskedMobile,
  onVerify,
  onResend,
  serverError,
  onClearServerError,
  disabled   = false,
  isSuccess  = false,
}: OtpVerificationProps) {
  const uid = useId();

  // ── OTP digit state ──────────────────────────────────────────────────────────
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  // ── Input refs (for imperative focus management) ───────────────────────────
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));

  // ── Countdown timer ──────────────────────────────────────────────────────────
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start timer on mount; clean up on unmount
  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  // ── Async op state ───────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [resending,  setResending]  = useState(false);

  // Everything frozen while: submitting / resending / externally disabled / success shown
  const isLocked = submitting || resending || disabled || isSuccess;

  // ── Focus helper ─────────────────────────────────────────────────────────────
  const focusBox = useCallback((index: number) => {
    const el = inputRefs.current[Math.max(0, Math.min(index, OTP_LENGTH - 1))];
    if (el) { el.focus(); el.select(); }
  }, []);

  // ── Core submit (accepts a snapshot of digits to avoid stale closure) ────────
  const submitOtp = useCallback(async (filled: string[]) => {
    const otp = filled.join('');
    if (otp.length !== OTP_LENGTH) return;
    if (submitting || disabled) return;

    setSubmitting(true);
    try {
      await onVerify(otp);
    } finally {
      setSubmitting(false);
    }
  }, [onVerify, submitting, disabled]);

  // ── onChange ─────────────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (idx: number, e: ChangeEvent<HTMLInputElement>) => {
      if (isLocked) return;

      // Strip non-digits; handle edge case where browser inserts > 1 char
      const raw = e.target.value.replace(/\D/g, '');
      if (!raw) return;

      const digit = raw[raw.length - 1]; // always take the latest digit
      const next  = digits.map((d, i) => (i === idx ? digit : d));
      setDigits(next);
      onClearServerError?.();

      if (idx < OTP_LENGTH - 1) {
        focusBox(idx + 1);
      } else {
        inputRefs.current[idx]?.blur();
        void submitOtp(next);
      }
    },
    [digits, isLocked, focusBox, submitOtp, onClearServerError],
  );

  // ── onKeyDown ────────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (isLocked) return;

      switch (e.key) {
        case 'Backspace': {
          e.preventDefault();
          if (digits[idx]) {
            // Clear current box first
            const next = digits.map((d, i) => (i === idx ? '' : d));
            setDigits(next);
            onClearServerError?.();
          } else if (idx > 0) {
            // Already empty — clear previous and move back
            const next = digits.map((d, i) => (i === idx - 1 ? '' : d));
            setDigits(next);
            focusBox(idx - 1);
            onClearServerError?.();
          }
          break;
        }
        case 'Delete': {
          e.preventDefault();
          const next = digits.map((d, i) => (i === idx ? '' : d));
          setDigits(next);
          onClearServerError?.();
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (idx > 0) focusBox(idx - 1);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (idx < OTP_LENGTH - 1) focusBox(idx + 1);
          break;
        }
        case 'Enter': {
          // Manual submit attempt from keyboard
          void submitOtp(digits);
          break;
        }
      }
    },
    [digits, isLocked, focusBox, submitOtp, onClearServerError],
  );

  // ── onPaste ──────────────────────────────────────────────────────────────────
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (isLocked) return;

      const pasted = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, OTP_LENGTH);

      if (!pasted) return;

      const next = Array(OTP_LENGTH).fill('').map((_, i) => pasted[i] ?? '');
      setDigits(next);
      onClearServerError?.();

      // Focus on last filled box (or last box if full OTP pasted)
      const lastFilled = Math.min(pasted.length, OTP_LENGTH) - 1;
      focusBox(lastFilled);

      if (pasted.length === OTP_LENGTH) {
        void submitOtp(next);
      }
    },
    [isLocked, focusBox, submitOtp, onClearServerError],
  );

  // ── Resend handler ───────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (countdown > 0 || resending || submitting) return;
    setResending(true);
    setDigits(Array(OTP_LENGTH).fill(''));
    onClearServerError?.();
    try {
      await onResend();
      startTimer(); // restart countdown
    } finally {
      setResending(false);
      // Re-focus first box after resend
      focusBox(0);
    }
  }, [countdown, resending, submitting, onClearServerError, onResend, startTimer, focusBox]);

  // ── Per-box style ─────────────────────────────────────────────────────────────
  const boxStyle = (idx: number): React.CSSProperties => {
    const filled    = !!digits[idx];
    const hasError  = !!serverError;

    return {
      width:         '44px',
      height:        '56px',
      boxSizing:     'border-box',
      border:        `2px solid ${
        hasError
          ? T.terracotta
          : filled
            ? T.forestPrimary
            : T.border
      }`,
      borderRadius:  '14px',
      background:    filled ? 'rgba(13,34,24,0.80)' : T.creamBase,
      fontFamily:    FONT.display,
      fontSize:      '1.5rem',
      fontWeight:    700,
      color:         T.darkText,
      textAlign:     'center',
      outline:       'none',
      transition:    'border-color 0.15s, box-shadow 0.15s, background 0.15s',
      boxShadow:     hasError
        ? '0 0 0 3px rgba(249,92,56,0.12)'
        : filled
          ? '0 0 0 3px rgba(61,138,92,0.12)'
          : 'none',
      cursor:        isLocked ? 'not-allowed' : 'text',
      caretColor:    'transparent',
      // Prevent iOS from zooming on focus (input must be ≥ 16px — we're 24px, fine)
      WebkitTextSizeAdjust: '100%',
    };
  };

  const allFilled  = digits.every(Boolean);
  const canSubmit  = allFilled && !isLocked;

  // ── Formatted countdown display: "01:00" → "00:45" ───────────────────────────
  const countdownDisplay =
    `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT.body, color: T.darkText }}>

      {/* ════════════════════════════════════════════════════════════════════
          SUCCESS STATE
      ════════════════════════════════════════════════════════════════════ */}
      {isSuccess && (
        <div
          role="status"
          aria-live="polite"
          aria-label="OTP சரிபார்ப்பு வெற்றிகரமாக முடிந்தது"
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            '20px',
            padding:        '36px 0 24px',
            textAlign:      'center',
          }}
        >
          <SuccessCheck />

          <div>
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '1.25rem',
                fontWeight: 700,
                color:      T.leaf,
                margin:     '0 0 8px',
                letterSpacing: '0.01em',
              }}
            >
              சரிபார்க்கப்பட்டது! ✓
            </p>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '0.9rem',
                color:      T.secondaryText,
                margin:     0,
                lineHeight: 1.6,
              }}
            >
              உள்நுழைகிறோம், கொஞ்சம் காத்திருக்கவும்…
            </p>
          </div>

          {/* Subtle progress bar */}
          <div
            style={{
              width:        '120px',
              height:       '3px',
              borderRadius: '99px',
              background:   T.creamAlt,
              overflow:     'hidden',
            }}
            aria-hidden="true"
          >
            <div
              style={{
                height:     '100%',
                background: T.leaf,
                borderRadius: '99px',
                animation:  'vt-otp-progress 1.2s ease forwards',
              }}
            />
            <style>{`
              @keyframes vt-otp-progress {
                0%   { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MAIN FORM
      ════════════════════════════════════════════════════════════════════ */}
      {!isSuccess && (
        <>
          {/* ── Instruction text ──────────────────────────────────────────── */}
          <p
            style={{
              fontFamily:   FONT.body,
              fontSize:     '0.9rem',
              color:        T.secondaryText,
              marginBottom: '28px',
              textAlign:    'center',
              lineHeight:   1.65,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color:      T.darkText,
                fontFamily: FONT.display,
              }}
            >
              {maskedMobile}
            </span>{' '}
            என்ற எண்ணுக்கு அனுப்பப்பட்ட{' '}
            <span style={{ fontWeight: 600 }}>6 இலக்க குறியீட்டை</span> உள்ளிடவும்.
          </p>

          {/* ── Server error banner ───────────────────────────────────────── */}
          {serverError && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '10px',
                background:   'rgba(139,58,47,0.08)',
                border:       '1px solid rgba(139,58,47,0.25)',
                borderRadius: '12px',
                padding:      '12px 14px',
                marginBottom: '20px',
                animation:    'vt-otp-shake 0.35s ease',
              }}
            >
              <style>{`
                @keyframes vt-otp-shake {
                  0%, 100% { transform: translateX(0); }
                  20%      { transform: translateX(-4px); }
                  40%      { transform: translateX(4px); }
                  60%      { transform: translateX(-3px); }
                  80%      { transform: translateX(3px); }
                }
              `}</style>
              <span aria-hidden="true" style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
              <span
                style={{
                  flex:       1,
                  fontSize:   '0.875rem',
                  color:      T.terracotta,
                  fontFamily: FONT.body,
                  lineHeight: 1.4,
                }}
              >
                {serverError}
              </span>
              {onClearServerError && (
                <button
                  type="button"
                  onClick={onClearServerError}
                  aria-label="பிழை மூடு"
                  style={{
                    background: 'none',
                    border:     'none',
                    cursor:     'pointer',
                    color:      T.terracotta,
                    fontSize:   '1.1rem',
                    padding:    '2px 4px',
                    flexShrink: 0,
                    lineHeight: 1,
                    borderRadius: '4px',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* ── OTP input boxes ───────────────────────────────────────────── */}
          <div
            role="group"
            aria-label="6 இலக்க OTP குறியீடு உள்ளீடு"
            style={{
              display:        'flex',
              gap:            'clamp(6px, 2vw, 12px)',
              justifyContent: 'center',
              marginBottom:   '28px',
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                id={`${uid}-otp-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}  /* 2 allows browser to capture a replacement digit */
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                aria-label={`OTP இலக்கம் ${idx + 1}, ${OTP_LENGTH} இல்`}
                aria-required="true"
                value={digit}
                disabled={isLocked}
                onChange={(e) => handleChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                style={boxStyle(idx)}
              />
            ))}
          </div>

          {/* ── Verify button ─────────────────────────────────────────────── */}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submitOtp(digits)}
            aria-label={submitting ? 'சரிபார்க்கிறோம்' : 'OTP சரிபார்க்கவும்'}
            style={{
              width:          '100%',
              padding:        '15px 24px',
              border:         'none',
              borderRadius:   '14px',
              cursor:         canSubmit ? 'pointer' : 'not-allowed',
              background:     !canSubmit
                ? T.muted
                : `linear-gradient(135deg, ${T.forestPrimary} 0%, #1E472E 60%, ${T.leaf} 100%)`,
              color:          '#FFFFFF',
              fontFamily:     FONT.display,
              fontSize:       '1.05rem',
              fontWeight:     700,
              letterSpacing:  '0.02em',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '10px',
              boxShadow:      canSubmit
                ? '0 4px 16px rgba(26,58,42,0.28)'
                : 'none',
              transition:     'background 0.2s, box-shadow 0.2s, opacity 0.2s',
              opacity:        canSubmit ? 1 : 0.72,
              marginBottom:   '22px',
            }}
          >
            {submitting ? (
              <>
                <Spinner />
                <span>சரிபார்க்கிறோம்…</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">🔐</span>
                <span>சரிபார்க்கவும்</span>
              </>
            )}
          </button>

          {/* ── Resend section ────────────────────────────────────────────── */}
          <div
            style={{
              textAlign:  'center',
              fontFamily: FONT.body,
              fontSize:   '0.875rem',
              color:      T.secondaryText,
              lineHeight: 1.5,
            }}
          >
            {countdown > 0 ? (
              /* Countdown active */
              <p style={{ margin: 0 }}>
                குறியீடு வரவில்லையா?{' '}
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={`${countdown} வினாடிகளில் மீண்டும் அனுப்பலாம்`}
                  style={{
                    fontFamily:  FONT.display,
                    fontWeight:  700,
                    color:       T.forestPrimary,
                    // Tabular numerals so the clock doesn't jiggle
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {countdownDisplay}
                </span>
                {' '}நிமிடத்தில் மீண்டும் அனுப்பலாம்
              </p>
            ) : (
              /* Countdown done — show resend button */
              <p style={{ margin: 0 }}>
                குறியீடு வரவில்லையா?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || submitting}
                  aria-label="OTP மீண்டும் அனுப்பவும்"
                  style={{
                    background:          'none',
                    border:              'none',
                    padding:             0,
                    cursor:              (resending || submitting) ? 'not-allowed' : 'pointer',
                    fontFamily:          FONT.display,
                    fontSize:            '0.875rem',
                    fontWeight:          700,
                    color:               (resending || submitting) ? T.muted : T.leaf,
                    textDecoration:      resending ? 'none' : 'underline',
                    textUnderlineOffset: '2px',
                    display:             'inline-flex',
                    alignItems:          'center',
                    gap:                 '5px',
                    verticalAlign:       'baseline',
                  }}
                >
                  {resending ? (
                    <>
                      <Spinner size={13} light={false} />
                      <span>அனுப்புகிறோம்…</span>
                    </>
                  ) : (
                    'மீண்டும் அனுப்பவும்'
                  )}
                </button>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
