'use client';

/**
 * apps/web/app/auth/verify-otp/page.tsx
 *
 * Vaithiyam — OTP Verification Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Route ────────────────────────────────────────────────────────────────────
 *   /auth/verify-otp?mobile=<10-digit>&next=<redirect-path>
 *
 * ─── Flow ─────────────────────────────────────────────────────────────────────
 *   1. Reads ?mobile= from search params and masks it for display
 *   2. Guards missing mobile → renders <NoMobileScreen /> with link back to register
 *   3. Renders OtpVerification component
 *   4. onVerify  → POST /api/auth/verify-otp  → stores JWT → sets isSuccess → redirect
 *   5. onResend  → POST /api/auth/resend-otp  → timer resets inside OtpVerification
 *   6. Server errors (wrong OTP, expired OTP) fed back into OtpVerification
 *   7. On success: 1.2 s animation pause then router.replace(?next or "/")
 *
 * ─── API contracts ────────────────────────────────────────────────────────────
 *   POST /api/auth/verify-otp
 *     Body:    { mobile: string, otp: string }
 *     Success: { token: string, user: { id: string, name: string } }
 *     Error:   { message: string }
 *
 *   POST /api/auth/resend-otp
 *     Body:    { mobile: string }
 *     Success: { message: string }
 *     Error:   { message: string }
 *
 *   Swap for lib functions:
 *     import { verifyOtp, resendOtp } from '../../../lib/auth';
 *
 * ─── Components used ──────────────────────────────────────────────────────────
 *   OtpVerification  →  apps/web/components/auth/OtpVerification.tsx
 */

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams }                  from 'next/navigation';
import Link                                            from 'next/link';
import { FontAwesomeIcon }                             from '@fortawesome/react-fontawesome';
import { faSeedling, faMobileScreen }                  from '@fortawesome/free-solid-svg-icons';
import OtpVerification                                 from '../../../components/auth/OtpVerification';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  forestPrimary: 'var(--vt-forest-700)',
  forestDark:    'var(--vt-forest-900)',
  creamBase:     'var(--vt-void)',
  creamAlt:      'rgba(13,34,24,0.35)',
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

// ─── Masking util ─────────────────────────────────────────────────────────────
// "9876543210" → "+91 98765•••10"
function maskMobile(raw: string): string {
  const clean = raw.replace(/\D/g, '');
  if (clean.length !== 10) return `+91 ${clean}`;
  return `+91 ${clean.slice(0, 5)}•••${clean.slice(-2)}`;
}

// ─── Auth response type ───────────────────────────────────────────────────────
interface VerifyResponse {
  token: string;
  user:  { id: string; name: string };
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function verifyOtpApi(mobile: string, otp: string): Promise<VerifyResponse> {
  const res = await fetch('/api/auth/verify-otp', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ mobile, otp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'தவறான OTP. மீண்டும் முயற்சிக்கவும்.');
  }
  return res.json() as Promise<VerifyResponse>;
}

async function resendOtpApi(mobile: string): Promise<void> {
  const res = await fetch('/api/auth/resend-otp', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ mobile }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'OTP அனுப்புவதில் பிழை. மீண்டும் முயற்சிக்கவும்.');
  }
}

