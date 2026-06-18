'use client';

/**
 * apps/web/components/account/EditProfileForm.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Edit Profile Form
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Profile photo upload area — live preview, 5 MB guard, image/* only
 *   • Full Name field (Tamil Unicode + Latin, min 2 chars)
 *   • Mobile Number field — +91 chip, 10-digit validation, read-only when verified
 *   • Email field — optional, RFC-5322 lite validation
 *   • Tamil validation error messages on every field
 *   • "மாற்றங்களை சேமி" primary CTA + "ரத்து செய்" cancel button
 *   • Loading state: form frozen + spinner in save button
 *   • Server error banner with dismiss
 *   • Unsaved-changes guard — cancel asks if dirty
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See EditProfileFormProps below.
 *
 * ─── Usage ─────────────────────────────────────────────────────────────────────
 *   <EditProfileForm
 *     user={user}
 *     onSave={async (data) => { await patchProfile(data); }}
 *     onCancel={() => setEditOpen(false)}
 *   />
 */

import {
  useState,
  useRef,
  useCallback,
  useId,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import type { UserProfile } from './ProfileCard';

// ─── Re-export UserProfile so consumers can import from one place ─────────────
export type { UserProfile };

// ─── Design tokens (mirrors all Iyarkai Nala modules exactly) ────────────────────
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
export interface ProfileUpdate {
  name:      string;
  mobile:    string;          // 10-digit
  email:     string;
  photoFile?: File | null;    // null = remove photo, undefined = unchanged
}

export interface EditProfileFormProps {
  user:         UserProfile;
  onSave:       (data: ProfileUpdate) => Promise<void>;
  onCancel:     () => void;
  serverError?: string;
  onClearServerError?: () => void;
  disabled?:    boolean;
}

// ─── Tamil validation messages ─────────────────────────────────────────────────
const ERR = {
  nameRequired:  'பெயர் தேவை.',
  nameMin:       'பெயர் குறைந்தது 2 எழுத்துகள் இருக்க வேண்டும்.',
  nameInvalid:   'பெயரில் எண்கள் அல்லது சிறப்பு குறியீடுகள் வேண்டாம்.',
  mobileRequired:'மொபைல் எண் தேவை.',
  mobileInvalid: 'சரியான 10 இலக்க மொபைல் எண் உள்ளிடவும்.',
  emailInvalid:  'சரியான மின்னஞ்சல் முகவரி உள்ளிடவும்.',
  photoSize:     'படத்தின் அளவு 5 MB-ஐ தாண்டக்கூடாது.',
  photoType:     'JPG, PNG, அல்லது WebP படங்கள் மட்டுமே ஏற்றுக்கொள்ளப்படும்.',
} as const;

// ─── Validators ────────────────────────────────────────────────────────────────
const MOBILE_RE     = /^[6-9]\d{9}$/;
const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_VALID_RE = /^[\u0B80-\u0BFFa-zA-Z '\-]+$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES   = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function validateName(v: string): string {
  const t = v.trim();
  if (!t)            return ERR.nameRequired;
  if (t.length < 2)  return ERR.nameMin;
  if (!NAME_VALID_RE.test(t)) return ERR.nameInvalid;
  return '';
}

function validateMobile(v: string, locked: boolean): string {
  if (locked) return '';
  if (!v.trim())               return ERR.mobileRequired;
  if (!MOBILE_RE.test(v.replace(/\s/g, ''))) return ERR.mobileInvalid;
  return '';
}

function validateEmail(v: string): string {
  if (!v.trim()) return '';
  if (!EMAIL_RE.test(v.trim())) return ERR.emailInvalid;
  return '';
}

// ─── Input / label helpers ────────────────────────────────────────────────────
function inputStyleFn(focused: boolean, error: boolean): React.CSSProperties {
  return {
    width:        '100%',
    boxSizing:    'border-box',
    padding:      '12px 16px',
    border:       `1.5px solid ${error ? T.terracotta : focused ? T.forestPrimary : T.border}`,
    borderRadius: '12px',
    background:   focused ? 'rgba(13,34,24,0.80)' : T.creamBase,
    fontFamily:   FONT.body,
    fontSize:     '1rem',
    color:        T.darkText,
    outline:      'none',
    transition:   'border-color 0.15s, box-shadow 0.15s, background 0.15s',
    boxShadow:    focused
      ? `0 0 0 3px ${error ? 'rgba(249,92,56,0.12)' : 'rgba(61,138,92,0.12)'}`
      : 'none',
  };
}

function labelStyleFn(): React.CSSProperties {
  return {
    display:      'block',
    fontFamily:   FONT.display,
    fontSize:     '0.82rem',
    fontWeight:   600,
    color:        T.secondaryText,
    marginBottom: '7px',
  };
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

function Spinner() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ animation: 'vt-epf-spin 0.75s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.28)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function EditProfileForm({
  user,
  onSave,
  onCancel,
  serverError,
  onClearServerError,
  disabled = false,
}: EditProfileFormProps) {
  const uid = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Field state (initialised from user prop) ───────────────────────────────
  const [name,        setName]        = useState(user.name ?? '');
  const [mobile,      setMobile]      = useState(
    (user.mobile ?? '').replace(/\D/g, '').slice(0, 10)
  );
  const [email,       setEmail]       = useState(user.email ?? '');

  // ── Photo state ───────────────────────────────────────────────────────────
  // previewUrl: local blob URL for newly selected file, or the existing photoUrl
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(user.photoUrl ?? null);
  const [photoFile,   setPhotoFile]   = useState<File | null | undefined>(undefined);
  const [photoError,  setPhotoError]  = useState('');
  const [photoHover,  setPhotoHover]  = useState(false);

  // ── Validation errors ─────────────────────────────────────────────────────
  const [nameErr,   setNameErr]   = useState('');
  const [mobileErr, setMobileErr] = useState('');
  const [emailErr,  setEmailErr]  = useState('');

  // ── Focus states ──────────────────────────────────────────────────────────
  const [nameFocused,   setNameFocused]   = useState(false);
  const [mobileFocused, setMobileFocused] = useState(false);
  const [emailFocused,  setEmailFocused]  = useState(false);

  // ── Submission ────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  // Mobile is locked if already verified
  const mobileLocked = !!user.mobileVerified;

  // Dirty check for unsaved-changes guard
  const isDirty =
    name.trim()  !== (user.name ?? '').trim()          ||
    mobile       !== (user.mobile ?? '').replace(/\D/g, '').slice(0, 10) ||
    email.trim() !== (user.email ?? '').trim()          ||
    photoFile    !== undefined;

  // Revoke old object URL when photoFile changes to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = saving || disabled;

  // ── Photo pick ───────────────────────────────────────────────────────────
  const handlePhotoClick = useCallback(() => {
    if (isLoading) return;
    fileInputRef.current?.click();
  }, [isLoading]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError(ERR.photoType);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(ERR.photoSize);
      return;
    }
    setPhotoError('');

    // Revoke previous local blob
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setPhotoFile(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [previewUrl]);

  const handleRemovePhoto = useCallback(() => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoFile(null);  // null = explicit remove
    setPhotoError('');
  }, [previewUrl]);

  // ── Validate all ─────────────────────────────────────────────────────────
  const validateAll = useCallback((): boolean => {
    const ne = validateName(name);
    const me = validateMobile(mobile, mobileLocked);
    const ee = validateEmail(email);
    setNameErr(ne);
    setMobileErr(me);
    setEmailErr(ee);
    return !ne && !me && !ee && !photoError;
  }, [name, mobile, email, mobileLocked, photoError]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateAll()) return;

    setSaving(true);
    try {
      await onSave({
        name:      name.trim(),
        mobile:    mobile.replace(/\s/g, ''),
        email:     email.trim().toLowerCase(),
        photoFile,
      });
    } finally {
      setSaving(false);
    }
  }, [isLoading, validateAll, onSave, name, mobile, email, photoFile]);

  // ── Cancel guard ──────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm('மாற்றங்கள் சேமிக்கப்படவில்லை. வெளியேறவா?')) return;
    onCancel();
  }, [isDirty, onCancel]);

  const initials = getInitials(name || user.name);

  return (
    <section
      aria-label="சுயவிவரம் திருத்து"
      style={{
        background:   'var(--vt-card)',
        border:       `1px solid var(--vt-border)`,
        borderRadius: '24px',
        overflow:     'hidden',
        boxShadow:    'var(--vt-shadow-sm)',
      }}
    >
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div
        style={{
          padding:         '18px 24px 16px',
          borderBottom:    `1px solid ${T.border}`,
          display:         'flex',
          alignItems:      'center',
          gap:             '10px',
          background:      T.creamBase,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width:          '34px',
            height:         '34px',
            borderRadius:   '10px',
            background:     `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          <PenIcon />
        </div>
        <div>
          <h2
            style={{
              fontFamily:   FONT.display,
              fontSize:     '1rem',
              fontWeight:   700,
              color:        T.darkText,
              margin:       '0 0 1px',
              lineHeight:   1.25,
            }}
          >
            சுயவிவரம் திருத்து
          </h2>
          <p style={{ fontFamily: FONT.body, fontSize: '0.75rem', color: T.muted, margin: 0, lineHeight: 1.4 }}>
            உங்கள் தகவல்களை புதுப்பிக்கவும்
          </p>
        </div>
      </div>

      {/* ── Form body ────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px' }}>

        {/* ── Server error ─────────────────────────────────────────────── */}
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
            <span style={{ flex: 1, fontSize: '0.86rem', color: T.terracotta, fontFamily: FONT.body }}>
              {serverError}
            </span>
            {onClearServerError && (
              <button
                type="button"
                onClick={onClearServerError}
                aria-label="பிழை மூடு"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.terracotta, fontSize: '1.1rem', padding: '2px', lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Photo upload ─────────────────────────────────────────── */}
          <div style={{ marginBottom: '28px' }}>
            <p style={labelStyleFn()}>சுயவிவர படம்</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {/* Avatar preview */}
              <div
                role="button"
                tabIndex={0}
                aria-label="புகைப்படம் மாற்று"
                onClick={handlePhotoClick}
                onKeyDown={(e) => e.key === 'Enter' && handlePhotoClick()}
                onMouseEnter={() => setPhotoHover(true)}
                onMouseLeave={() => setPhotoHover(false)}
                style={{
                  width:          '76px',
                  height:         '76px',
                  borderRadius:   '50%',
                  border:         `2.5px solid ${photoError ? T.terracotta : T.border}`,
                  overflow:       'hidden',
                  position:       'relative',
                  cursor:         isLoading ? 'not-allowed' : 'pointer',
                  flexShrink:     0,
                  background:     previewUrl
                    ? 'transparent'
                    : `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  transition:     'border-color 0.15s',
                  boxShadow:      '0 2px 10px rgba(26,58,42,0.12)',
                }}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="சுயவிவர படம்"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: FONT.display,
                      fontSize:   '24px',
                      fontWeight: 700,
                      color:      T.goldPale,
                      lineHeight: 1,
                      userSelect: 'none',
                    }}
                  >
                    {initials || '?'}
                  </span>
                )}

                {/* Hover overlay */}
                {photoHover && !isLoading && (
                  <div
                    aria-hidden="true"
                    style={{
                      position:        'absolute',
                      inset:           0,
                      background:      'rgba(15,42,28,0.62)',
                      display:         'flex',
                      flexDirection:   'column',
                      alignItems:      'center',
                      justifyContent:  'center',
                      gap:             '3px',
                    }}
                  >
                    <CameraSmIcon />
                    <span style={{ fontFamily: FONT.body, fontSize: '9px', color: T.goldPale, fontWeight: 600, lineHeight: 1.2 }}>
                      மாற்று
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePhotoClick}
                  disabled={isLoading}
                  style={{
                    padding:      '8px 16px',
                    border:       `1.5px solid var(--vt-border)`,
                    borderRadius: '100px',
                    background:   'transparent',
                    cursor:       isLoading ? 'not-allowed' : 'pointer',
                    fontFamily:   FONT.display,
                    fontSize:     '0.82rem',
                    fontWeight:   700,
                    color:        'var(--vt-gold-300)',
                    transition:   'all 0.15s',
                    whiteSpace:   'nowrap',
                  }}
                >
                  📷 படம் தேர்ந்தெடு
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isLoading}
                    style={{
                      padding:      '7px 16px',
                      border:       `1.5px solid var(--vt-border)`,
                      borderRadius: '100px',
                      background:   'transparent',
                      cursor:       isLoading ? 'not-allowed' : 'pointer',
                      fontFamily:   FONT.display,
                      fontSize:     '0.78rem',
                      fontWeight:   600,
                      color:        'var(--vt-coral-500)',
                      transition:   'all 0.15s',
                      whiteSpace:   'nowrap',
                    }}
                  >
                    🗑 படம் நீக்கு
                  </button>
                )}
                <p style={{ margin: 0, fontFamily: FONT.body, fontSize: '0.72rem', color: T.muted, lineHeight: 1.5 }}>
                  JPG, PNG, WebP · அதிகபட்சம் 5 MB
                </p>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {photoError && (
              <p
                role="alert"
                style={{ margin: '8px 0 0', fontSize: '0.78rem', color: T.terracotta, fontFamily: FONT.body, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span aria-hidden="true">⚠</span>
                {photoError}
              </p>
            )}
          </div>

          {/* ── Divider ──────────────────────────────────────────────── */}
          <div
            aria-hidden="true"
            style={{ height: '1px', background: T.border, marginBottom: '24px' }}
          />

          {/* ── Full Name ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor={`${uid}-name`} style={labelStyleFn()}>
              பூரண பெயர்
              <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
            </label>
            <input
              id={`${uid}-name`}
              type="text"
              autoComplete="name"
              placeholder="உங்கள் பூரண பெயர்"
              value={name}
              disabled={isLoading}
              aria-invalid={!!nameErr}
              aria-describedby={nameErr ? `${uid}-name-err` : undefined}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value);
                if (nameErr) setNameErr(validateName(e.target.value));
                onClearServerError?.();
              }}
              onFocus={() => setNameFocused(true)}
              onBlur={() => {
                setNameFocused(false);
                setNameErr(validateName(name));
              }}
              style={inputStyleFn(nameFocused, !!nameErr)}
            />
            <FieldError msg={nameErr} id={`${uid}-name-err`} />
          </div>

          {/* ── Mobile Number ─────────────────────────────────────────── */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '7px' }}>
              <label htmlFor={`${uid}-mobile`} style={{ ...labelStyleFn(), marginBottom: 0 }}>
                மொபைல் எண்
                {!mobileLocked && <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>}
              </label>
              {mobileLocked && (
                <span
                  style={{
                    display:      'inline-flex',
                    alignItems:   'center',
                    gap:          '4px',
                    padding:      '2px 8px',
                    background:   'rgba(61,122,85,0.09)',
                    border:       '1px solid rgba(61,122,85,0.20)',
                    borderRadius: '100px',
                    fontFamily:   FONT.body,
                    fontSize:     '0.72rem',
                    fontWeight:   700,
                    color:        T.leaf,
                  }}
                >
                  <VerifyCheckIcon /> சரிபார்க்கப்பட்டது
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* +91 chip */}
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
                  disabled={isLoading || mobileLocked}
                  readOnly={mobileLocked}
                  aria-invalid={!!mobileErr}
                  aria-describedby={mobileErr ? `${uid}-mobile-err` : undefined}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (mobileLocked) return;
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobile(val);
                    if (mobileErr) setMobileErr(validateMobile(val, false));
                    onClearServerError?.();
                  }}
                  onFocus={() => setMobileFocused(true)}
                  onBlur={() => {
                    setMobileFocused(false);
                    if (!mobileLocked) setMobileErr(validateMobile(mobile, false));
                  }}
                  style={{
                    ...inputStyleFn(mobileFocused, !!mobileErr),
                    letterSpacing: '0.08em',
                    opacity:       mobileLocked ? 0.7 : 1,
                    cursor:        mobileLocked ? 'not-allowed' : 'text',
                  }}
                />
              </div>
            </div>
            {mobileLocked && (
              <p style={{ margin: '5px 0 0', fontFamily: FONT.body, fontSize: '0.74rem', color: T.muted, lineHeight: 1.4 }}>
                சரிபார்க்கப்பட்ட மொபைல் எண்ணை மாற்ற ஆதரவை தொடர்பு கொள்ளவும்.
              </p>
            )}
            <FieldError msg={mobileErr} id={`${uid}-mobile-err`} />
          </div>

          {/* ── Email ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '28px' }}>
            <label htmlFor={`${uid}-email`} style={labelStyleFn()}>
              மின்னஞ்சல்{' '}
              <span style={{ color: T.muted, fontWeight: 400, fontSize: '0.75rem' }}>(விருப்பமானது)</span>
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
              style={inputStyleFn(emailFocused, !!emailErr)}
            />
            <FieldError msg={emailErr} id={`${uid}-email-err`} />
          </div>

          {/* ── Actions row ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Cancel */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                flex:         '1 1 120px',
                padding:      '13px 20px',
                border:       `1.5px solid var(--vt-border)`,
                borderRadius: '14px',
                background:   'transparent',
                cursor:       saving ? 'not-allowed' : 'pointer',
                fontFamily:   FONT.display,
                fontSize:     '0.94rem',
                fontWeight:   700,
                color:        'var(--vt-muted)',
                transition:   'all 0.15s',
                opacity:      saving ? 0.5 : 1,
              }}
            >
              ரத்து செய்
            </button>

            {/* Save */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex:           '2 1 180px',
                padding:        '13px 24px',
                border:         'none',
                borderRadius:   '14px',
                cursor:         isLoading ? 'not-allowed' : 'pointer',
                background:     isLoading
                  ? T.muted
                  : `linear-gradient(135deg, ${T.forestPrimary} 0%, #1E472E 60%, ${T.leaf} 100%)`,
                color:          '#fff',
                fontFamily:     FONT.display,
                fontSize:       '0.94rem',
                fontWeight:     700,
                letterSpacing:  '0.02em',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
                boxShadow:      isLoading ? 'none' : '0 4px 14px rgba(26,58,42,0.26)',
                transition:     'opacity 0.2s, box-shadow 0.2s',
                opacity:        isLoading ? 0.7 : 1,
              }}
            >
              {saving ? (
                <><Spinner /><span>சேமிக்கிறோம்...</span></>
              ) : (
                <><span aria-hidden="true">✓</span><span>மாற்றங்களை சேமி</span></>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes vt-epf-spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M12.5 2.5l3 3L5 16H2v-3L12.5 2.5z"
        stroke={T.goldPale} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CameraSmIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={T.goldPale} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4" stroke={T.goldPale} strokeWidth="1.6"/>
    </svg>
  );
}

function VerifyCheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke={T.leaf} strokeWidth="1.3"/>
      <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke={T.leaf} strokeWidth="1.3"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
