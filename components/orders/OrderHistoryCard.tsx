'use client';

/**
 * apps/web/components/orders/OrderHistoryCard.tsx
 *
 * Vaithiyam — Order History Card
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Order ID with short display form
 *   • Tamil-formatted order date
 *   • Status badge (all 7 statuses, exact colours from order detail page)
 *   • Total amount (₹ localised to ta-IN)
 *   • Item count aggregate
 *   • Product thumbnail strip (up to 3 images + overflow badge)
 *   • Active-order delivery progress indicator
 *   • View Order CTA  → navigates to /order/:orderId
 *   • Reorder CTA     → delegates to onReorder prop (parent handles API + toast)
 *   • Download Invoice → delegates to onInvoice prop (parent handles API + toast)
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See OrderHistoryCardProps below.
 *
 * ─── Types exported ────────────────────────────────────────────────────────────
 *   OrderHistoryItem      — lightweight item for list view
 *   OrderHistorySummary   — full summary object consumed by list + card
 */

import { useState, useCallback } from 'react';
import Image                     from 'next/image';
import { useRouter }             from 'next/navigation';
import { FontAwesomeIcon }       from '@fortawesome/react-fontawesome';
import {
  faClock, faCircleCheck, faBox, faTruck,
  faMotorcycle, faGift, faBan, faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition }   from '@fortawesome/fontawesome-svg-core';
import type { OrderStatus }      from '../order/OrderSummary';

// ─── Design tokens (identical to all Vaithiyam modules) ───────────────────────
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

// ─── Status config (mirrors order/[orderId]/page.tsx exactly) ─────────────────
const STATUS_BADGE: Record<
  OrderStatus,
  { labelTa: string; icon: IconDefinition; bg: string; color: string; border: string }
> = {
  placed:           { labelTa: 'பதிவாயிற்று',     icon: faClock,        bg: 'rgba(201,146,42,0.10)',  color: T.gold,          border: 'rgba(201,146,42,0.28)' },
  confirmed:        { labelTa: 'உறுதிப்பட்டது',   icon: faCircleCheck,  bg: 'rgba(61,122,85,0.10)',   color: T.leaf,          border: 'rgba(61,122,85,0.28)'  },
  packed:           { labelTa: 'பேக் ஆயிற்று',     icon: faBox,          bg: 'rgba(26,58,42,0.08)',    color: T.forestPrimary, border: 'rgba(26,58,42,0.22)'   },
  shipped:          { labelTa: 'அனுப்பப்பட்டது',   icon: faTruck,        bg: 'rgba(224,123,57,0.10)', color: T.saffron,       border: 'rgba(224,123,57,0.28)' },
  out_for_delivery: { labelTa: 'டெலிவரி வழியில்',  icon: faMotorcycle,   bg: 'rgba(224,123,57,0.15)', color: '#B85D1A',       border: 'rgba(224,123,57,0.32)' },
  delivered:        { labelTa: 'டெலிவரி ஆயிற்று', icon: faCircleCheck,  bg: 'rgba(61,122,85,0.12)',   color: T.leaf,          border: 'rgba(61,122,85,0.30)'  },
  cancelled:        { labelTa: 'ரத்து ஆயிற்று',   icon: faBan,          bg: 'rgba(139,58,47,0.10)',   color: T.terracotta,    border: 'rgba(139,58,47,0.24)'  },
};

const ACTIVE_STATUSES = new Set<OrderStatus>([
  'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery',
]);

// ─── Tamil month names ────────────────────────────────────────────────────────
const MONTHS_TA = [
  'ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்',
  'ஜூல்', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச',
];