// ─── No-mobile guard screen ───────────────────────────────────────────────────
function NoMobileScreen() {
  return (
    <div
      role="alert"
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '16px',
        padding:        '48px 8px',
        textAlign:      'center',
      }}
    >
      <span
        aria-hidden="true"
        style={{ fontSize: '52px', lineHeight: 1 }}
      >
        😕
      </span>

      <h2
        style={{
          fontFamily: FONT.display,
          fontSize:   '1.25rem',
          fontWeight: 700,
          color:      T.terracotta,
          margin:     0,
        }}
      >
        மொபைல் எண் கிடைக்கவில்லை
      </h2>

      <p
        style={{
          fontFamily: FONT.body,
          fontSize:   '0.9rem',
          color:      T.secondaryText,
          margin:     0,
          lineHeight: 1.65,
          maxWidth:   '280px',
        }}
      >
        இந்தப் பக்கத்தை நேரடியாக திறந்தீர்கள். பதிவு பக்கத்திலிருந்து மீண்டும் தொடங்கவும்.
      </p>

      <Link
        href="/auth/register"
        style={{
          marginTop:      '8px',
          display:        'inline-flex',
          alignItems:     'center',
          gap:            '8px',
          height:         '50px',
          padding:        '0 32px',
          borderRadius:   '14px',
          background:     `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
          color:          '#FFFFFF',
          fontFamily:     FONT.display,
          fontSize:       '1rem',
          fontWeight:     700,
          textDecoration: 'none',
          boxShadow:      '0 4px 16px rgba(26,58,42,0.22)',
          letterSpacing:  '0.01em',
        }}
      >
        <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}><FontAwesomeIcon icon={faSeedling} style={{ width: 14, height: 14 }} /></span>
        பதிவு செய்யுங்கள்
      </Link>

      <Link
        href="/auth/login"
        style={{
          fontFamily:     FONT.display,
          fontSize:       '0.88rem',
          fontWeight:     600,
          color:          T.leaf,
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        ஏற்கனவே கணக்கு இருந்தால் உள்நுழைவு
      </Link>
    </div>
  );
}

// ─── OTP input skeleton ───────────────────────────────────────────────────────
function OtpSkeleton() {
  return (
    <div aria-hidden="true">
      <style>{`
        @keyframes vt-otp-sk {
          0%, 100% { opacity: 1;    }
          50%       { opacity: 0.5; }
        }
      `}</style>

      {/* Instruction text placeholder */}
      <div
        style={{
          height:       20,
          borderRadius: '6px',
          background:   T.creamAlt,
          marginBottom: '28px',
          animation:    'vt-otp-sk 1.4s ease-in-out infinite',
        }}
      />

      {/* 6 digit box skeletons */}
      <div
        style={{
          display:        'flex',
          gap:            '10px',
          justifyContent: 'center',
          marginBottom:   '28px',
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              width:          '44px',
              height:         '56px',
              borderRadius:   '14px',
              background:     T.creamAlt,
              animation:      'vt-otp-sk 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.07}s`,
            }}
          />
        ))}
      </div>

      {/* Button placeholder */}
      <div
        style={{
          height:       52,
          borderRadius: '14px',
          background:   T.creamAlt,
          animation:    'vt-otp-sk 1.4s ease-in-out infinite',
          animationDelay: '0.42s',
        }}
      />
    </div>
  );
}

