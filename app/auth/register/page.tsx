'use client';

/**
 * apps/web/app/auth/register/page.tsx
 *
 * Vaithiyam — Registration Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Flow ─────────────────────────────────────────────────────────────────────
 *   1. Renders the existing RegisterForm component inside a page shell
 *   2. On form submit → POST /api/auth/register
 *   3. API sends OTP to the provided mobile number
 *   4. On success → router.replace("/auth/verify-otp?mobile=<number>")
 *   5. Server errors (e.g. "மொபைல் ஏற்கனவே பதிவாகியுள்ளது") fed back into form
 *
 * ─── API contract ─────────────────────────────────────────────────────────────
 *   POST /api/auth/register
 *   Body:    { fullName, mobile, email, password }
 *   Success: { message: string }   ← OTP dispatched to mobile
 *   Error:   { message: string }
 *
 *   To swap for a lib function:
 *     import { registerUser } from '../../../lib/auth';
 *
 * ─── Components used ──────────────────────────────────────────────────────────
 *   RegisterForm  →  apps/web/components/auth/RegisterForm.tsx
 */

import { useState, useCallback }  from 'react';
import { useRouter }               from 'next/navigation';
import Link                        from 'next/link';
import { FontAwesomeIcon }         from '@fortawesome/react-fontawesome';
import { faLeaf, faSeedling, faMobileScreen } from '@fortawesome/free-solid-svg-icons';
import RegisterForm, { type RegisterData } from '../../../components/auth/RegisterForm';

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

// ─── API helper ───────────────────────────────────────────────────────────────
async function registerApi(data: RegisterData): Promise<void> {
  const res = await fetch('/api/auth/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      fullName: data.fullName,
      mobile:   data.mobile,
      email:    data.email || undefined,  // omit if empty string
      password: data.password,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'பதிவு தோல்வி. மீண்டும் முயற்சிக்கவும்.');
  }
  // 201 Created — API already sent the OTP; no response body needed
}

