'use client';

/**
 * apps/web/components/account/AddressCard.tsx
 *
 * Vaithiyam — Address Card
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Full address display (name · mobile · line1 · line2 · city, state – pincode)
 *   • Address type badge: Home 🏠 / Work 💼 / Other 📍 (with custom label)
 *   • Default address gold star badge
 *   • Edit button (pencil icon)
 *   • Delete button — shows inline Tamil confirm prompt before firing onDelete
 *   • "இயல்புநிலையாக அமை" CTA when address is not default
 *   • Deleting state: spinner overlay on confirm button
 *   • Mobile-responsive layout
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See AddressCardProps below.
 */

import { useState, useCallback }  from 'react';
import { FontAwesomeIcon }        from '@fortawesome/react-fontawesome';
import { faHouse, faBriefcase, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition }    from '@fortawesome/fontawesome-svg-core';

// ─── Design tokens ─────────────────────────────────────────────────────────────
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
export type AddressType = 'home' | 'work' | 'other';

export interface Address {
  id:        string;
  type:      AddressType;
  label?:    string;      // Custom label when type = 'other'
  fullName:  string;
  mobile:    string;      // 10-digit
  line1:     string;
  line2?:    string;
  city:      string;
  state:     string;
  pincode:   string;
  isDefault: boolean;
}

export interface AddressCardProps {
  address:       Address;
  onEdit:        (address: Address) => void;
  onDelete:      (id: string) => Promise<void>;
  onSetDefault:  (id: string) => Promise<void>;
  /** Disable all actions (e.g. while parent is loading) */
  disabled?:     boolean;
}