function formatDateTa(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS_TA[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

// ─── Price formatter — matches OrderSummary.tsx exactly (rupees, ta-IN) ───────
const fmt = (rupees: number) =>
  `₹${rupees.toLocaleString('ta-IN')}`;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OrderHistoryItem {
  productId:  string;
  nameTa:     string;
  nameEn:     string;
  imageUrl?:  string;
  qty:        number;
  price:      number;  // rupees per unit (for reorder cart reconstruction)
}

export interface OrderHistorySummary {
  orderId:      string;
  placedAt:     string;   // ISO date string
  status:       OrderStatus;
  items:        OrderHistoryItem[];
  total:        number;   // rupees
  invoiceUrl?:  string;   // pre-signed S3 URL if available
}

export interface OrderHistoryCardProps {
  order:      OrderHistorySummary;
  /** Parent handles API call + toast notification */
  onReorder:  (order: OrderHistorySummary) => Promise<void>;
  /** Parent handles API call / URL open + toast notification */
  onInvoice:  (order: OrderHistorySummary) => Promise<void>;
}

// ─── Thumbnail strip ──────────────────────────────────────────────────────────
function ThumbnailStrip({ items }: { items: OrderHistoryItem[] }) {
  const visible = items.slice(0, 3);
  const extra   = items.length - visible.length;

  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}
    >
      {visible.map((item, i) => (
        <div
          key={`${item.productId}-${i}`}
          style={{
            width:        '48px',
            height:       '48px',
            borderRadius: '11px',
            border:       `1.5px solid ${T.border}`,
            background:   T.creamAlt,
            overflow:     'hidden',
            flexShrink:   0,
            position:     'relative',
          }}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.nameTa}
              fill
              sizes="48px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width:          '100%',
                height:         '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesomeIcon icon={faLeaf} style={{ width: 20, height: 20, color: 'rgba(31,138,98,0.55)' }} />
            </div>
          )}
        </div>
      ))}

      {extra > 0 && (
        <div
          style={{
            width:          '48px',
            height:         '48px',
            borderRadius:   '11px',
            background:     'rgba(26,58,42,0.06)',
            border:         `1.5px dashed ${T.border}`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          <span
            style={{
              fontFamily:  FONT.display,
              fontSize:    '0.78rem',
              fontWeight:  700,
              color:       T.muted,
              lineHeight:  1,
            }}
          >
            +{extra}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      aria-hidden="true"
      style={{ animation: 'vt-ohc-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes vt-ohc-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─── CTA button ───────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'ghost' | 'outline';

interface CtaBtnProps {
  label:     string;
  icon:      React.ReactNode;
  onClick:   () => void;
  loading?:  boolean;
  disabled?: boolean;
  variant?:  BtnVariant;
}

const BTN_STYLES: Record<BtnVariant, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
    color:       '#FFFFFF',
    border:      'none',
    boxShadow:   '0 2px 8px rgba(26,58,42,0.22)',
  },
  ghost: {
    background: 'rgba(26,58,42,0.06)',
    color:      T.forestPrimary,
    border:     '1px solid rgba(26,58,42,0.12)',
  },
  outline: {
    background: 'transparent',
    color:      T.forestPrimary,
    border:     `1.5px solid ${T.forestPrimary}`,
  },
};

function CtaBtn({
  label, icon, onClick, loading = false, disabled = false, variant = 'ghost',
}: CtaBtnProps) {
  const inactive = loading || disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactive}
      aria-label={label}
      aria-busy={loading}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '5px',
        flex:           1,
        minWidth:       0,
        height:         '38px',
        padding:        '0 8px',
        borderRadius:   '10px',
        cursor:         inactive ? 'not-allowed' : 'pointer',
        fontFamily:     FONT.display,
        fontSize:       '0.78rem',
        fontWeight:     700,
        letterSpacing:  '0.01em',
        opacity:        disabled ? 0.48 : 1,
        whiteSpace:     'nowrap',
        transition:     'opacity 0.15s',
        ...BTN_STYLES[variant],
      }}
    >
      <span aria-hidden="true" style={{ flexShrink: 0, lineHeight: 1 }}>
        {loading ? <Spinner /> : icon}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
    </button>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────
export default function OrderHistoryCard({
  order,
  onReorder,
  onInvoice,
}: OrderHistoryCardProps) {
  const router    = useRouter();
  const badge     = STATUS_BADGE[order.status];
  const isActive  = ACTIVE_STATUSES.has(order.status);
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);

  const [reordering,  setReordering]  = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Short order ID — show last 12 chars if too long
  const displayId = order.orderId.length > 16
    ? `…${order.orderId.slice(-12)}`
    : order.orderId;

  const handleView = useCallback(() => {
    router.push(`/order/${order.orderId}`);
  }, [router, order.orderId]);

  const handleReorder = useCallback(async () => {
    if (reordering) return;
    setReordering(true);
    try { await onReorder(order); }
    finally { setReordering(false); }
  }, [order, onReorder, reordering]);

  const handleInvoice = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try { await onInvoice(order); }
    finally { setDownloading(false); }
  }, [order, onInvoice, downloading]);

  const invoiceDisabled =
    order.status === 'placed' ||
    order.status === 'cancelled';

  return (
    <article
      aria-label={`ஆர்டர் ${order.orderId} — ${badge.labelTa}`}
      style={{
        background:   '#FFFFFF',
        borderRadius: '20px',
        border:       `1px solid ${T.border}`,
        overflow:     'hidden',
        boxShadow:    '0 2px 12px rgba(26,58,42,0.06), 0 1px 3px rgba(26,58,42,0.04)',
      }}
    >
      {/* ── Top row: thumbnails + meta + total ─────────────────────────────── */}
      <div
        style={{
          padding:    '15px 15px 10px',
          display:    'flex',
          gap:        '12px',
          alignItems: 'flex-start',
        }}
      >
        {/* Thumbnail strip */}
        <ThumbnailStrip items={order.items} />

        {/* Order meta (order ID, date, item count) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Status badge */}
          <div
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '4px',
              padding:      '3px 8px',
              borderRadius: '100px',
              background:   badge.bg,
              border:       `1px solid ${badge.border}`,
              marginBottom: '7px',
            }}
          >
            <span aria-hidden="true" style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={badge.icon} style={{ width: 11, height: 11, color: badge.color }} />
            </span>
            <span
              style={{
                fontFamily: FONT.display,
                fontSize:   '0.72rem',
                fontWeight: 700,
                color:      badge.color,
              }}
            >
              {badge.labelTa}
            </span>
          </div>

          {/* Order ID */}
          <p
            style={{
              fontFamily:   FONT.display,
              fontSize:     '0.82rem',
              fontWeight:   700,
              color:        T.darkText,
              margin:       '0 0 3px',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
            title={order.orderId}
          >
            <span style={{ fontWeight: 500, color: T.muted }}>ஆ# </span>
            {displayId}
          </p>

          {/* Date · item count */}
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '0.76rem',
              color:      T.muted,
              margin:     0,
              lineHeight: 1.4,
            }}
          >
            {formatDateTa(order.placedAt)}
            <span aria-hidden="true"> · </span>
            {itemCount} பொருட்கள்
          </p>
        </div>

        {/* Total */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p
            style={{
              fontFamily:   FONT.display,
              fontSize:     '1.05rem',
              fontWeight:   800,
              color:        T.darkText,
              margin:       '0 0 1px',
              letterSpacing:'-0.01em',
            }}
          >
            {fmt(order.total)}
          </p>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '0.68rem',
              color:      T.muted,
              margin:     0,
            }}
          >
            மொத்தம்
          </p>
        </div>
      </div>

      {/* ── Active order progress strip ────────────────────────────────────── */}
      {isActive && (
        <div style={{ padding: '0 15px 10px' }}>
          <div
            role="status"
            aria-label="ஆர்டர் வழியில் உள்ளது"
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '7px 11px',
              background:   'rgba(61,122,85,0.06)',
              borderRadius: '10px',
              border:       '1px solid rgba(61,122,85,0.15)',
            }}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faTruck}
              style={{ width: 15, height: 15, color: T.saffron, animation: 'vt-ohc-pulse 2s ease-in-out infinite' }}
            />
            <style>{`
              @keyframes vt-ohc-pulse {
                0%,100% { opacity: 1;    }
                50%      { opacity: 0.5; }
              }
            `}</style>
            <span
              style={{
                fontFamily:  FONT.body,
                fontSize:    '0.77rem',
                color:       T.leaf,
                fontWeight:  600,
                lineHeight:  1.3,
              }}
            >
              {badge.labelTa} — உங்கள் ஆர்டர் செயலில் உள்ளது
            </span>
          </div>
        </div>
      )}

      {/* ── Delivered: compact satisfaction note ──────────────────────────── */}
      {order.status === 'delivered' && (
        <div style={{ padding: '0 15px 10px' }}>
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '7px 11px',
              background:   'rgba(61,122,85,0.05)',
              borderRadius: '10px',
              border:       '1px solid rgba(61,122,85,0.13)',
            }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}><FontAwesomeIcon icon={faCircleCheck} style={{ width: 13, height: 13, color: T.leaf }} /></span>
            <span
              style={{
                fontFamily: FONT.body,
                fontSize:   '0.77rem',
                color:      T.leaf,
                fontWeight: 600,
              }}
            >
              வெற்றிகரமாக டெலிவரி ஆயிற்று
            </span>
          </div>
        </div>
      )}

      {/* ── Cancelled: subtle note ─────────────────────────────────────────── */}
      {order.status === 'cancelled' && (
        <div style={{ padding: '0 15px 10px' }}>
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '7px 11px',
              background:   'rgba(139,58,47,0.05)',
              borderRadius: '10px',
              border:       '1px solid rgba(139,58,47,0.13)',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '0.82rem' }}>ℹ️</span>
            <span
              style={{
                fontFamily: FONT.body,
                fontSize:   '0.77rem',
                color:      T.terracotta,
                fontWeight: 600,
              }}
            >
              இந்த ஆர்டர் ரத்து செய்யப்பட்டது
            </span>
          </div>
        </div>
      )}

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{ height: '1px', background: T.border, margin: '0 15px' }}
      />

      {/* ── CTA row ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '11px 15px',
          display: 'flex',
          gap:     '7px',
        }}
      >
        {/* View Order */}
        <CtaBtn
          label="காண்க"
          icon={
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 3C4.5 3 2 8 2 8s2.5 5 6 5 6-5 6-5-2.5-5-6-5z"
                stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          }
          onClick={handleView}
          variant="primary"
        />

        {/* Reorder */}
        <CtaBtn
          label="மீண்டும்"
          icon={
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M13 8A5 5 0 1 1 8 3a5 5 0 0 1 3.5 1.5L13 3v4h-4l1.5-1.5"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          onClick={handleReorder}
          loading={reordering}
          disabled={order.status === 'cancelled'}
          variant="ghost"
        />

        {/* Invoice */}
        <CtaBtn
          label="விலைப்பட்டியல்"
          icon={
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="2" width="10" height="12" rx="2"
                stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 6h4M6 9h4M6 12h2"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M10 0v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          }
          onClick={handleInvoice}
          loading={downloading}
          disabled={invoiceDisabled}
          variant="ghost"
        />
      </div>
    </article>
  );
}