// ─── Step indicator (displayed above the card during redirect) ────────────────
function StepDots({ active }: { active: 0 | 1 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '8px',
        marginBottom:   '28px',
      }}
    >
      {(['பதிவு', 'OTP சரிபார்'] as const).map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            '4px',
            }}
          >
            <div
              style={{
                width:        i === active ? '28px' : '24px',
                height:       i === active ? '28px' : '24px',
                borderRadius: '50%',
                background:   i === active
                  ? `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`
                  : i < active
                    ? T.leaf
                    : T.creamAlt,
                border:       i < active
                  ? `1.5px solid ${T.leaf}`
                  : i === active
                    ? 'none'
                    : `1.5px solid ${T.border}`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'all 0.2s',
                flexShrink:     0,
              }}
            >
              {i < active ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6l3.5 3.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span
                  style={{
                    fontFamily: FONT.display,
                    fontSize:   i === active ? '0.78rem' : '0.72rem',
                    fontWeight: 700,
                    color:      i === active ? '#fff' : T.muted,
                    lineHeight: 1,
                  }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              style={{
                fontFamily:  FONT.body,
                fontSize:    '0.68rem',
                fontWeight:  i === active ? 700 : 400,
                color:       i === active ? T.forestPrimary : T.muted,
                whiteSpace:  'nowrap',
                transition:  'color 0.2s',
              }}
            >
              {label}
            </span>
          </div>

          {/* Connector line between steps */}
          {i === 0 && (
            <div
              style={{
                width:        '28px',
                height:       '2px',
                background:   active > 0 ? T.leaf : T.border,
                borderRadius: '2px',
                marginBottom: '18px',
                flexShrink:   0,
                transition:   'background 0.3s',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [serverError,  setServerError]  = useState('');
  const [redirecting,  setRedirecting]  = useState(false);

  const handleSubmit = useCallback(
    async (data: RegisterData) => {
      setServerError('');
      try {
        await registerApi(data);
        setRedirecting(true);
        // Pass mobile so verify-otp page can display it masked
        router.replace(`/auth/verify-otp?mobile=${encodeURIComponent(data.mobile)}`);
      } catch (err) {
        setRedirecting(false);
        setServerError(
          err instanceof Error
            ? err.message
            : 'பதிவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
        );
      }
    },
    [router],
  );

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
          background: `linear-gradient(135deg, ${T.forestPrimary} 0%, #1E472E 100%)`,
          boxShadow:  '0 2px 16px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            maxWidth:   '540px',
            margin:     '0 auto',
            padding:    '14px 20px',
            display:    'flex',
            alignItems: 'center',
            gap:        '12px',
          }}
        >
          {/* Brand mark */}
          <div
            aria-hidden="true"
            style={{
              width:          '38px',
              height:         '38px',
              borderRadius:   '50%',
              background:     'rgba(240,201,110,0.10)',
              border:         '1px solid rgba(240,201,110,0.20)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
            }}
          >
            <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faLeaf} style={{ width: 18, height: 18, color: '#226038' }} />
            </span>
          </div>

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
              ஆரோக்கியமான வாழ்வு
            </span>
          </div>

          {/* Skip-to-login */}
          <Link
            href="/auth/login"
            style={{
              fontFamily:     FONT.display,
              fontSize:       '0.78rem',
              fontWeight:     600,
              color:          T.goldPale,
              textDecoration: 'none',
              padding:        '6px 12px',
              borderRadius:   '20px',
              border:         '1px solid rgba(240,201,110,0.28)',
              whiteSpace:     'nowrap',
              flexShrink:     0,
            }}
          >
            உள்நுழைவு
          </Link>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: '540px',
          margin:   '0 auto',
          padding:  'clamp(28px, 5vw, 48px) 20px 0',
        }}
      >
        {/* Hero heading */}
        <div
          style={{
            textAlign:    'center',
            marginBottom: '28px',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display:      'block',
              fontSize:     '44px',
              lineHeight:   1,
              marginBottom: '14px',
            }}
          >
            <FontAwesomeIcon icon={faSeedling} style={{ width: 40, height: 40, color: 'rgba(26,58,42,0.72)', marginBottom: 14 }} />
          </span>
          <h1
            style={{
              fontFamily:   FONT.display,
              fontSize:     'clamp(1.4rem, 4.5vw, 1.8rem)',
              fontWeight:   700,
              color:        T.darkText,
              margin:       '0 0 8px',
              lineHeight:   1.2,
              letterSpacing:'0.01em',
            }}
          >
            புதிய கணக்கு உருவாக்கவும்
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
            இலவசமாக பதிவு செய்து ஆரோக்கியமான வாழ்வை தொடங்குங்கள்
          </p>
        </div>

        {/* 2-step progress indicator */}
        <StepDots active={redirecting ? 1 : 0} />

        {/* Form card */}
        <div
          style={{
            background:   '#FFFFFF',
            borderRadius: '24px',
            padding:      'clamp(24px, 5vw, 40px)',
            boxShadow:    '0 4px 32px rgba(26,58,42,0.08), 0 1px 4px rgba(26,58,42,0.04)',
            marginBottom: '24px',
            // Gentle fade-in
            animation:    'vt-reg-fade 0.35s ease forwards',
          }}
        >
          <style>{`@keyframes vt-reg-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>

          <RegisterForm
            onSubmit={handleSubmit}
            serverError={serverError}
            onClearServerError={() => setServerError('')}
            loginHref="/auth/login"
            termsHref="/terms"
            privacyHref="/privacy"
            disabled={redirecting}
          />
        </div>

        {/* OTP dispatch notice */}
        <div
          style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          '10px',
            background:   'rgba(61,122,85,0.06)',
            border:       '1px solid rgba(61,122,85,0.18)',
            borderRadius: '14px',
            padding:      '14px 16px',
          }}
        >
          <span aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px', display: 'inline-flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faMobileScreen} style={{ width: 15, height: 15, color: '#6b7f74' }} />
          </span>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '0.8rem',
              color:      T.secondaryText,
              margin:     0,
              lineHeight: 1.6,
            }}
          >
            பதிவு முடிந்தவுடன் உங்கள் மொபைல் எண்ணுக்கு சரிபார்ப்பு குறியீடு (OTP) அனுப்பப்படும்.
          </p>
        </div>
      </main>
    </div>
  );
}