// ─── Inner page (requires Suspense — reads useSearchParams) ───────────────────
function VerifyOtpInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const mobile = searchParams.get('mobile') ?? '';
  const next   = searchParams.get('next')   ?? '/';

  const [serverError, setServerError] = useState('');
  const [isSuccess,   setIsSuccess]   = useState(false);

  // Auto-redirect after success animation completes (1.2 s)
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => router.replace(next), 1200);
    return () => clearTimeout(timer);
  }, [isSuccess, router, next]);

  // ── Verify handler ────────────────────────────────────────────────────────
  const handleVerify = useCallback(
    async (otp: string) => {
      setServerError('');
      try {
        const { token, user } = await verifyOtpApi(mobile, otp);

        // Persist auth — use sessionStorage as default;
        // if the user chose "remember me" on the login page, that preference
        // was already applied there. Here we only persist the session token.
        sessionStorage.setItem('vt_token', token);
        sessionStorage.setItem('vt_user',  JSON.stringify(user));

        setIsSuccess(true);
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : 'தவறான OTP. மீண்டும் முயற்சிக்கவும்.',
        );
      }
    },
    [mobile],
  );

  // ── Resend handler ────────────────────────────────────────────────────────
  const handleResend = useCallback(
    async () => {
      setServerError('');
      try {
        await resendOtpApi(mobile);
        // OtpVerification resets its own countdown after onResend resolves
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : 'OTP அனுப்புவதில் பிழை. மீண்டும் முயற்சிக்கவும்.',
        );
      }
    },
    [mobile],
  );

  if (!mobile) return <NoMobileScreen />;

  return (
    <OtpVerification
      maskedMobile={maskMobile(mobile)}
      onVerify={handleVerify}
      onResend={handleResend}
      serverError={serverError}
      onClearServerError={() => setServerError('')}
      isSuccess={isSuccess}
    />
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function VerifyOtpPage() {
  return (
    <div
      style={{
        minHeight:     '100dvh',
        background:    T.creamBase,
        paddingBottom: '56px',
      }}
    >
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header
        style={{
          position:   'sticky',
          top:        0,
          zIndex:     200,
          background: 'rgba(3, 12, 7, 0.75)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(61,138,92,0.14)',
          boxShadow:  '0 2px 16px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            maxWidth:   '480px',
            margin:     '0 auto',
            padding:    '14px 20px',
            display:    'flex',
            alignItems: 'center',
            gap:        '12px',
          }}
        >
          {/* Back button */}
          <Link
            href="/auth/register"
            aria-label="பதிவு பக்கத்திற்கு திரும்பவும்"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          '36px',
              height:         '36px',
              borderRadius:   '50%',
              background:     'rgba(240,201,110,0.10)',
              border:         '1px solid rgba(240,201,110,0.20)',
              flexShrink:     0,
              textDecoration: 'none',
              color:          T.goldPale,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Link
              href="/"
              style={{
                display:        'block',
                fontFamily:     FONT.display,
                fontSize:       '1.15rem',
                fontWeight:     700,
                color:          T.goldPale,
                letterSpacing:  '0.02em',
                textDecoration: 'none',
                lineHeight:     1.2,
              }}
            >
              வைத்தியம்
            </Link>
            <span
              style={{
                display:       'block',
                fontFamily:    FONT.body,
                fontSize:      '0.7rem',
                color:         'rgba(240,201,110,0.60)',
                letterSpacing: '0.01em',
                marginTop:     '1px',
              }}
            >
              OTP சரிபார்ப்பு
            </span>
          </div>

          {/* Step chip */}
          <div
            aria-label="படி 2 இல் 2"
            style={{
              fontFamily:   FONT.display,
              fontSize:     '0.72rem',
              fontWeight:   700,
              color:        T.goldPale,
              padding:      '4px 10px',
              borderRadius: '20px',
              border:       '1px solid rgba(240,201,110,0.28)',
              whiteSpace:   'nowrap',
              flexShrink:   0,
            }}
          >
            படி 2/2
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: '480px',
          margin:   '0 auto',
          padding:  'clamp(28px, 5vw, 48px) 20px 0',
        }}
      >
        {/* Hero */}
        <div
          style={{
            textAlign:    'center',
            marginBottom: '32px',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display:      'block',
              fontSize:     '52px',
              lineHeight:   1,
              marginBottom: '14px',
              animation:    'vt-otp-float 3s ease-in-out infinite',
            }}
          >
            <FontAwesomeIcon icon={faMobileScreen} style={{ width: 36, height: 36, color: T.gold }} />
          </span>
          <style>{`
            @keyframes vt-otp-float {
              0%, 100% { transform: translateY(0);    }
              50%       { transform: translateY(-6px); }
            }
          `}</style>

          <h1
            style={{
              fontFamily:   FONT.display,
              fontSize:     'clamp(1.35rem, 4.5vw, 1.75rem)',
              fontWeight:   700,
              color:        T.darkText,
              margin:       '0 0 8px',
              lineHeight:   1.2,
              letterSpacing:'0.01em',
            }}
          >
            குறியீட்டை சரிபார்க்கவும்
          </h1>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '0.92rem',
              color:      T.secondaryText,
              margin:     0,
              lineHeight: 1.6,
            }}
          >
            உங்கள் மொபைல் எண்ணுக்கு OTP அனுப்பப்பட்டது
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background:   'var(--vt-card)',
            border:       '1px solid var(--vt-border)',
            borderRadius: '24px',
            padding:      'clamp(24px, 5vw, 40px)',
            boxShadow:    'var(--vt-shadow-sm)',
            marginBottom: '24px',
            animation:    'vt-otp-slide-in 0.32s ease forwards',
          }}
        >
          <style>{`
            @keyframes vt-otp-slide-in {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: none; }
            }
          `}</style>

          <Suspense fallback={<OtpSkeleton />}>
            <VerifyOtpInner />
          </Suspense>
        </div>

        {/* Wrong number? */}
        <p
          style={{
            textAlign:  'center',
            fontFamily: FONT.body,
            fontSize:   '0.82rem',
            color:      T.muted,
            margin:     0,
            lineHeight: 1.6,
          }}
        >
          தவறான எண் அனுப்பினீர்களா?{' '}
          <Link
            href="/auth/register"
            style={{
              color:               T.leaf,
              fontWeight:          700,
              textDecoration:      'underline',
              textUnderlineOffset: '2px',
            }}
          >
            திரும்பவும்
          </Link>
        </p>
      </main>
    </div>
  );
}