// ─── Address type config ────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<AddressType, { labelTa: string; icon: IconDefinition; color: string; bg: string }> = {
  home:  { labelTa: 'வீடு',    icon: faHouse,       color: T.forestPrimary, bg: 'rgba(26,58,42,0.09)' },
  work:  { labelTa: 'அலுவலகம்', icon: faBriefcase,   color: T.gold,          bg: 'rgba(201,146,42,0.09)' },
  other: { labelTa: 'பிற',      icon: faLocationDot, color: T.saffron,       bg: 'rgba(224,123,57,0.09)' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function formatMobile(m: string): string {
  const d = m.replace(/\D/g, '');
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return m;
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function Spinner({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ animation: 'vt-ac-spin 0.75s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.28)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  disabled = false,
}: AddressCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [settingDef,    setSettingDef]    = useState(false);

  const typeConf  = TYPE_CONFIG[address.type];
  const typeLabel = address.type === 'other' && address.label
    ? address.label
    : typeConf.labelTa;

  const isLocked = disabled || deleting || settingDef;

  // ── Delete flow ─────────────────────────────────────────────────────────────
  const handleDeleteRequest = useCallback(() => {
    if (isLocked) return;
    setConfirmDelete(true);
  }, [isLocked]);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete(address.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [deleting, onDelete, address.id]);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDelete(false);
  }, []);

  // ── Set default ─────────────────────────────────────────────────────────────
  const handleSetDefault = useCallback(async () => {
    if (isLocked || address.isDefault) return;
    setSettingDef(true);
    try {
      await onSetDefault(address.id);
    } finally {
      setSettingDef(false);
    }
  }, [isLocked, address.isDefault, onSetDefault, address.id]);

  return (
    <article
      aria-label={`${typeLabel} முகவரி${address.isDefault ? ' - இயல்புநிலை' : ''}`}
      style={{
        background:   'var(--vt-card)',
        border:       `1.5px solid ${address.isDefault ? 'rgba(212,137,10,0.35)' : T.border}`,
        borderRadius: '18px',
        overflow:     'hidden',
        boxShadow:    address.isDefault
          ? 'var(--vt-shadow-gold)'
          : 'var(--vt-shadow-xs)',
        transition:   'box-shadow 0.2s, border-color 0.2s',
        position:     'relative',
      }}
    >
      {/* ── Top accent bar ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height:     '4px',
          background: address.isDefault
            ? `linear-gradient(90deg, ${T.gold} 0%, ${T.goldPale} 100%)`
            : `linear-gradient(90deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
        }}
      />

      <div style={{ padding: '16px 18px' }}>

        {/* ── Header row: badges + actions ────────────────────────────── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            '10px',
            marginBottom:   '14px',
            flexWrap:       'wrap',
          }}
        >
          {/* Badges group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Type badge */}
            <span
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '5px',
                padding:      '4px 10px',
                background:   typeConf.bg,
                border:       `1px solid ${typeConf.color}33`,
                borderRadius: '100px',
                fontFamily:   FONT.display,
                fontSize:     '0.76rem',
                fontWeight:   700,
                color:        typeConf.color,
                whiteSpace:   'nowrap',
              }}
            >
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={typeConf.icon} style={{ width: 13, height: 13, color: typeConf.color }} />
              </span>
              {typeLabel}
            </span>

            {/* Default badge */}
            {address.isDefault && (
              <span
                aria-label="இயல்புநிலை முகவரி"
                style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          '4px',
                  padding:      '4px 10px',
                  background:   'rgba(201,146,42,0.10)',
                  border:       `1px solid rgba(201,146,42,0.30)`,
                  borderRadius: '100px',
                  fontFamily:   FONT.display,
                  fontSize:     '0.72rem',
                  fontWeight:   700,
                  color:        T.gold,
                  whiteSpace:   'nowrap',
                }}
              >
                <StarIcon />
                இயல்புநிலை
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Edit */}
            <button
              type="button"
              onClick={() => !isLocked && onEdit(address)}
              disabled={isLocked}
              aria-label="முகவரி திருத்து"
              style={{
                width:          '34px',
                height:         '34px',
                borderRadius:   '10px',
                border:         `1.5px solid var(--vt-border)`,
                background:     'rgba(61,138,92,0.12)',
                cursor:         isLocked ? 'not-allowed' : 'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'all 0.15s',
                opacity:        isLocked ? 0.5 : 1,
                flexShrink:     0,
              }}
            >
              <EditPenIcon />
            </button>

            {/* Delete */}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={handleDeleteRequest}
                disabled={isLocked}
                aria-label="முகவரி நீக்கு"
                style={{
                  width:          '34px',
                  height:         '34px',
                  borderRadius:   '10px',
                  border:         `1.5px solid rgba(249,92,56,0.16)`,
                  background:     'rgba(249,92,56,0.12)',
                  cursor:         isLocked ? 'not-allowed' : 'pointer',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  transition:     'all 0.15s',
                  opacity:        isLocked ? 0.5 : 1,
                  flexShrink:     0,
                }}
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Delete confirm banner ─────────────────────────────────── */}
        {confirmDelete && (
          <div
            role="alert"
            style={{
              background:   'rgba(249,92,56,0.08)',
              border:       `1px solid rgba(249,92,56,0.22)`,
              borderRadius: '12px',
              padding:      '12px 14px',
              marginBottom: '14px',
            }}
          >
            <p
              style={{
                fontFamily:   FONT.display,
                fontSize:     '0.84rem',
                fontWeight:   700,
                color:        T.terracotta,
                margin:       '0 0 10px',
                lineHeight:   1.45,
              }}
            >
              🗑 இந்த முகவரியை நீக்கவா?
            </p>
            <p style={{ fontFamily: FONT.body, fontSize: '0.78rem', color: T.secondaryText, margin: '0 0 12px', lineHeight: 1.5 }}>
              இந்த நடவடிக்கை மாற்ற முடியாதது.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={deleting}
                style={{
                  flex:         1,
                  padding:      '8px 14px',
                  border:       `1.5px solid var(--vt-border)`,
                  borderRadius: '10px',
                  background:   'transparent',
                  cursor:       deleting ? 'not-allowed' : 'pointer',
                  fontFamily:   FONT.display,
                  fontSize:     '0.82rem',
                  fontWeight:   600,
                  color:        T.secondaryText,
                  opacity:      deleting ? 0.5 : 1,
                }}
              >
                ரத்து
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  flex:           1,
                  padding:        '8px 14px',
                  border:         'none',
                  borderRadius:   '10px',
                  background:     T.terracotta,
                  cursor:         deleting ? 'not-allowed' : 'pointer',
                  fontFamily:     FONT.display,
                  fontSize:       '0.82rem',
                  fontWeight:     700,
                  color:          '#fff',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            '6px',
                  opacity:        deleting ? 0.8 : 1,
                }}
              >
                {deleting ? <><Spinner color="#fff" /> நீக்குகிறோம்...</> : '🗑 நீக்கு'}
              </button>
            </div>
          </div>
        )}

        {/* ── Address body ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

          {/* Name */}
          <p
            style={{
              fontFamily:  FONT.display,
              fontSize:    '0.96rem',
              fontWeight:  700,
              color:       T.darkText,
              margin:      0,
              lineHeight:  1.3,
            }}
          >
            {address.fullName}
          </p>

          {/* Mobile */}
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '0.84rem',
              color:      T.secondaryText,
              margin:     0,
              lineHeight: 1.4,
              display:    'flex',
              alignItems: 'center',
              gap:        '6px',
            }}
          >
            <PhoneSmIcon />
            {formatMobile(address.mobile)}
          </p>

          {/* Address lines */}
          <div
            style={{
              fontFamily:  FONT.body,
              fontSize:    '0.86rem',
              color:       T.secondaryText,
              lineHeight:  1.6,
              marginTop:   '2px',
            }}
          >
            <p style={{ margin: 0 }}>{address.line1}</p>
            {address.line2 && <p style={{ margin: 0 }}>{address.line2}</p>}
            <p style={{ margin: 0 }}>
              {address.city}, {address.state} – {address.pincode}
            </p>
          </div>
        </div>

        {/* ── Set default CTA ───────────────────────────────────────── */}
        {!address.isDefault && !confirmDelete && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px dashed ${T.border}` }}>
            <button
              type="button"
              onClick={handleSetDefault}
              disabled={isLocked}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '6px',
                padding:        '7px 14px',
                border:         `1.5px dashed rgba(212,137,10,0.40)`,
                borderRadius:   '100px',
                background:     'rgba(212,137,10,0.08)',
                cursor:         isLocked ? 'not-allowed' : 'pointer',
                fontFamily:     FONT.display,
                fontSize:       '0.78rem',
                fontWeight:     700,
                color:          T.gold,
                transition:     'all 0.15s',
                opacity:        isLocked ? 0.6 : 1,
              }}
            >
              {settingDef ? (
                <><Spinner color={T.gold} /> அமைக்கிறோம்...</>
              ) : (
                <><StarOutlineIcon /> இயல்புநிலையாக அமை</>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes vt-ac-spin { to { transform: rotate(360deg); } }
      `}</style>
    </article>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" fill={T.gold} aria-hidden="true">
      <path d="M7 1l1.5 4h4l-3.3 2.4 1.3 4L7 9 3.5 11.4l1.3-4L1.5 5h4z"/>
    </svg>
  );
}

function StarOutlineIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke={T.gold} strokeWidth="1.4" aria-hidden="true">
      <path d="M7 1l1.5 4h4l-3.3 2.4 1.3 4L7 9 3.5 11.4l1.3-4L1.5 5h4z" strokeLinejoin="round"/>
    </svg>
  );
}

function EditPenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M12.5 2.5l3 3L5 16H2v-3L12.5 2.5z"
        stroke={T.forestPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <polyline points="1 4 3 4 17 4" stroke={T.terracotta} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 4l-1 12H4L3 4" stroke={T.terracotta} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 4V2h6v2" stroke={T.terracotta} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PhoneSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 3.5C3 3.2 3.3 3 3.5 3H6l1 3-1.5 1c.8 1.6 2 2.8 3.5 3.5L10.5 9l3 1V12.5c0 .3-.2.5-.5.5C7 13.5 3 9.5 3 5.5V3.5z"
        stroke={T.secondaryText} strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
