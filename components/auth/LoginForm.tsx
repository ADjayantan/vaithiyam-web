'use client';

/**
 * apps/web/components/auth/LoginForm.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Login Form
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Two login modes: Mobile Number (primary) · Email (secondary tab)
 *   • +91 country-code prefix chip on mobile input
 *   • Password show/hide toggle
 *   • Tamil-first validation messages
 *   • Remember me checkbox (persists preference in localStorage)
 *   • Animated error banner with dismiss
 *   • Loading / submitting state (button frozen)
 *   • Submission delegates to onSubmit prop — no API call inside
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See LoginFormProps below.
 */

import {
  useState,
  useCallback,
  useId,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import Link from 'next/link';
import { FontAwesomeIcon }  from '@fortawesome/react-fontawesome';
import { faMobileScreen, faEnvelope, faLeaf } from '@fortawesome/free-solid-svg-icons';

// ─── Design tokens (mirrors checkout / order modules exactly) ──────────────────
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

// ─── Types ─────────────────────────────────────────────────────────────────────
export type LoginMode = 'mobile' | 'email';

export interface LoginCredentials {
  mode:       LoginMode;
  identifier: string;   // mobile number (digits only) or email
  password:   string;
  rememberMe: boolean;
}

export interface LoginFormProps {
  /**
   * Called when form passes all client-side validation.
   * Parent is responsible for the API call and error handling.
   */
  onSubmit:    (creds: LoginCredentials) => Promise<void>;
  /** External server error (e.g. "தவறான கடவுச்சொல்") */
  serverError?: string;
  onClearServerError?: () => void;
  /** Link targets */
  forgotPasswordHref?: string;
  registerHref?:       string;
  /** Initial mode */
  defaultMode?: LoginMode;
  /** Disable entire form (e.g. while parent is processing) */
  disabled?: boolean;
}

// ─── Tamil validation messages ─────────────────────────────────────────────────
const ERR = {
  mobileRequired: 'மொபைல் எண் தேவை.',
  mobileInvalid:  'சரியான 10 இலக்க மொபைல் எண் உள்ளிடவும்.',
  emailRequired:  'மின்னஞ்சல் தேவை.',
  emailInvalid:   'சரியான மின்னஞ்சல் முகவரி உள்ளிடவும்.',
  passwordRequired: 'கடவுச்சொல் தேவை.',
  passwordMin:    'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.',
} as const;

// ─── Validators ────────────────────────────────────────────────────────────────
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateMobile(v: string): string {
  if (!v.trim()) return ERR.mobileRequired;
  if (!MOBILE_RE.test(v.replace(/\s/g, ''))) return ERR.mobileInvalid;
  return '';
}

function validateEmail(v: string): string {
  if (!v.trim()) return ERR.emailRequired;
  if (!EMAIL_RE.test(v.trim())) return ERR.emailInvalid;
  return '';
}

function validatePassword(v: string): string {
  if (!v) return ERR.passwordRequired;
  if (v.length < 6) return ERR.passwordMin;
  return '';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface FieldErrorProps { msg: string; id: string }
function FieldError({ msg, id }: FieldErrorProps) {
  if (!msg) return null;
  return (
    <p
      id={id}
      role="alert"
      style={{
        margin:     '6px 0 0',
        fontSize:   '0.78rem',
        color:      T.terracotta,
        fontFamily: FONT.body,
        display:    'flex',
        alignItems: 'center',
        gap:        '4px',
      }}
    >
      <span aria-hidden="true">⚠</span>
      {msg}
    </p>
  );
}

// Eye icon SVG
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function LoginForm({
  onSubmit,
  serverError,
  onClearServerError,
  forgotPasswordHref = '/auth/forgot-password',
  registerHref       = '/auth/register',
  defaultMode        = 'mobile',
  disabled           = false,
}: LoginFormProps) {
  const uid = useId();

  // ── Tab / mode ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<LoginMode>(defaultMode);

  // ── Field state ─────────────────────────────────────────────────────────────
  const [mobile,     setMobile]     = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);

  // ── Error state ─────────────────────────────────────────────────────────────
  const [mobileErr,   setMobileErr]   = useState('');
  const [emailErr,    setEmailErr]    = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  // ── Submission ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ── Focus states ────────────────────────────────────────────────────────────
  const [mobileFocused,   setMobileFocused]   = useState(false);
  const [emailFocused,    setEmailFocused]    = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ── Mode switch ─────────────────────────────────────────────────────────────
  const handleModeSwitch = useCallback((next: LoginMode) => {
    setMode(next);
    setMobileErr('');
    setEmailErr('');
    setPasswordErr('');
    onClearServerError?.();
  }, [onClearServerError]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const identErr = mode === 'mobile'
      ? validateMobile(mobile)
      : validateEmail(email);
    const pwdErr = validatePassword(password);

    if (mode === 'mobile') setMobileErr(identErr);
    else                   setEmailErr(identErr);
    setPasswordErr(pwdErr);

    return !identErr && !pwdErr;
  }, [mode, mobile, email, password]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || disabled) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        mode,
        identifier: mode === 'mobile' ? mobile.replace(/\s/g, '') : email.trim().toLowerCase(),
        password,
        rememberMe,
      });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, disabled, validate, onSubmit, mode, mobile, email, password, rememberMe]);

  // ── Input focus ring helper ──────────────────────────────────────────────────
  const inputStyle = (focused: boolean, hasError: boolean): React.CSSProperties => ({
    width:          '100%',
    boxSizing:      'border-box',
    padding:        '12px 16px',
    border:         `1.5px solid ${hasError ? T.terracotta : focused ? T.forestPrimary : T.border}`,
    borderRadius:   '12px',
    background:     focused ? 'rgba(13,34,24,0.80)' : T.creamBase,
    fontFamily:     FONT.body,
    fontSize:       '1rem',
    color:          T.darkText,
    outline:        'none',
    transition:     'border-color 0.15s, box-shadow 0.15s, background 0.15s',
    boxShadow:      focused ? `0 0 0 3px ${hasError ? 'rgba(249,92,56,0.12)' : 'rgba(61,138,92,0.12)'}` : 'none',
  });

  const isLoading = submitting || disabled;

  return (
    <div
      style={{
        fontFamily: FONT.body,
        color:      T.darkText,
      }}
    >
      {/* ── Tab switcher ──────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="உள்நுழைவு முறை"
        style={{
          display:         'flex',
          background:      T.creamAlt,
          borderRadius:    '14px',
          padding:         '4px',
          marginBottom:    '28px',
          gap:             '4px',
        }}
      >
        {(['mobile', 'email'] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => handleModeSwitch(m)}
              disabled={isLoading}
              style={{
                flex:           1,
                padding:        '10px 8px',
                border:         'none',
                borderRadius:   '10px',
                cursor:         isLoading ? 'not-allowed' : 'pointer',
                fontFamily:     FONT.display,
                fontSize:       '0.88rem',
                fontWeight:     active ? 700 : 500,
                color:          active ? '#fff' : T.secondaryText,
                background:     active
                  ? `linear-gradient(135deg, ${T.forestPrimary} 0%, #1E472E 100%)`
                  : 'transparent',
                boxShadow:      active ? '0 2px 8px rgba(26,58,42,0.18)' : 'none',
                transition:     'all 0.2s',
                letterSpacing:  '0.01em',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FontAwesomeIcon icon={m === 'mobile' ? faMobileScreen : faEnvelope} style={{ width: 13, height: 13 }} />
                {m === 'mobile' ? 'மொபைல்' : 'மின்னஞ்சல்'}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Server error banner ───────────────────────────────────────────── */}
      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            background:   'rgba(139,58,47,0.08)',
            border:       `1px solid rgba(139,58,47,0.25)`,
            borderRadius: '12px',
            padding:      '12px 14px',
            marginBottom: '20px',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
          <span style={{ flex: 1, fontSize: '0.88rem', color: T.terracotta, fontFamily: FONT.body }}>
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
                fontSize:   '1rem',
                padding:    '2px',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate>

        {/* ── Mobile field ─────────────────────────────────────────────── */}
        {mode === 'mobile' && (
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor={`${uid}-mobile`}
              style={{
                display:    'block',
                fontFamily: FONT.display,
                fontSize:   '0.82rem',
                fontWeight: 600,
                color:      T.secondaryText,
                marginBottom: '7px',
              }}
            >
              மொபைல் எண்
              <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* +91 chip */}
              <div
                aria-label="India +91"
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  padding:        '12px 14px',
                  background:     T.creamAlt,
                  border:         `1.5px solid ${T.border}`,
                  borderRadius:   '12px',
                  fontFamily:     FONT.body,
                  fontSize:       '1rem',
                  color:          T.secondaryText,
                  fontWeight:     600,
                  whiteSpace:     'nowrap',
                  flexShrink:     0,
                  userSelect:     'none',
                }}
              >
                🇮🇳 +91
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  id={`${uid}-mobile`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="9876543210"
                  value={mobile}
                  disabled={isLoading}
                  aria-invalid={!!mobileErr}
                  aria-describedby={mobileErr ? `${uid}-mobile-err` : undefined}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const rawCleaned = e.target.value.replace(/\D/g, '');
                    let finalVal = rawCleaned;
                    if (finalVal.startsWith('91') && finalVal.length > 10) {
                      const withoutPrefix = finalVal.slice(2);
                      if (/^[6-9]/.test(withoutPrefix)) {
                        finalVal = withoutPrefix;
                      }
                    } else if (finalVal.startsWith('0') && finalVal.length > 10) {
                      const withoutPrefix = finalVal.slice(1);
                      if (/^[6-9]/.test(withoutPrefix)) {
                        finalVal = withoutPrefix;
                      }
                    }
                    const val = finalVal.slice(0, 10);
                    setMobile(val);
                    if (mobileErr) setMobileErr(validateMobile(val));
                    onClearServerError?.();
                  }}
                  onFocus={() => setMobileFocused(true)}
                  onBlur={() => {
                    setMobileFocused(false);
                    setMobileErr(validateMobile(mobile));
                  }}
                  style={{
                    ...inputStyle(mobileFocused, !!mobileErr),
                    letterSpacing: '0.08em',
                  }}
                />
              </div>
            </div>
            <FieldError msg={mobileErr} id={`${uid}-mobile-err`} />
          </div>
        )}

        {/* ── Email field ──────────────────────────────────────────────── */}
        {mode === 'email' && (
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor={`${uid}-email`}
              style={{
                display:    'block',
                fontFamily: FONT.display,
                fontSize:   '0.82rem',
                fontWeight: 600,
                color:      T.secondaryText,
                marginBottom: '7px',
              }}
            >
              மின்னஞ்சல்
              <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
            </label>
            <input
              id={`${uid}-email`}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              disabled={isLoading}
              aria-invalid={!!emailErr}
              aria-describedby={emailErr ? `${uid}-email-err` : undefined}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
                if (emailErr) setEmailErr(validateEmail(e.target.value));
                onClearServerError?.();
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => {
                setEmailFocused(false);
                setEmailErr(validateEmail(email));
              }}
              style={inputStyle(emailFocused, !!emailErr)}
            />
            <FieldError msg={emailErr} id={`${uid}-email-err`} />
          </div>
        )}

        {/* ── Password field ───────────────────────────────────────────── */}
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              display:       'flex',
              alignItems:    'baseline',
              justifyContent:'space-between',
              marginBottom:  '7px',
            }}
          >
            <label
              htmlFor={`${uid}-password`}
              style={{
                fontFamily: FONT.display,
                fontSize:   '0.82rem',
                fontWeight: 600,
                color:      T.secondaryText,
              }}
            >
              கடவுச்சொல்
              <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
            </label>
            <Link
              href={forgotPasswordHref}
              style={{
                fontFamily:  FONT.body,
                fontSize:    '0.78rem',
                color:       T.leaf,
                fontWeight:  600,
                textDecoration: 'none',
              }}
            >
              மறந்துவிட்டீர்களா?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id={`${uid}-password`}
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="உங்கள் கடவுச்சொல்"
              value={password}
              disabled={isLoading}
              aria-invalid={!!passwordErr}
              aria-describedby={passwordErr ? `${uid}-pwd-err` : undefined}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value);
                if (passwordErr) setPasswordErr(validatePassword(e.target.value));
                onClearServerError?.();
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => {
                setPasswordFocused(false);
                setPasswordErr(validatePassword(password));
              }}
              style={{
                ...inputStyle(passwordFocused, !!passwordErr),
                paddingRight: '48px',
              }}
            />
            <button
              type="button"
              aria-label={showPwd ? 'கடவுச்சொல் மறை' : 'கடவுச்சொல் காட்டு'}
              onClick={() => setShowPwd((p) => !p)}
              style={{
                position:   'absolute',
                right:      '14px',
                top:        '50%',
                transform:  'translateY(-50%)',
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                color:      T.muted,
                padding:    '4px',
                display:    'flex',
                alignItems: 'center',
              }}
            >
              <EyeIcon open={showPwd} />
            </button>
          </div>
          <FieldError msg={passwordErr} id={`${uid}-pwd-err`} />
        </div>

        {/* ── Remember me ──────────────────────────────────────────────── */}
        <div
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '10px',
            marginBottom:'28px',
            marginTop:   '16px',
          }}
        >
          <input
            id={`${uid}-remember`}
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            style={{
              width:        '18px',
              height:       '18px',
              cursor:       'pointer',
              accentColor:  T.forestPrimary,
              flexShrink:   0,
            }}
          />
          <label
            htmlFor={`${uid}-remember`}
            style={{
              fontFamily:  FONT.body,
              fontSize:    '0.86rem',
              color:       T.secondaryText,
              cursor:      'pointer',
              userSelect:  'none',
            }}
          >
            என்னை நினைவில் வைத்துக்கொள்
          </label>
        </div>

        {/* ── Submit button ─────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width:          '100%',
            padding:        '15px 24px',
            border:         'none',
            borderRadius:   '14px',
            cursor:         isLoading ? 'not-allowed' : 'pointer',
            background:     isLoading
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
            boxShadow:      isLoading ? 'none' : '0 4px 16px rgba(26,58,42,0.28)',
            transition:     'opacity 0.2s, box-shadow 0.2s',
            opacity:        isLoading ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <>
              <Spinner />
              <span>உள்நுழைகிறோம்...</span>
            </>
          ) : (
            <>
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}><FontAwesomeIcon icon={faLeaf} style={{ width: 14, height: 14 }} /></span>
              <span>உள்நுழையுங்கள்</span>
            </>
          )}
        </button>

        {/* ── Register link ─────────────────────────────────────────────── */}
        <p
          style={{
            textAlign:  'center',
            marginTop:  '22px',
            fontFamily: FONT.body,
            fontSize:   '0.88rem',
            color:      T.secondaryText,
          }}
        >
          புதிய கணக்கு தேவையா?{' '}
          <Link
            href={registerHref}
            style={{
              color:          T.leaf,
              fontWeight:     700,
              textDecoration: 'none',
            }}
          >
            பதிவு செய்யுங்கள்
          </Link>
        </p>
      </form>
    </div>
  );
}

// ─── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ animation: 'vt-spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes vt-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
