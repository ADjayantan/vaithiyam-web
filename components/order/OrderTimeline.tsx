'use client';

/**
 * apps/web/components/order/OrderTimeline.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Order Progress Timeline
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Statuses (in progression order) ──────────────────────────────────────────
 *   placed → confirmed → packed → shipped → out_for_delivery → delivered
 *   Special: cancelled (shown as a standalone banner)
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Vertical progress tracker with completed / active / upcoming states
 *   • Animated SVG checkmark draw-in on completed steps
 *   • Animated pulse ring on the current active step
 *   • Per-step timestamps sourced from statusHistory prop
 *   • Estimated delivery callout badge (hidden after delivery)
 *   • Delivered celebration banner
 *   • Cancelled card with refund note
 *   • Mobile-first — works cleanly at 320 px+
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 *   import OrderTimeline from '@/components/order/OrderTimeline';
 *
 *   <OrderTimeline
 *     currentStatus="shipped"
 *     statusHistory={order.statusHistory}
 *     estimatedDelivery={order.estimatedDelivery}
 *     placedAt={order.placedAt}
 *   />
 */

import { useState, useEffect }  from 'react';
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome';
import {
  faCircleCheck, faLeaf, faBox, faTruck, faMotorcycle,
  faGift, faCircleXmark, faCalendarDays, faHandsPraying, faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition }  from '@fortawesome/fontawesome-svg-core';

// ─── Re-export so pages can import OrderStatus from here ──────────────────────
// (Definition mirrors apps/web/components/order/OrderSummary.tsx exactly)
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

// ─── Design tokens (mirrors checkout + Razorpay components exactly) ───────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StatusHistoryEntry {
  status:    OrderStatus;
  timestamp: string;
  note?:     string;
}

export interface OrderTimelineProps {
  /** The latest/current status of the order */
  currentStatus:      OrderStatus;
  /** Full history of status transitions with timestamps */
  statusHistory?:     StatusHistoryEntry[];
  /** ISO date string — shown in the callout banner */
  estimatedDelivery?: string;
  /** ISO date string of when order was first placed */
  placedAt?:          string;
}

// ─── Step definitions ─────────────────────────────────────────────────────────
interface TimelineStep {
  status:  OrderStatus;
  labelTa: string;
  labelEn: string;
  descTa:  string;
  icon:    IconDefinition;
}

const STEPS: ReadonlyArray<TimelineStep> = [
  {
    status:  'placed',
    labelTa: 'ஆர்டர் பதிவாயிற்று',
    labelEn: 'Order Placed',
    descTa:  'உங்கள் ஆர்டர் வெற்றிகரமாக பதிவாயிற்று',
    icon:    faCircleCheck,
  },
  {
    status:  'confirmed',
    labelTa: 'உறுதிப்படுத்தப்பட்டது',
    labelEn: 'Confirmed',
    descTa:  'உங்கள் ஆர்டர் உறுதிப்படுத்தப்பட்டது',
    icon:    faLeaf,
  },
  {
    status:  'packed',
    labelTa: 'பேக் செய்யப்பட்டது',
    labelEn: 'Packed',
    descTa:  'பொருட்கள் கவனமாக பேக் செய்யப்பட்டன',
    icon:    faBox,
  },
  {
    status:  'shipped',
    labelTa: 'அனுப்பப்பட்டது',
    labelEn: 'Shipped',
    descTa:  'உங்கள் பொருட்கள் பயணத்தில் உள்ளன',
    icon:    faTruck,
  },
  {
    status:  'out_for_delivery',
    labelTa: 'டெலிவரி வழியில்',
    labelEn: 'Out for Delivery',
    descTa:  'டெலிவரி பார்ட்னர் உங்கள் வழியில் உள்ளார்',
    icon:    faMotorcycle,
  },
  {
    status:  'delivered',
    labelTa: 'டெலிவரி செய்யப்பட்டது',
    labelEn: 'Delivered',
    descTa:  'ஆர்டர் வெற்றிகரமாக வழங்கப்பட்டது',
    icon:    faGift,
  },
] as const;

