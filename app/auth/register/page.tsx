'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faMobileScreen } from '@fortawesome/free-solid-svg-icons';
import RegisterForm, { type RegisterData } from '../../../components/auth/RegisterForm';

// ─── Design tokens ─────────────────────────────────────────────────
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
} as const;

// ─── API helper ─────────────────────────────────────────────────────
async function registerApi(data: RegisterData): Promise<void> {
  const res = await fetch('/api/auth/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      fullName: data.fullName,
      mobile:   data.mobile,
      email:    data.email || undefined,
      password: data.password,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'பதிவு தோல்வி. மீண்டும் முயற்சிக்கவும்.');
  }
}

// ─── Step Progress Bar (matching screenshot exactly) ────────────────
function StepBar({ active }: { active: 0 | 1 }) {
  const steps = ['பதிவு', 'OTP சரிபார்'] as const;
  return (
    <div
      aria-label="Registration progress"
      style={{
        display:        'flex',
        alignItems:     'center',
        marginBottom:   '32px',
        gap:            0,
      }}
    >
      {steps.map((label, i) => (
        <div
          key={i}
          style={{
            display:    'flex',
            alignItems: 'center',
            flex:       i < steps.length - 1 ? 1 : 'none',
          }}
        >
          {/* Step node + label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width:          i === active ? 30 : 26,
                height:         i === active ? 30 : 26,
                borderRadius:   '50%',
                background:     i === active
                  ? `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`
                  : i < active
                    ? T.leaf
                    : T.creamAlt,
                border:         i === active ? 'none'
                  : i < active  ? `2px solid ${T.leaf}`
                  : `2px solid ${T.border}`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'all 0.25s',
                flexShrink:     0,
                boxShadow:      i === active ? '0 4px 12px rgba(26,58,42,0.28)' : 'none',
              }}
            >
              {i < active ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6l3.5 3.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span style={{
                  fontFamily: FONT.display, fontSize: i === active ? '0.80rem' : '0.74rem',
                  fontWeight: 700, color: i === active ? '#fff' : T.muted, lineHeight: 1,
                }}>
                  {i + 1}
                </span>
              )}
            </div>
            <span style={{
              fontFamily:  FONT.body, fontSize: '0.72rem',
              fontWeight:  i === active ? 700 : 400,
              color:       i === active ? T.forestPrimary : T.muted,
              whiteSpace:  'nowrap', transition: 'color 0.2s',
            }}>
              {label}
            </span>
          </div>

          {/* Connector bar (between steps) */}
          {i < steps.length - 1 && (
            <div style={{
              flex:         1,
              height:       4,
              marginBottom: 20,
              marginLeft:   8,
              marginRight:  8,
              borderRadius: 4,
              background:   active > 0
                ? T.leaf
                : `linear-gradient(90deg, ${T.leaf} 0%, ${T.gold} 50%, ${T.border} 100%)`,
              transition:   'background 0.4s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = useCallback(async (data: RegisterData) => {
    setServerError('');
    try {
      await registerApi(data);
      setRedirecting(true);
      router.replace(`/auth/verify-otp?mobile=${encodeURIComponent(data.mobile)}`);
    } catch (err) {
      setRedirecting(false);
      setServerError(
        err instanceof Error
          ? err.message
          : 'பதிவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
      );
    }
  }, [router]);

  return (
    <div style={{ minHeight: '100dvh', background: T.creamBase, paddingBottom: '60px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Mukta+Malar:wght@400;600;700&family=Hind+Madurai:wght@400;500;600&display=swap');
      `}</style>

      {/* ── Sticky header ─────────────────────────────────────── */}
      <header
        style={{
          position:   'sticky', top: 0, zIndex: 200,
          background: `linear-gradient(135deg, ${T.forestPrimary} 0%, #1E472E 100%)`,
          boxShadow:  '0 2px 16px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            maxWidth:   '600px', margin: '0 auto',
            padding:    '12px 20px',
            display:    'flex', alignItems: 'center', gap: '14px',
          }}
        >
          {/* Brand mark */}
          <div
            aria-hidden="true"
            style={{
              width: 40, height: 40, borderRadius: '12px',
              background: 'rgba(240,201,110,0.12)',
              border: '1px solid rgba(240,201,110,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <FontAwesomeIcon icon={faLeaf} style={{ width: 20, height: 20, color: '#3D8A5C' }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <a
              href="/"
              style={{
                display: 'block', fontFamily: FONT.display,
                fontSize: '1.25rem', fontWeight: 700, color: T.goldPale,
                letterSpacing: '0.02em', textDecoration: 'none', lineHeight: 1.2,
              }}
            >
              வைத்தியம்
            </a>
            <span
              style={{
                display: 'block', fontFamily: FONT.body,
                fontSize: '0.65rem', color: 'rgba(240,201,110,0.55)',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontWeight: 500, marginTop: '2px',
              }}
            >
              Siddha · Ayurveda · Natural
            </span>
          </div>

          {/* Login link */}
          <a
            href="/auth/login"
            style={{
              fontFamily: FONT.display, fontSize: '0.82rem', fontWeight: 600,
              color: T.goldPale, textDecoration: 'none',
              padding: '7px 16px', borderRadius: '22px',
              border: '1.5px solid rgba(240,201,110,0.32)',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            உள்நுழைவு
          </a>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: '580px', margin: '0 auto',
          padding: 'clamp(32px, 5vw, 52px) 20px 0',
        }}
      >
        {/* Hero heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: FONT.display,
              fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
              fontWeight: 700, color: T.darkText,
              margin: '0 0 10px', lineHeight: 1.2, letterSpacing: '0.01em',
            }}
          >
            புதிய கணக்கு உருவாக்குதல்
          </h1>
          <p
            style={{
              fontFamily: FONT.body, fontSize: '0.94rem',
              color: T.secondaryText, margin: 0, lineHeight: 1.6,
            }}
          >
            இலவசமாக பதிவு செய்து ஆரோக்கியமான வாழ்வை தொடங்குங்கள்
          </p>
        </div>

        {/* Step progress bar */}
        <StepBar active={redirecting ? 1 : 0} />

        {/* Form card */}
        <div
          style={{
            background: '#FFFFFF', borderRadius: '20px',
            padding: 'clamp(24px, 5vw, 40px)',
            boxShadow: '0 4px 32px rgba(26,58,42,0.09), 0 1px 4px rgba(26,58,42,0.05)',
            marginBottom: '20px',
            animation: 'reg-fade 0.3s ease forwards',
          }}
        >
          <style>{`@keyframes reg-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
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
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: 'rgba(61,122,85,0.07)',
            border: '1px solid rgba(61,122,85,0.20)',
            borderRadius: '14px', padding: '14px 18px',
          }}
        >
          <span style={{ flexShrink: 0, marginTop: '1px', display: 'inline-flex' }}>
            <FontAwesomeIcon icon={faMobileScreen} style={{ width: 15, height: 15, color: '#6b7f74' }} />
          </span>
          <p
            style={{
              fontFamily: FONT.body, fontSize: '0.82rem',
              color: T.secondaryText, margin: 0, lineHeight: 1.6,
            }}
          >
            பதிவு முடிந்தவுடன் உங்கள் மொபைல் எண்ணுக்கு சரிபார்ப்பு குறியீடு (OTP) அனுப்பப்படும்.
          </p>
        </div>
      </main>
    </div>
  );
}
