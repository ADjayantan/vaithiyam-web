'use client';

import { FontAwesomeIcon }  from '@fortawesome/react-fontawesome';
import {
  faClipboardList, faTruck, faCircleCheck, faBan,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/**
 * apps/web/components/orders/OrderFilters.tsx
 *
 * Vaithiyam — Order Filters Bar
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Horizontally scrollable status pill tabs
 *       All Orders / Active Orders / Delivered / Cancelled
 *   • Time-range selector (dropdown)
 *       Last 30 Days / Last 3 Months / Last 6 Months / Last 1 Year
 *   • Total result count display (next to "All" tab)
 *   • Controlled component — all state owned by parent
 *   • Smooth scroll-snap on mobile for status tabs
 *   • Active pill uses forest-gradient fill
 *   • Fully accessible: role="tablist", aria-selected, aria-label
 *
 * ─── Types exported ────────────────────────────────────────────────────────────
 *   StatusFilter       — 'all' | 'active' | 'delivered' | 'cancelled'
 *   TimeFilter         — '30d' | '3m' | '6m' | '1y'
 *   OrderFiltersState  — { status, timeRange }
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See OrderFiltersProps below.
 */

// ─── Design tokens ────────────────────────────────────────────────────────────
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
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export type StatusFilter = 'all' | 'active' | 'delivered' | 'cancelled';
export type TimeFilter   = '30d' | '3m' | '6m' | '1y';

export interface OrderFiltersState {
  status:    StatusFilter;
  timeRange: TimeFilter;
}

export interface OrderFiltersProps {
  filters:      OrderFiltersState;
  onChange:     (next: OrderFiltersState) => void;
  /** Total order count — shown next to "அனைத்தும்" tab */
  totalCount?:  number;
  /** Disable all controls while list is loading */
  disabled?:    boolean;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
interface TabDef {
  value:   StatusFilter;
  labelTa: string;
  icon:    IconDefinition;
}

const STATUS_TABS: TabDef[] = [
  { value: 'all',       labelTa: 'அனைத்தும்',    icon: faClipboardList },
  { value: 'active',    labelTa: 'செயலில் உள்ள', icon: faTruck         },
  { value: 'delivered', labelTa: 'டெலிவரி',      icon: faCircleCheck   },
  { value: 'cancelled', labelTa: 'ரத்து',         icon: faBan           },
];

// ─── Time-range options ───────────────────────────────────────────────────────
interface TimeDef {
  value:   TimeFilter;
  labelTa: string;
}

const TIME_OPTIONS: TimeDef[] = [
  { value: '30d', labelTa: 'கடந்த 30 நாட்கள்' },
  { value: '3m',  labelTa: 'கடந்த 3 மாதங்கள்' },
  { value: '6m',  labelTa: 'கடந்த 6 மாதங்கள்' },
  { value: '1y',  labelTa: 'கடந்த 1 ஆண்டு'    },
];

// ─── Active tab colours per status ───────────────────────────────────────────
const TAB_ACTIVE_STYLE: Record<StatusFilter, { bg: string; color: string; border: string }> = {
  all:       { bg: `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`, color: '#FFFFFF', border: 'transparent' },
  active:    { bg: `linear-gradient(135deg, ${T.saffron} 0%, #C9692A 100%)`,         color: '#FFFFFF', border: 'transparent' },
  delivered: { bg: `linear-gradient(135deg, ${T.leaf} 0%, #2D6B45 100%)`,            color: '#FFFFFF', border: 'transparent' },
  cancelled: { bg: `linear-gradient(135deg, ${T.terracotta} 0%, #7A2E25 100%)`,      color: '#FFFFFF', border: 'transparent' },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderFilters({
  filters,
  onChange,
  totalCount,
  disabled = false,
}: OrderFiltersProps) {
  const setStatus = (status: StatusFilter) =>
    onChange({ ...filters, status });

  const setTimeRange = (timeRange: TimeFilter) =>
    onChange({ ...filters, timeRange });

  return (
    <div
      role="group"
      aria-label="ஆர்டர் வடிகட்டிகள்"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* ── Status tab row ───────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="ஆர்டர் நிலை வடிகட்டி"
        style={{
          display:         'flex',
          gap:             '8px',
          overflowX:       'auto',
          scrollSnapType:  'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom:   '2px',   // space for focus ring
          // Hide scrollbar cross-browser
          scrollbarWidth:  'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`
          [data-vt-tabs]::-webkit-scrollbar { display: none; }
        `}</style>

        {STATUS_TABS.map((tab) => {
          const isActive = filters.status === tab.value;
          const activeStyle = TAB_ACTIVE_STYLE[tab.value];

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`${tab.labelTa} ஆர்டர்கள்${tab.value === 'all' && totalCount !== undefined ? ` (${totalCount})` : ''}`}
              onClick={() => !disabled && setStatus(tab.value)}
              disabled={disabled}
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '5px',
                padding:        '8px 14px',
                borderRadius:   '100px',
                border:         isActive ? '1.5px solid transparent' : `1.5px solid var(--vt-border)`,
                background:     isActive ? activeStyle.bg : 'rgba(13,34,24,0.35)',
                color:          isActive ? activeStyle.color : T.secondaryText,
                fontFamily:     FONT.display,
                fontSize:       '0.82rem',
                fontWeight:     isActive ? 700 : 600,
                cursor:         disabled ? 'not-allowed' : 'pointer',
                whiteSpace:     'nowrap',
                flexShrink:     0,
                scrollSnapAlign:'start',
                transition:     'all 0.15s ease',
                boxShadow:      isActive ? '0 2px 8px rgba(26,58,42,0.18)' : 'none',
                opacity:        disabled ? 0.6 : 1,
                letterSpacing:  '0.01em',
                outline:        'none',
              }}
            >
              <span aria-hidden="true" style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={tab.icon} style={{ width: 12, height: 12 }} />
              </span>
              <span>{tab.labelTa}</span>

              {/* Count badge — only for "all" tab */}
              {tab.value === 'all' && totalCount !== undefined && totalCount > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    minWidth:       '18px',
                    height:         '18px',
                    padding:        '0 5px',
                    borderRadius:   '100px',
                    background:     isActive
                      ? 'rgba(255,255,255,0.25)'
                      : 'rgba(61,138,92,0.18)',
                    color:          isActive ? '#FFFFFF' : 'var(--vt-gold-300)',
                    fontFamily:     FONT.display,
                    fontSize:       '0.68rem',
                    fontWeight:     700,
                    display:        'inline-flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    lineHeight:     1,
                  }}
                >
                  {totalCount > 999 ? '999+' : totalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Time-range row ───────────────────────────────────────────────── */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '10px',
        }}
      >
        {/* Calendar icon */}
        <span aria-hidden="true" style={{ fontSize: '0.9rem', flexShrink: 0 }}>📅</span>

        {/* Select */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: '260px' }}>
          <select
            id="vt-order-time-range"
            value={filters.timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeFilter)}
            disabled={disabled}
            aria-label="நேர வரம்பு வடிகட்டி"
            style={{
              width:           '100%',
              height:          '38px',
              padding:         '0 32px 0 12px',
              border:          `1.5px solid var(--vt-border)`,
              borderRadius:    '10px',
              background:      'rgba(13,34,24,0.35)',
              color:           T.darkText,
              fontFamily:      FONT.display,
              fontSize:        '0.82rem',
              fontWeight:      600,
              cursor:          disabled ? 'not-allowed' : 'pointer',
              appearance:      'none',
              WebkitAppearance:'none',
              outline:         'none',
              opacity:         disabled ? 0.6 : 1,
              transition:      'border-color 0.15s',
            }}
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.labelTa}
              </option>
            ))}
          </select>

          {/* Custom chevron */}
          <span
            aria-hidden="true"
            style={{
              position:       'absolute',
              right:          '10px',
              top:            '50%',
              transform:      'translateY(-50%)',
              pointerEvents:  'none',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* Current selection label (screen-reader supplement) */}
        <span className="sr-only" aria-live="polite">
          {TIME_OPTIONS.find((o) => o.value === filters.timeRange)?.labelTa}
        </span>
      </div>

      {/* ── Active filter summary chip (shown when not defaults) ──────────── */}
      {(filters.status !== 'all' || filters.timeRange !== '30d') && (
        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '6px',
            flexWrap:   'wrap',
          }}
        >
          {filters.status !== 'all' && (
            <FilterChip
              label={STATUS_TABS.find((t) => t.value === filters.status)?.labelTa ?? ''}
              onRemove={() => setStatus('all')}
              disabled={disabled}
            />
          )}
          {filters.timeRange !== '30d' && (
            <FilterChip
              label={TIME_OPTIONS.find((o) => o.value === filters.timeRange)?.labelTa ?? ''}
              onRemove={() => setTimeRange('30d')}
              disabled={disabled}
            />
          )}

          {/* Clear all */}
          {(filters.status !== 'all' || filters.timeRange !== '30d') && (
            <button
              type="button"
              onClick={() => onChange({ status: 'all', timeRange: '30d' })}
              disabled={disabled}
              aria-label="அனைத்து வடிகட்டிகளையும் அகற்று"
              style={{
                background: 'none',
                border:     'none',
                padding:    '2px 4px',
                cursor:     disabled ? 'not-allowed' : 'pointer',
                fontFamily: FONT.body,
                fontSize:   '0.74rem',
                color:      T.muted,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              அனைத்தும் அகற்று
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Filter chip sub-component ────────────────────────────────────────────────
function FilterChip({
  label,
  onRemove,
  disabled = false,
}: {
  label:     string;
  onRemove:  () => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '5px',
        padding:      '3px 8px 3px 10px',
        borderRadius: '100px',
        background:   'rgba(61,138,92,0.12)',
        border:       '1px solid var(--vt-border)',
      }}
    >
      <span
        style={{
          fontFamily: FONT.display,
          fontSize:   '0.74rem',
          fontWeight: 600,
          color:      'var(--vt-gold-300)',
        }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`${label} வடிகட்டி அகற்று`}
        style={{
          background:  'none',
          border:      'none',
          padding:     '0 2px',
          cursor:      disabled ? 'not-allowed' : 'pointer',
          lineHeight:  1,
          color:       T.muted,
          fontSize:    '0.9rem',
          flexShrink:  0,
          display:     'flex',
          alignItems:  'center',
        }}
      >
        ×
      </button>
    </div>
  );
}
