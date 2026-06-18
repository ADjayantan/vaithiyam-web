'use client';

/**
 * apps/web/components/auth/RegisterForm.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Registration Form
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Full Name (Tamil Unicode support)
 *   • Mobile Number (+91 prefix chip)
 *   • Email (optional but validated if provided)
 *   • Password + Confirm Password with show/hide toggles
 *   • Password strength meter: weak / fair / strong / very strong
 *   • Tamil validation messages on every field
 *   • Terms & Conditions acceptance checkbox
 *   • Submit delegates to onSubmit prop — no API call inside
 *   • Loading state: button frozen with spinner
 *   • Server error banner with dismiss
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See RegisterFormProps below.
 */

import {
  useState,
  useCallback,
  useId,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling }      from '@fortawesome/free-solid-svg-icons';

// ─── Design tokens (mirrors checkout / LoginForm exactly) ──────────────────────
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
export interface RegisterData {
  fullName:    string;
  mobile:      string;   // 10-digit, digits only
  email:       string;
  password:    string;
}

export interface RegisterFormProps {
  onSubmit:    (data: RegisterData) => Promise<void>;
  serverError?: string;
  onClearServerError?: () => void;
  loginHref?:  string;
  termsHref?:  string;
  privacyHref?: string;
  disabled?:   boolean;
}

// ─── Tamil validation messages ─────────────────────────────────────────────────
const ERR = {
  nameRequired:    'பூரண பெயர் தேவை.',
  nameMin:         'பெயர் குறைந்தது 2 எழுத்துகள் இருக்க வேண்டும்.',
  nameInvalid:     'பெயரில் எண்கள் அல்லது சிறப்பு குறியீடுகள் வேண்டாம்.',
  mobileRequired:  'மொபைல் எண் தேவை.',
  mobileInvalid:   'சரியான 10 இலக்க மொபைல் எண் உள்ளிடவும்.',
  emailInvalid:    'சரியான மின்னஞ்சல் முகவரி உள்ளிடவும்.',
  passwordRequired:'கடவுச்சொல் தேவை.',
  passwordMin:     'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்.',
  passwordWeak:    'கடவுச்சொல் வலுவற்றது. எண்கள் மற்றும் சிறப்பு குறியீடுகள் சேர்க்கவும்.',
  confirmRequired: 'கடவுச்சொல் உறுதிப்படுத்தல் தேவை.',
  confirmMismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை.',
  termsRequired:   'தொடர்வதற்கு விதிமுறைகளை ஏற்றுக்கொள்ளவும்.',
} as const;

// ─── Validators ────────────────────────────────────────────────────────────────
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Allow Tamil Unicode (U+0B80–U+0BFF), Latin letters, spaces, hyphens, apostrophes
const NAME_CHARS_RE = /^[\u0B80-\u0BFFa-zA-Z '\-]+$/;

function validateName(v: string): string {
  const trimmed = v.trim();
  if (!trimmed)           return ERR.nameRequired;
  if (trimmed.length < 2) return ERR.nameMin;
  if (!NAME_CHARS_RE.test(trimmed)) return ERR.nameInvalid;
  return '';
}

function validateMobile(v: string): string {
  if (!v.trim()) return ERR.mobileRequired;
  if (!MOBILE_RE.test(v.replace(/\s/g, ''))) return ERR.mobileInvalid;
  return '';
}

function validateEmail(v: string): string {
  if (!v.trim()) return '';   // email is optional
  if (!EMAIL_RE.test(v.trim())) return ERR.emailInvalid;
  return '';
}

function validatePassword(v: string): string {
  if (!v)             return ERR.passwordRequired;
  if (v.length < 8)  return ERR.passwordMin;
  return '';
}

function validateConfirm(v: string, pw: string): string {
  if (!v)         return ERR.confirmRequired;
  if (v !== pw)   return ERR.confirmMismatch;
  return '';
}

// ─── Password strength ─────────────────────────────────────────────────────────
type StrengthLevel = 'empty' | 'weak' | 'fair' | 'strong' | 'very-strong';

interface StrengthInfo {
  level:  StrengthLevel;
  score:  number;   // 0–4
  labelTa: string;
  color:  string;
}

function getPasswordStrength(pw: string): StrengthInfo {
  if (!pw) return { level: 'empty', score: 0, labelTa: '', color: T.border };

  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw))   score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 'weak',      score: 1, labelTa: 'மிகவும் பலவீனம்', color: T.terracotta };
  if (score === 2) return { level: 'fair',      score: 2, labelTa: 'சுமாரான வலிமை',   color: T.saffron    };
  if (score === 3) return { level: 'strong',    score: 3, labelTa: 'வலிமையானது',      color: T.gold       };
  return               { level: 'very-strong', score: 4, labelTa: 'மிகவும் வலிமையானது', color: T.leaf    };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldError({ msg, id }: { msg: string; id: string }) {
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
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Password Strength Meter ────────────────────────────────────────────────────
function StrengthMeter({ password }: { password: string }) {
  const info = getPasswordStrength(password);
  if (info.level === 'empty') return null;

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Bar track */}
      <div
        style={{
          display:  'flex',
          gap:      '4px',
          marginBottom: '5px',
        }}
        aria-hidden="true"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex:         1,
              height:       '4px',
              borderRadius: '4px',
              background:   i <= info.score ? info.color : T.border,
              transition:   'background 0.25s',
            }}
          />
        ))}
      </div>
      {/* Label */}
      <p
        aria-live="polite"
        style={{
          fontSize:   '0.76rem',
          fontFamily: FONT.body,
          color:      info.color,
          fontWeight: 600,
          margin:     0,
        }}
      >
        கடவுச்சொல் வலிமை: {info.labelTa}
      </p>
    </div>
  );
}

