'use client';

/**
 * apps/web/components/account/ProfileCard.tsx
 *
 * Vaithiyam — User Profile Card
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Circular avatar with profile photo or generated initials fallback
 *   • Camera-overlay button to trigger photo change (via onPhotoChange)
 *   • Name, mobile, email display rows
 *   • "உறுப்பினர் தொடங்கிய தேதி" member-since badge
 *   • "சுயவிவரம் திருத்து" edit CTA
 *   • Verification badges (phone verified / email verified)
 *   • Graceful empty states for missing mobile / email
 */

import { useState } from 'react';

// ─── Design tokens (mirrors all existing Vaithiyam modules exactly) ────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id:               string;
  name:             string;
  mobile?:          string;
  email?:           string;
  photoUrl?:        string;
  createdAt?:       string;
  mobileVerified?:  boolean;
  emailVerified?:   boolean;
}

export interface ProfileCardProps {
  user:            UserProfile;
  /** Triggers edit-profile mode in parent */
  onEdit:          () => void;
  /** Triggers photo upload — parent opens file picker and calls back */
  onPhotoChange?:  () => void;
  uploading?:      boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function fmtMemberSince(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('ta-IN', {
      month: 'long',
      year:  'numeric',
    });
  } catch {
    return '';
  }
}

function maskMobile(mobile?: string): string {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length !== 10) return mobile;
  return `+91 ${digits.slice(0, 2)}••••${digits.slice(6)}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileCard({
  user,
  onEdit,
  onPhotoChange,
  uploading = false,
}: ProfileCardProps) {
  const [avatarHover, setAvatarHover] = useState(false);

  const initials    = getInitials(user.name);
  const memberSince = fmtMemberSince(user.createdAt);
  const maskedPhone = maskMobile(user.mobile);

  return (
    <section
      aria-label="சுயவிவர தகவல்"
      style={{
        background:   'var(--vt-card)',
        border:       `1px solid var(--vt-border)`,
        borderRadius: '24px',
        overflow:     'hidden',
        boxShadow:    'var(--vt-shadow-sm)',
      }}
    >
      {/* ── Gradient header band ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height:     '72px',
          background: `linear-gradient(135deg, ${T.forestPrimary} 0%, #1E472E 60%, ${T.leaf} 100%)`,
          position:   'relative',
        }}
      >
        {/* Dot-pattern texture */}
        <div
          style={{
            position:        'absolute',
            inset:           0,
            backgroundImage: 'radial-gradient(circle, rgba(240,201,110,0.14) 1.5px, transparent 1.5px)',
            backgroundSize:  '20px 20px',
          }}
        />
      </div>

      {/* ── Avatar + info ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 24px 24px' }}>

        {/* Avatar — sits across the header/content boundary */}
        <div
          style={{
            marginTop:      '-46px',
            marginBottom:   '16px',
            display:        'flex',
            alignItems:     'flex-end',
            justifyContent: 'space-between',
          }}
        >
          {/* Photo circle */}
          <div
            role={onPhotoChange ? 'button' : undefined}
            tabIndex={onPhotoChange ? 0 : undefined}
            aria-label={onPhotoChange ? 'சுயவிவர புகைப்படம் மாற்று' : undefined}
            onClick={onPhotoChange}
            onKeyDown={(e) => e.key === 'Enter' && onPhotoChange?.()}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            style={{
              width:          '88px',
              height:         '88px',
              borderRadius:   '16px',
              border:         `3px solid var(--vt-border-strong)`,
              boxShadow:      '0 2px 12px rgba(0,0,0,0.14)',
              overflow:       'hidden',
              position:       'relative',
              cursor:         onPhotoChange ? 'pointer' : 'default',
              flexShrink:     0,
              background:     user.photoUrl
                ? 'transparent'
                : `linear-gradient(135deg, #c9922a, #a8761a)`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              transition:     'box-shadow 0.2s ease',
            }}
          >
            {user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoUrl}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                aria-hidden="true"
                style={{
                  fontFamily:  FONT.serif,
                  fontSize:    '32px',
                  fontWeight:  700,
                  color:       '#ffffff',
                  lineHeight:  1,
                  userSelect:  'none',
                }}
              >
                {initials || '?'}
              </span>
            )}

            {/* Camera overlay on hover / uploading */}
            {onPhotoChange && (avatarHover || uploading) && (
              <div
                aria-hidden="true"
                style={{
                  position:        'absolute',
                  inset:           0,
                  background:      'rgba(3,12,7,0.75)',
                  display:         'flex',
                  flexDirection:   'column',
                  alignItems:      'center',
                  justifyContent:  'center',
                  gap:             '4px',
                  transition:      'opacity 0.18s ease',
                }}
              >
                {uploading ? (
                  <SpinnerIcon color={T.goldPale} size={20} />
                ) : (
                  <>
                    <CameraIcon color={T.goldPale} />
                    <span
                      style={{
                        fontFamily: FONT.body,
                        fontSize:   '9px',
                        color:      T.goldPale,
                        fontWeight: 600,
                        textAlign:  'center',
                        lineHeight: 1.2,
                      }}
                    >
                      மாற்று
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Edit button — top-right of the info area */}
          <button
            type="button"
            onClick={onEdit}
            aria-label="சுயவிவரம் திருத்து"
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '9px 18px',
              borderRadius:   '100px',
              border:         `1.5px solid var(--vt-gold-300)`,
              background:     'transparent',
              cursor:         'pointer',
              fontFamily:     FONT.display,
              fontSize:       '13px',
              fontWeight:     700,
              color:          'var(--vt-gold-300)',
              transition:     'all 0.16s ease',
              marginBottom:   '2px',
            }}
          >
            <EditPenIcon />
            திருத்து
          </button>
        </div>

        {/* Name */}
        <h2
          style={{
            fontFamily:  FONT.serif,
            fontSize:    'clamp(20px, 5vw, 24px)',
            fontWeight:  700,
            color:       'var(--vt-cream-50)',
            margin:      '0 0 16px',
            lineHeight:  1.2,
          }}
        >
          {user.name}
        </h2>

        {/* Info rows */}
        <div
          style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           '0',
            background:    T.creamBase,
            border:        `1px solid ${T.border}`,
            borderRadius:  '16px',
            overflow:      'hidden',
          }}
        >
          {/* Mobile row */}
          <InfoRow
            icon={<PhoneIcon />}
            labelTa="மொபைல் எண்"
            value={maskedPhone || undefined}
            emptyTa="மொபைல் சேர்க்கப்படவில்லை"
            verified={user.mobileVerified}
            showDivider={false}
          />

          {/* Divider */}
          <div aria-hidden="true" style={{ height: '1px', background: T.border, margin: '0 16px' }} />

          {/* Email row */}
          <InfoRow
            icon={<MailIcon />}
            labelTa="மின்னஞ்சல்"
            value={user.email || undefined}
            emptyTa="மின்னஞ்சல் சேர்க்கப்படவில்லை"
            verified={user.emailVerified}
            showDivider={false}
          />
        </div>
      </div>

      <style>{`
        @keyframes vt-pc-spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  labelTa,
  value,
  emptyTa,
  verified,
  showDivider,
}: {
  icon:        React.ReactNode;
  labelTa:     string;
  value?:      string;
  emptyTa:     string;
  verified?:   boolean;
  showDivider: boolean;
}) {
  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
        padding:      '14px 16px',
        borderBottom: showDivider ? `1px solid ${T.border}` : 'none',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width:          '34px',
          height:         '34px',
          borderRadius:   '10px',
          background:     'rgba(61,138,92,0.15)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily:  FONT.body,
            fontSize:    '10px',
            color:       T.muted,
            margin:      '0 0 2px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight:  1.3,
          }}
        >
          {labelTa}
        </p>
        <p
          style={{
            fontFamily:  FONT.display,
            fontSize:    '14px',
            fontWeight:  value ? 600 : 400,
            color:       value ? T.darkText : T.muted,
            margin:      0,
            lineHeight:  1.35,
            overflow:    'hidden',
            textOverflow:'ellipsis',
            whiteSpace:  'nowrap',
            fontStyle:   value ? 'normal' : 'italic',
          }}
        >
          {value ?? emptyTa}
        </p>
      </div>

      {/* Verified badge */}
      {verified && value && (
        <span
          aria-label="சரிபார்க்கப்பட்டது"
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '4px',
            padding:      '3px 8px',
            background:   'rgba(61,122,85,0.10)',
            border:       '1px solid rgba(61,122,85,0.22)',
            borderRadius: '100px',
            fontFamily:   FONT.body,
            fontSize:     '10px',
            fontWeight:   700,
            color:        T.leaf,
            whiteSpace:   'nowrap',
            flexShrink:   0,
            lineHeight:   1.5,
          }}
        >
          <VerifiedIcon />
          சரிபார்க்கப்பட்டது
        </span>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CameraIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function EditPenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M12.5 2.5l3 3L5 16H2v-3L12.5 2.5z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 3.5C3 3.2 3.3 3 3.5 3H6l1 3-1.5 1c.8 1.6 2 2.8 3.5 3.5L10.5 9l3 1V12.5c0 .3-.2.5-.5.5C7 13.5 3 9.5 3 5.5V3.5z"
        stroke="var(--vt-gold-300)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="var(--vt-gold-300)" strokeWidth="1.4" />
      <path d="M2 6l7 5 7-5" stroke="var(--vt-gold-300)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke={T.leaf} strokeWidth="1.3" />
      <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke={T.leaf} strokeWidth="1.3"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ animation: 'vt-pc-spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