/** Ordinal index of each non-cancelled status */
const STATUS_IDX: Partial<Record<OrderStatus, number>> = {
  placed:           0,
  confirmed:        1,
  packed:           2,
  shipped:          3,
  out_for_delivery: 4,
  delivered:        5,
};

// ─── Status badge config ──────────────────────────────────────────────────────
const BADGE: Record<OrderStatus, { ta: string; bg: string; color: string; bd: string }> = {
  placed:           { ta: 'பதிவாயிற்று',     bg: 'rgba(201,146,42,0.10)',  color: T.gold,          bd: 'rgba(201,146,42,0.28)' },
  confirmed:        { ta: 'உறுதிப்பட்டது',   bg: 'rgba(61,122,85,0.10)',   color: T.leaf,          bd: 'rgba(61,122,85,0.28)'  },
  packed:           { ta: 'பேக் ஆயிற்று',     bg: 'rgba(26,58,42,0.08)',    color: T.forestPrimary, bd: 'rgba(26,58,42,0.22)'   },
  shipped:          { ta: 'அனுப்பப்பட்டது',   bg: 'rgba(224,123,57,0.10)', color: T.saffron,       bd: 'rgba(224,123,57,0.28)' },
  out_for_delivery: { ta: 'டெலிவரி வழியில்',  bg: 'rgba(224,123,57,0.15)', color: '#B85D1A',       bd: 'rgba(224,123,57,0.32)' },
  delivered:        { ta: 'டெலிவரி ஆயிற்று', bg: 'rgba(61,122,85,0.12)',   color: T.leaf,          bd: 'rgba(61,122,85,0.30)'  },
  cancelled:        { ta: 'ரத்து ஆயிற்று',   bg: 'rgba(139,58,47,0.10)',   color: T.terracotta,    bd: 'rgba(139,58,47,0.24)'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ta-IN', {
      day:    'numeric',
      month:  'short',
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function fmtDelivery(iso: string): string | null {
  try {
    return new Date(iso).toLocaleDateString('ta-IN', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
    });
  } catch {
    return null;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderTimeline({
  currentStatus,
  statusHistory,
  estimatedDelivery,
  placedAt,
}: OrderTimelineProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(id);
  }, []);

  // ── Cancelled state  ───────────────────────────────────────────────────────
  if (currentStatus === 'cancelled') {
    return <CancelledCard mounted={mounted} />;
  }

  const currentIdx          = STATUS_IDX[currentStatus] ?? 0;
  const deliveryFormatted   = estimatedDelivery ? fmtDelivery(estimatedDelivery) : null;
  const isDelivered         = currentStatus === 'delivered';
  const badge               = BADGE[currentStatus];

  // Build per-status timestamp lookup — prioritise statusHistory; fill placedAt
  const tsMap: Partial<Record<OrderStatus, string>> = {};
  if (placedAt) tsMap['placed'] = placedAt;
  if (statusHistory) {
    for (const entry of statusHistory) {
      if (entry.status !== 'cancelled' && !tsMap[entry.status]) {
        tsMap[entry.status] = entry.timestamp;
      }
    }
  }

  return (
    <section
      aria-label="ஆர்டர் கண்காணிப்பு"
      style={{
        background:   '#FFFFFF',
        border:       `1px solid ${T.border}`,
        borderRadius: '20px',
        overflow:     'hidden',
        boxShadow:    '0 2px 16px rgba(26,58,42,0.06)',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          PANEL HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '12px',
          padding:        '18px 20px',
          background:     'rgba(26,58,42,0.03)',
          borderBottom:   `1px solid rgba(221,208,184,0.50)`,
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrackIcon />
          <div>
            <h3
              style={{
                fontFamily: FONT.display,
                fontSize:   '17px',
                fontWeight: 700,
                color:      T.darkText,
                margin:     0,
                lineHeight: 1.3,
              }}
            >
              ஆர்டர் கண்காணிப்பு
            </h3>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '12px',
                color:      T.muted,
                margin:     '2px 0 0',
                lineHeight: 1.4,
              }}
            >
              Order Tracking
            </p>
          </div>
        </div>

        {/* Current status badge */}
        <span
          style={{
            fontFamily:    FONT.body,
            fontSize:      '11px',
            fontWeight:    700,
            background:    badge.bg,
            color:         badge.color,
            border:        `1px solid ${badge.bd}`,
            padding:       '4px 10px',
            borderRadius:  '100px',
            whiteSpace:    'nowrap',
            lineHeight:    1.5,
            letterSpacing: '0.02em',
            flexShrink:    0,
          }}
        >
          {badge.ta}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DELIVERY CALLOUTS (estimated / delivered)
      ══════════════════════════════════════════════════════════════════════ */}
      {isDelivered ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '12px',
            padding:      '14px 20px',
            background:   'rgba(61,122,85,0.05)',
            borderBottom: `1px solid rgba(61,122,85,0.14)`,
          }}
        >
          <span style={{ flexShrink: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
            <FontAwesomeIcon icon={faGift} style={{ width: 20, height: 20, color: T.leaf }} />
          </span>
          <p
            style={{
              fontFamily: FONT.display,
              fontSize:   '14px',
              fontWeight: 700,
              color:      T.leaf,
              margin:     0,
              lineHeight: 1.4,
            }}
          >
            உங்கள் ஆர்டர் வெற்றிகரமாக வழங்கப்பட்டது! நன்றி
          </p>
        </div>
      ) : deliveryFormatted ? (
        <div
          role="status"
          aria-label={`எதிர்பார்க்கப்படும் டெலிவரி ${deliveryFormatted}`}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '12px',
            padding:      '12px 20px',
            background:   'rgba(201,146,42,0.04)',
            borderBottom: `1px solid rgba(201,146,42,0.14)`,
          }}
        >
          <span style={{ flexShrink: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
            <FontAwesomeIcon icon={faCalendarDays} style={{ width: 16, height: 16, color: T.gold }} />
          </span>
          <div>
            <p
              style={{
                fontFamily:    FONT.body,
                fontSize:      '10px',
                color:         T.muted,
                margin:        '0 0 2px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight:    1.3,
              }}
            >
              எதிர்பார்க்கப்படும் டெலிவரி
            </p>
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '15px',
                fontWeight: 700,
                color:      T.gold,
                margin:     0,
                lineHeight: 1.3,
              }}
            >
              {deliveryFormatted}
            </p>
          </div>
        </div>
      ) : null}

      {/* ══════════════════════════════════════════════════════════════════════
          PROGRESS STEPS
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        role="list"
        aria-label="ஆர்டர் முன்னேற்ற படிகள்"
        style={{ padding: '22px 20px 6px' }}
      >
        {STEPS.map((step, idx) => {
          const isDone    = idx < currentIdx;
          const isActive  = idx === currentIdx;
          const isLast    = idx === STEPS.length - 1;
          const ts        = tsMap[step.status];

          return (
            <TimelineRow
              key={step.status}
              step={step}
              isDone={isDone}
              isActive={isActive}
              isLast={isLast}
              timestamp={ts ? fmtTs(ts) : undefined}
              mounted={mounted}
            />
          );
        })}
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes vt-tl-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.65; }
          50%      { transform: scale(1.65); opacity: 0;    }
        }
      `}</style>
    </section>
  );
}

// ─── TimelineRow ──────────────────────────────────────────────────────────────
interface TimelineRowProps {
  step:       TimelineStep;
  isDone:     boolean;
  isActive:   boolean;
  isLast:     boolean;
  timestamp?: string;
  mounted:    boolean;
}

function TimelineRow({
  step,
  isDone,
  isActive,
  isLast,
  timestamp,
  mounted,
}: TimelineRowProps) {
  const circleBorder = isDone ? T.leaf : isActive ? T.forestPrimary : T.border;
  const circleBg     = isDone
    ? 'rgba(61,122,85,0.11)'
    : isActive
    ? 'rgba(26,58,42,0.07)'
    : 'rgba(245,239,224,0.70)';
  const lineColor    = isDone
    ? `linear-gradient(180deg, ${T.leaf} 0%, rgba(61,122,85,0.28) 100%)`
    : 'rgba(221,208,184,0.55)';
  const labelColor   = isActive ? T.darkText : isDone ? T.secondaryText : T.muted;
  const labelSize    = isActive ? '15px' : '14px';
  const labelWeight  = isActive ? 700 : isDone ? 600 : 500;

  return (
    <div
      role="listitem"
      aria-label={`${step.labelTa}${isDone ? ' — முடிந்தது' : isActive ? ' — தற்போதைய நிலை' : ' — இன்னும் வரவில்லை'}`}
      style={{
        display:       'flex',
        gap:           '14px',
        paddingBottom: isLast ? '16px' : '0',
      }}
    >
      {/* ── Left column: node + connector ─────────────────────────── */}
      <div
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          flexShrink:     0,
          width:          '36px',
        }}
        aria-hidden="true"
      >
        {/* Circular node */}
        <div
          style={{
            position:       'relative',
            width:          '36px',
            height:         '36px',
            borderRadius:   '50%',
            background:     circleBg,
            border:         `2px solid ${circleBorder}`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            transition:     'background 300ms ease, border-color 300ms ease',
          }}
        >
          {/* Animated pulse ring — active step only */}
          {isActive && mounted && (
            <span
              style={{
                position:      'absolute',
                inset:         '-7px',
                borderRadius:  '50%',
                border:        '2px solid rgba(26,58,42,0.22)',
                animation:     'vt-tl-pulse 2.2s ease-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}

          {isDone ? (
            /* Completed — animated checkmark draws in */
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8.5L6.5 12 13 5"
                stroke={T.leaf}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="24"
                strokeDashoffset={mounted ? '0' : '24'}
                style={{
                  transition: 'stroke-dashoffset 550ms cubic-bezier(0.4,0,0.2,1) 80ms',
                }}
              />
            </svg>
          ) : isActive ? (
            /* Active — solid dot */
            <div
              style={{
                width:        '10px',
                height:       '10px',
                borderRadius: '50%',
                background:   T.forestPrimary,
              }}
            />
          ) : (
            /* Future — empty dot */
            <div
              style={{
                width:        '8px',
                height:       '8px',
                borderRadius: '50%',
                background:   T.border,
              }}
            />
          )}
        </div>

        {/* Vertical connector line */}
        {!isLast && (
          <div
            style={{
              width:        '2px',
              flex:         1,
              minHeight:    '22px',
              marginTop:    '3px',
              background:   lineColor,
              borderRadius: '1px',
              transition:   'background 300ms ease',
            }}
          />
        )}
      </div>

      {/* ── Right column: label + timestamp ───────────────────────── */}
      <div
        style={{
          flex:          1,
          minWidth:      0,
          paddingBottom: isLast ? 0 : '20px',
          paddingTop:    '4px',
        }}
      >
        <div
          style={{
            display:        'flex',
            alignItems:     'flex-start',
            justifyContent: 'space-between',
            gap:            '8px',
          }}
        >
          {/* Label + description */}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily:  FONT.display,
                fontSize:    labelSize,
                fontWeight:  labelWeight,
                color:       labelColor,
                margin:      0,
                lineHeight:  1.35,
                display:     'flex',
                alignItems:  'center',
                gap:         '5px',
                flexWrap:    'wrap',
                transition:  'color 250ms ease, font-size 250ms ease',
              }}
            >
              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={step.icon} style={{ width: isActive ? 14 : 12, height: isActive ? 14 : 12 }} />
              </span>
              {step.labelTa}
            </p>

            {/* Description visible for done + active steps */}
            {(isDone || isActive) && (
              <p
                style={{
                  fontFamily: FONT.body,
                  fontSize:   '12px',
                  color:      isActive ? T.secondaryText : T.muted,
                  margin:     '3px 0 0',
                  lineHeight: 1.45,
                  opacity:    isDone ? 0.75 : 1,
                }}
              >
                {step.descTa}
              </p>
            )}
          </div>

          {/* Timestamp */}
          {timestamp && (
            <span
              style={{
                fontFamily: FONT.body,
                fontSize:   '11px',
                color:      T.muted,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: 1.4,
                paddingTop: '2px',
              }}
            >
              {timestamp}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cancelled card ───────────────────────────────────────────────────────────
function CancelledCard({ mounted }: { mounted: boolean }) {
  return (
    <section
      aria-label="ஆர்டர் ரத்து நிலை"
      style={{
        background:   '#FFFFFF',
        border:       '1px solid rgba(139,58,47,0.22)',
        borderRadius: '20px',
        overflow:     'hidden',
        boxShadow:    '0 2px 16px rgba(139,58,47,0.07)',
        opacity:      mounted ? 1 : 0,
        transition:   'opacity 350ms ease',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '16px',
          padding:      '20px',
          background:   'rgba(139,58,47,0.04)',
          borderBottom: '1px solid rgba(139,58,47,0.14)',
        }}
      >
        <span style={{ flexShrink: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
          <FontAwesomeIcon icon={faCircleXmark} style={{ width: 26, height: 26, color: T.terracotta }} />
        </span>
        <div>
          <h3
            style={{
              fontFamily: FONT.display,
              fontSize:   '17px',
              fontWeight: 700,
              color:      T.terracotta,
              margin:     '0 0 4px',
              lineHeight: 1.3,
            }}
          >
            ஆர்டர் ரத்து செய்யப்பட்டது
          </h3>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '13px',
              color:      T.secondaryText,
              margin:     0,
              lineHeight: 1.5,
            }}
          >
            Order Cancelled
          </p>
        </div>

        {/* Cancelled badge */}
        <span
          style={{
            marginLeft:    'auto',
            flexShrink:    0,
            fontFamily:    FONT.body,
            fontSize:      '11px',
            fontWeight:    700,
            background:    BADGE.cancelled.bg,
            color:         BADGE.cancelled.color,
            border:        `1px solid ${BADGE.cancelled.bd}`,
            padding:       '4px 10px',
            borderRadius:  '100px',
            whiteSpace:    'nowrap',
            lineHeight:    1.5,
            letterSpacing: '0.02em',
          }}
        >
          {BADGE.cancelled.ta}
        </span>
      </div>

      {/* Refund note */}
      <div style={{ padding: '16px 20px' }}>
        <p
          style={{
            fontFamily:   FONT.body,
            fontSize:     '13px',
            color:        T.secondaryText,
            margin:       0,
            lineHeight:   1.65,
            background:   'rgba(139,58,47,0.04)',
            border:       '1px solid rgba(139,58,47,0.12)',
            borderRadius: '12px',
            padding:      '12px 16px',
          }}
        >
          <FontAwesomeIcon icon={faCreditCard} style={{ width: 13, height: 13, marginRight: 5, color: '#6b7f74', verticalAlign: 'middle' }} aria-hidden="true" />
          பணம் செலுத்தப்பட்டிருந்தால், திரும்பப் பெறும் தொகை{' '}
          <strong>5–7 வணிக நாட்களில்</strong> உங்கள் கணக்கில் வரும்.
          உதவிக்கு <strong>+91 88000 00000</strong> என்ற எண்ணில் தொடர்பு கொள்ளவும்.
        </p>
      </div>
    </section>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function TrackIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M9 2l7 4v6l-7 4L2 12V6l7-4z"
        stroke={T.forestPrimary}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 2v14M2 6l7 4 7-4"
        stroke={T.forestPrimary}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