// ─── Input style helper ─────────────────────────────────────────────────────────
function inputStyle(focused: boolean, hasError: boolean): React.CSSProperties {
  return {
    width:        '100%',
    boxSizing:    'border-box',
    padding:      '12px 16px',
    border:       `1.5px solid ${hasError ? T.terracotta : focused ? T.forestPrimary : T.border}`,
    borderRadius: '12px',
    background:   focused ? 'rgba(13,34,24,0.80)' : T.creamBase,
    fontFamily:   FONT.body,
    fontSize:     '1rem',
    color:        T.darkText,
    outline:      'none',
    transition:   'border-color 0.15s, box-shadow 0.15s, background 0.15s',
    boxShadow:    focused
      ? `0 0 0 3px ${hasError ? 'rgba(249,92,56,0.12)' : 'rgba(61,138,92,0.12)'}`
      : 'none',
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display:    'block',
    fontFamily: FONT.display,
    fontSize:   '0.82rem',
    fontWeight: 600,
    color:      T.secondaryText,
    marginBottom: '7px',
  };
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RegisterForm({
  onSubmit,
  serverError,
  onClearServerError,
  loginHref   = '/auth/login',
  termsHref   = '/terms',
  privacyHref = '/privacy',
  disabled    = false,
}: RegisterFormProps) {
  const uid = useId();

  // ── Field state ─────────────────────────────────────────────────────────────
  const [fullName,    setFullName]    = useState('');
  const [mobile,      setMobile]      = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Show/hide ────────────────────────────────────────────────────────────────
  const [showPwd,  setShowPwd]  = useState(false);
  const [showConf, setShowConf] = useState(false);

  // ── Errors ──────────────────────────────────────────────────────────────────
  const [nameErr,    setNameErr]    = useState('');
  const [mobileErr,  setMobileErr]  = useState('');
  const [emailErr,   setEmailErr]   = useState('');
  const [pwdErr,     setPwdErr]     = useState('');
  const [confErr,    setConfErr]    = useState('');
  const [termsErr,   setTermsErr]   = useState('');

  // ── Focus states ─────────────────────────────────────────────────────────────
  const [nameFocused,   setNameFocused]   = useState(false);
  const [mobileFocused, setMobileFocused] = useState(false);
  const [emailFocused,  setEmailFocused]  = useState(false);
  const [pwdFocused,    setPwdFocused]    = useState(false);
  const [confFocused,   setConfFocused]   = useState(false);

  // ── Submission ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  const isLoading = submitting || disabled;

  // ── Validate all ──────────────────────────────────────────────────────────────
  const validateAll = useCallback((): boolean => {
    const ne = validateName(fullName);
    const me = validateMobile(mobile);
    const ee = validateEmail(email);
    const pe = validatePassword(password);
    const ce = validateConfirm(confirm, password);
    const te = termsAccepted ? '' : ERR.termsRequired;

    setNameErr(ne);
    setMobileErr(me);
    setEmailErr(ee);
    setPwdErr(pe);
    setConfErr(ce);
    setTermsErr(te);

    return !ne && !me && !ee && !pe && !ce && !te;
  }, [fullName, mobile, email, password, confirm, termsAccepted]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        fullName:  fullName.trim(),
        mobile:    mobile.replace(/\s/g, ''),
        email:     email.trim().toLowerCase(),
        password,
      });
    } finally {
      setSubmitting(false);
    }
  }, [isLoading, validateAll, onSubmit, fullName, mobile, email, password]);

  return (
    <div style={{ fontFamily: FONT.body, color: T.darkText }}>

      {/* ── Server error ─────────────────────────────────────────────────── */}
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.terracotta, fontSize: '1rem', padding: '2px', lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Full Name ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '18px' }}>
          <label htmlFor={`${uid}-name`} style={labelStyle()}>
            பூரண பெயர்
            <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
          </label>
          <input
            id={`${uid}-name`}
            type="text"
            autoComplete="name"
            placeholder="உங்கள் பூரண பெயர்"
            value={fullName}
            disabled={isLoading}
            aria-invalid={!!nameErr}
            aria-describedby={nameErr ? `${uid}-name-err` : undefined}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setFullName(e.target.value);
              if (nameErr) setNameErr(validateName(e.target.value));
              onClearServerError?.();
            }}
            onFocus={() => setNameFocused(true)}
            onBlur={() => { setNameFocused(false); setNameErr(validateName(fullName)); }}
            style={inputStyle(nameFocused, !!nameErr)}
          />
          <FieldError msg={nameErr} id={`${uid}-name-err`} />
        </div>

        {/* ── Mobile Number ────────────────────────────────────────────── */}
        <div style={{ marginBottom: '18px' }}>
          <label htmlFor={`${uid}-mobile`} style={labelStyle()}>
            மொபைல் எண்
            <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div
              aria-label="India +91"
              style={{
                display:      'flex',
                alignItems:   'center',
                padding:      '12px 14px',
                background:   T.creamAlt,
                border:       `1.5px solid ${T.border}`,
                borderRadius: '12px',
                fontFamily:   FONT.body,
                fontSize:     '1rem',
                color:        T.secondaryText,
                fontWeight:   600,
                whiteSpace:   'nowrap',
                flexShrink:   0,
                userSelect:   'none',
              }}
            >
              🇮🇳 +91
            </div>
            <div style={{ flex: 1 }}>
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
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(val);
                  if (mobileErr) setMobileErr(validateMobile(val));
                  onClearServerError?.();
                }}
                onFocus={() => setMobileFocused(true)}
                onBlur={() => { setMobileFocused(false); setMobileErr(validateMobile(mobile)); }}
                style={{ ...inputStyle(mobileFocused, !!mobileErr), letterSpacing: '0.08em' }}
              />
            </div>
          </div>
          <FieldError msg={mobileErr} id={`${uid}-mobile-err`} />
        </div>

        {/* ── Email (optional) ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '18px' }}>
          <label htmlFor={`${uid}-email`} style={labelStyle()}>
            மின்னஞ்சல்{' '}
            <span style={{ color: T.muted, fontWeight: 400, fontSize: '0.76rem' }}>(விருப்பமானது)</span>
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
            onBlur={() => { setEmailFocused(false); setEmailErr(validateEmail(email)); }}
            style={inputStyle(emailFocused, !!emailErr)}
          />
          <FieldError msg={emailErr} id={`${uid}-email-err`} />
        </div>

        {/* ── Password ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '18px' }}>
          <label htmlFor={`${uid}-password`} style={labelStyle()}>
            கடவுச்சொல்
            <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id={`${uid}-password`}
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="குறைந்தது 8 எழுத்துகள்"
              value={password}
              disabled={isLoading}
              aria-invalid={!!pwdErr}
              aria-describedby={[
                pwdErr ? `${uid}-pwd-err` : '',
                `${uid}-pwd-strength`,
              ].filter(Boolean).join(' ') || undefined}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value);
                if (pwdErr)  setPwdErr(validatePassword(e.target.value));
                if (confirm) setConfErr(validateConfirm(confirm, e.target.value));
                onClearServerError?.();
              }}
              onFocus={() => setPwdFocused(true)}
              onBlur={() => { setPwdFocused(false); setPwdErr(validatePassword(password)); }}
              style={{ ...inputStyle(pwdFocused, !!pwdErr), paddingRight: '48px' }}
            />
            <button
              type="button"
              aria-label={showPwd ? 'கடவுச்சொல் மறை' : 'கடவுச்சொல் காட்டு'}
              onClick={() => setShowPwd((v) => !v)}
              style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: '4px',
                display: 'flex', alignItems: 'center',
              }}
            >
              <EyeIcon open={showPwd} />
            </button>
          </div>
          <FieldError msg={pwdErr} id={`${uid}-pwd-err`} />
          <div id={`${uid}-pwd-strength`}>
            <StrengthMeter password={password} />
          </div>
        </div>

        {/* ── Confirm Password ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '22px' }}>
          <label htmlFor={`${uid}-confirm`} style={labelStyle()}>
            கடவுச்சொல் உறுதிப்படுத்தல்
            <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id={`${uid}-confirm`}
              type={showConf ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="கடவுச்சொல்லை மீண்டும் உள்ளிடவும்"
              value={confirm}
              disabled={isLoading}
              aria-invalid={!!confErr}
              aria-describedby={confErr ? `${uid}-conf-err` : undefined}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setConfirm(e.target.value);
                if (confErr) setConfErr(validateConfirm(e.target.value, password));
                onClearServerError?.();
              }}
              onFocus={() => setConfFocused(true)}
              onBlur={() => { setConfFocused(false); setConfErr(validateConfirm(confirm, password)); }}
              style={{ ...inputStyle(confFocused, !!confErr), paddingRight: '48px' }}
            />
            <button
              type="button"
              aria-label={showConf ? 'கடவுச்சொல் மறை' : 'கடவுச்சொல் காட்டு'}
              onClick={() => setShowConf((v) => !v)}
              style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: '4px',
                display: 'flex', alignItems: 'center',
              }}
            >
              <EyeIcon open={showConf} />
            </button>
          </div>
          {/* Match indicator */}
          {confirm && !confErr && password && (
            <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: T.leaf, fontFamily: FONT.body, fontWeight: 600 }}>
              ✓ கடவுச்சொற்கள் பொருந்துகின்றன
            </p>
          )}
          <FieldError msg={confErr} id={`${uid}-conf-err`} />
        </div>

        {/* ── Terms & Conditions ───────────────────────────────────────── */}
        <div
          style={{
            background:   T.creamAlt,
            borderRadius: '12px',
            padding:      '14px 16px',
            marginBottom: '26px',
            border:       termsErr ? `1.5px solid ${T.terracotta}` : `1.5px solid ${T.border}`,
          }}
        >
          <label
            style={{
              display:     'flex',
              alignItems:  'flex-start',
              gap:         '12px',
              cursor:      isLoading ? 'not-allowed' : 'pointer',
              userSelect:  'none',
            }}
          >
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (termsErr) setTermsErr(e.target.checked ? '' : ERR.termsRequired);
              }}
              disabled={isLoading}
              aria-describedby={termsErr ? `${uid}-terms-err` : undefined}
              style={{
                width:       '18px',
                height:      '18px',
                marginTop:   '1px',
                flexShrink:  0,
                cursor:      'pointer',
                accentColor: T.forestPrimary,
              }}
            />
            <span style={{ fontFamily: FONT.body, fontSize: '0.84rem', color: T.secondaryText, lineHeight: 1.5 }}>
              நான்{' '}
              <a
                href={termsHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: T.leaf, fontWeight: 700, textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                விதிமுறைகள் மற்றும் நிபந்தனைகள்
              </a>
              {' '}மற்றும்{' '}
              <a
                href={privacyHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: T.leaf, fontWeight: 700, textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                தனியுரிமைக் கொள்கை
              </a>
              {' '}ஐ படித்து ஏற்றுக்கொள்கிறேன்.
            </span>
          </label>
          {termsErr && (
            <p
              id={`${uid}-terms-err`}
              role="alert"
              style={{ margin: '8px 0 0', fontSize: '0.78rem', color: T.terracotta, fontFamily: FONT.body, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span aria-hidden="true">⚠</span>
              {termsErr}
            </p>
          )}
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
            color:          '#fff',
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
            <><Spinner /><span>பதிவு செய்கிறோம்...</span></>
          ) : (
            <><span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}><FontAwesomeIcon icon={faSeedling} style={{ width: 14, height: 14 }} /></span><span>கணக்கு உருவாக்குங்கள்</span></>
          )}
        </button>

        {/* ── Login link ────────────────────────────────────────────────── */}
        <p
          style={{
            textAlign:  'center',
            marginTop:  '22px',
            fontFamily: FONT.body,
            fontSize:   '0.88rem',
            color:      T.secondaryText,
          }}
        >
          ஏற்கனவே கணக்கு உள்ளதா?{' '}
          <Link href={loginHref} style={{ color: T.leaf, fontWeight: 700, textDecoration: 'none' }}>
            உள்நுழையுங்கள்
          </Link>
        </p>
      </form>
    </div>
  );
}
