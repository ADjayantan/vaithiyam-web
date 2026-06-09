'use client';

/**
 * apps/web/app/auth/login/page.tsx
 *
 * Vaithiyam — Login Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Flow ─────────────────────────────────────────────────────────────────────
 *   1. Renders the existing LoginForm component inside a cream/forest page shell
 *   2. On form submit → POST /api/auth/login
 *   3. Stores JWT in localStorage (rememberMe) or sessionStorage (session-only)
 *   4. Redirects to ?next= query param, or "/" on success
 *   5. Passes server errors back into LoginForm's serverError prop
 *
 * ─── API contract ─────────────────────────────────────────────────────────────
 *   POST /api/auth/login
 *   Body:    { mode: "mobile"|"email", identifier: string, password: string }
 *   Success: { token: string, user: { id: string, name: string } }
 *   Error:   { message: string }
 *
 *   To swap for a lib function:
 *     import { loginUser } from '../../../lib/auth';
 *
 * ─── Components used ──────────────────────────────────────────────────────────
 *   LoginForm  →  apps/web/components/auth/LoginForm.tsx
 */

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams }                  from 'next/navigation';
import Link                                            from 'next/link';
import { FontAwesomeIcon }                             from '@fortawesome/react-fontawesome';
import { faLeaf, faHandsPraying }                      from '@fortawesome/free-solid-svg-icons';
import LoginForm, { type LoginCredentials }            from '../../../components/auth/LoginForm';

// ─── Design tokens (mirrors all existing Vaithiyam modules) ───────────────────
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

// ─── Auth response type ───────────────────────────────────────────────────────
interface AuthResponse {
  token: string;
  user:  { id: string; name: string; mobile?: string };
}

// ─── API helper ───────────────────────────────────────────────────────────────
async function loginApi(creds: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      mode:       creds.mode,
      identifier: creds.identifier,
      password:   creds.password,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'உள்நுழைவு தோல்வி. மீண்டும் முயற்சிக்கவும்.');
  }

  return res.json() as Promise<AuthResponse>;
}

// ─── Skeleton (prevents layout flash while Suspense resolves) ─────────────────
function FormSkeleton() {
  return (
    <div aria-hidden="true">
      <style>{`
        @keyframes vt-login-pulse {
          0%, 100% { opacity: 1;    }
          50%       { opacity: 0.5; }
        }
      `}</style>
      {/* Tab row */}
      <div
        style={{
          height:       48,
          borderRadius: '14px',
          background:   T.creamAlt,
          marginBottom: '28px',
          animation:    'vt-login-pulse 1.4s ease-in-out infinite',
        }}
      />
      {/* Field placeholders */}
      {[56, 56, 48].map((h, i) => (
        <div
          key={i}
          style={{
            height:           h,
            borderRadius:     '12px',
            background:       T.creamAlt,
            marginBottom:     '18px',
            animation:        'vt-login-pulse 1.4s ease-in-out infinite',
            animationDelay:   `${i * 0.1}s`,
          }}
        />
      ))}
      {/* Submit button placeholder */}
      <div
        style={{
          height:       52,
          borderRadius: '14px',
          background:   T.creamAlt,
          animation:    'vt-login-pulse 1.4s ease-in-out infinite',
          animationDelay: '0.3s',
        }}
      />
    </div>
  );
}

// ─── Inner component (requires Suspense — uses useSearchParams) ───────────────
function LoginPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [serverError, setServerError] = useState('');
  const [mounted,     setMounted]     = useState(false);

  // Hydration guard — avoids a React SSR mismatch on localStorage access
  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = useCallback(
    async (creds: LoginCredentials) => {
      setServerError('');
      try {
        const { token, user } = await loginApi(creds);

        // Persist based on "remember me" preference from form
        const storage = creds.rememberMe ? localStorage : sessionStorage;
        storage.setItem('vt_token', token);
        storage.setItem('vt_user',  JSON.stringify(user));

        // Honour ?next= redirect or fall back to home
        const next = searchParams.get('next') ?? '/';
        router.replace(next);
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : 'உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
        );
      }
    },
    [router, searchParams],
  );

  if (!mounted) return <FormSkeleton />;

  return (
    <LoginForm
      onSubmit={handleSubmit}
      serverError={serverError}
      onClearServerError={() => setServerError('')}
      registerHref="/auth/register"
      forgotPasswordHref="/auth/forgot-password"
      defaultMode="mobile"
    />
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div
      style={{
        minHeight:     '100dvh',
        background:    T.creamBase,
        paddingBottom: '56px',
      }}
    >
      {/* ── Sticky forest header ───────────────────────────────────────────── */}
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

          {/* Skip-to-register shortcut */}
          <Link
            href="/auth/register"
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
            பதிவு
          </Link>
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
        {/* Hero greeting */}
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
              fontSize:     '44px',
              lineHeight:   1,
              marginBottom: '14px',
              animation:    'vt-login-wave 2s ease-in-out infinite',
            }}
          >
            <FontAwesomeIcon icon={faHandsPraying} style={{ width: 40, height: 40, color: 'rgba(26,58,42,0.72)', marginBottom: 14 }} />
          </span>
          <style>{`
            @keyframes vt-login-wave {
              0%, 100% { transform: rotate(0deg); }
              20%       { transform: rotate(-8deg); }
              40%       { transform: rotate(8deg); }
              60%       { transform: rotate(-4deg); }
              80%       { transform: rotate(4deg); }
            }
          `}</style>

          <h1
            style={{
              fontFamily:   FONT.display,
              fontSize:     'clamp(1.45rem, 4.5vw, 1.85rem)',
              fontWeight:   700,
              color:        T.darkText,
              margin:       '0 0 8px',
              lineHeight:   1.2,
              letterSpacing:'0.01em',
            }}
          >
            வணக்கம்!
          </h1>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '0.94rem',
              color:      T.secondaryText,
              margin:     0,
              lineHeight: 1.6,
            }}
          >
            உங்கள் கணக்கில் உள்நுழையுங்கள்
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background:   'var(--vt-card)',
            border:       '1px solid var(--vt-border)',
            borderRadius: '24px',
            padding:      'clamp(24px, 5vw, 40px)',
            boxShadow:    'var(--vt-shadow-sm)',
            marginBottom: '28px',
          }}
        >
          <Suspense fallback={<FormSkeleton />}>
            <LoginPageInner />
          </Suspense>
        </div>

        {/* Legal footer */}
        <p
          style={{
            textAlign:  'center',
            fontFamily: FONT.body,
            fontSize:   '0.76rem',
            color:      T.muted,
            lineHeight: 1.65,
            margin:     0,
          }}
        >
          உள்நுழைவதன் மூலம் எங்கள்{' '}
          <Link
            href="/terms"
            style={{ color: T.secondaryText, fontWeight: 600, textDecoration: 'none' }}
          >
            விதிமுறைகள்
          </Link>{' '}
          மற்றும்{' '}
          <Link
            href="/privacy"
            style={{ color: T.secondaryText, fontWeight: 600, textDecoration: 'none' }}
          >
            தனியுரிமைக் கொள்கை
          </Link>
          {' '}ஐ ஏற்கிறீர்கள்.
        </p>
      </main>
    </div>
  );
}
