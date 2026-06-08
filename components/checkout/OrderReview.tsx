'use client';

/**
 * apps/web/components/checkout/OrderReview.tsx
 *
 * Order review panel — Zone F.1 (Checkout step 3: மதிப்பீடு)
 *
 * Spec: vaithiyam-cart-checkout-spec.md § Zone F (Order Review)
 *
 * Features:
 *  - Read-only cart item list: image, Tamil + English name, qty, unit price, line total
 *  - MRP strikethrough + per-item savings badge
 *  - Subscription indicator per item
 *  - Rx badge on prescription items
 *  - Coupon applied summary row
 *  - Delivery fee row (FREE or ₹40)
 *  - Grand total with savings callout
 *  - Collapse/expand on mobile (default: expanded)
 *  - Mobile responsive via className overrides
 *
 * Data: reads from cartStore via selectors (selectItems, selectTotals, selectAppliedCoupon)
 * No mutations — this is a read-only confirmation view.
 */

import { useState }           from 'react';
import Image                  from 'next/image';
import { FontAwesomeIcon }    from '@fortawesome/react-fontawesome';
import { faLeaf, faGift }     from '@fortawesome/free-solid-svg-icons';
import {
  useCartStore,
  selectItems,
  selectTotals,
  selectAppliedCoupon,
} from '../../stores/cartStore';
import type { CartItem }      from '../../types/order';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  forestPrimary: '#1A3A2A',
  forestDark:    '#0F2A1C',
  creamBase:     '#F5EFE0',
  creamAlt:      '#EDE3CE',
  gold:          '#C9922A',
  goldPale:      '#F0C96E',
  saffron:       '#E07B39',
  leaf:          '#3D7A55',
  terracotta:    '#8B3A2F',
  darkText:      '#1C1410',
  secondaryText: '#5C4A30',
  muted:         '#9C8060',
  border:        '#DDD0B8',
  rx:            '#7C3AED',
} as const;

const FONT = {
  display: "'Mukta Malar', sans-serif",
  body:    "'Hind Madurai', sans-serif",
  serif:   "'Lora', serif",
} as const;

// Subscription frequency Tamil labels
const FREQ_LABELS: Record<string, string> = {
  monthly:   'மாதம்தோறும்',
  bimonthly: '2 மாதம் ஒரு முறை',
  quarterly: '3 மாதம் ஒரு முறை',
};

// ─── Single item row ──────────────────────────────────────────────────────────
function ReviewItemRow({ item }: { item: CartItem }) {
  const [imgError, setImgError] = useState(false);

  const unitPrice   = item.isSubscription && item.subscriptionPrice != null
    ? item.subscriptionPrice
    : item.price;
  const lineTotal   = unitPrice * item.qty;
  const itemMrp     = item.mrp ?? item.price;
  const mrpLine     = itemMrp * item.qty;
  const lineSavings = Math.max(0, mrpLine - lineTotal);
  const discountPct = itemMrp > unitPrice
    ? Math.round(((itemMrp - unitPrice) / itemMrp) * 100)
    : 0;

  return (
    <div
      className="vt-review-item"
      style={{
        display:       'flex',
        gap:           '14px',
        padding:       '16px 0',
        borderBottom:  `1px solid rgba(221,208,184,0.50)`,
        alignItems:    'flex-start',
      }}
    >
      {/* Product image */}
      <div
        style={{
          flexShrink:   0,
          width:        '76px',
          height:       '76px',
          borderRadius: '12px',
          overflow:     'hidden',
          background:   T.creamAlt,
          border:       `1px solid ${T.border}`,
          position:     'relative',
        }}
      >
        {!imgError && item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.nameTa}
            fill
            sizes="76px"
            style={{ objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <HerbImagePlaceholder />
        )}

        {/* Qty badge overlay */}
        <div
          aria-label={`${item.qty} எண்ணிக்கை`}
          style={{
            position:       'absolute',
            bottom:         '4px',
            right:          '4px',
            minWidth:       '22px',
            height:         '22px',
            background:     T.forestPrimary,
            borderRadius:   '100px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontFamily:     FONT.body,
            fontSize:       '11px',
            fontWeight:     700,
            color:          T.goldPale,
            padding:        '0 5px',
            lineHeight:     1,
          }}
        >
          ×{item.qty}
        </div>
      </div>

      {/* Item details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '5px' }}>
          {item.requiresPrescription && (
            <span
              style={{
                fontFamily:   FONT.body,
                fontSize:     '10px',
                fontWeight:   700,
                background:   T.rx,
                color:        '#FFFFFF',
                padding:      '2px 7px',
                borderRadius: '100px',
                lineHeight:   1.6,
                whiteSpace:   'nowrap',
              }}
            >
              Rx தேவை
            </span>
          )}
          {item.isSubscription && (
            <span
              style={{
                fontFamily:   FONT.body,
                fontSize:     '10px',
                fontWeight:   600,
                background:   'rgba(61,122,85,0.10)',
                color:        T.leaf,
                border:       '1px solid rgba(61,122,85,0.22)',
                padding:      '2px 7px',
                borderRadius: '100px',
                lineHeight:   1.6,
                whiteSpace:   'nowrap',
              }}
            >
              ↻ சந்தா · {FREQ_LABELS[item.subscriptionFrequency ?? 'monthly']}
            </span>
          )}
          {discountPct > 0 && (
            <span
              style={{
                fontFamily:   FONT.body,
                fontSize:     '10px',
                fontWeight:   600,
                background:   'rgba(224,123,57,0.10)',
                color:        T.saffron,
                border:       '1px solid rgba(224,123,57,0.18)',
                padding:      '2px 7px',
                borderRadius: '100px',
                lineHeight:   1.6,
                whiteSpace:   'nowrap',
              }}
            >
              {discountPct}% சேமிப்பு
            </span>
          )}
        </div>

        {/* Names */}
        <p
          style={{
            fontFamily:     FONT.display,
            fontSize:       '15px',
            fontWeight:     700,
            color:          T.darkText,
            margin:         0,
            lineHeight:     1.35,
            overflow:       'hidden',
            display:        '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {item.nameTa}
        </p>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '11px',
            color:      T.muted,
            margin:     '2px 0 0',
            lineHeight: 1.4,
          }}
        >
          {item.nameEn}
        </p>

        {/* Unit price annotation */}
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '12px',
            color:      T.muted,
            margin:     '5px 0 0',
            lineHeight: 1.4,
          }}
        >
          ₹{unitPrice.toLocaleString('ta-IN')} × {item.qty}
        </p>
      </div>

      {/* Price column */}
      <div
        style={{
          flexShrink:     0,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'flex-end',
          gap:            '3px',
          paddingTop:     '2px',
        }}
      >
        <span
          style={{
            fontFamily: FONT.serif,
            fontSize:   '17px',
            fontWeight: 700,
            color:      T.forestPrimary,
            lineHeight: 1.2,
          }}
        >
          ₹{lineTotal.toLocaleString('ta-IN')}
        </span>
        {mrpLine > lineTotal && (
          <span
            style={{
              fontFamily:     FONT.body,
              fontSize:       '12px',
              color:          T.muted,
              textDecoration: 'line-through',
              lineHeight:     1.3,
            }}
          >
            ₹{mrpLine.toLocaleString('ta-IN')}
          </span>
        )}
        {lineSavings > 0 && (
          <span
            style={{
              fontFamily: FONT.body,
              fontSize:   '11px',
              fontWeight: 600,
              color:      T.leaf,
              lineHeight: 1.3,
            }}
          >
            −₹{lineSavings.toLocaleString('ta-IN')}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Summary row ──────────────────────────────────────────────────────────────
function SummaryRow({
  label,
  value,
  valueColor,
  valueBold,
  labelMuted,
}: {
  label:      React.ReactNode;
  value:      string;
  valueColor?: string;
  valueBold?:  boolean;
  labelMuted?: boolean;
}) {
  return (
    <div
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        gap:            '8px',
      }}
    >
      <span
        style={{
          fontFamily: FONT.body,
          fontSize:   '14px',
          color:      labelMuted ? T.muted : T.secondaryText,
          lineHeight: 1.5,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT.body,
          fontSize:   '14px',
          fontWeight: valueBold ? 700 : 600,
          color:      valueColor ?? T.darkText,
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface OrderReviewProps {
  /** Optional section heading override */
  title?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderReview({ title = 'ஆர்டர் மதிப்பீடு' }: OrderReviewProps) {
  const items         = useCartStore(selectItems);
  const totals        = useCartStore(selectTotals);
  const appliedCoupon = useCartStore(selectAppliedCoupon);

  const [collapsed, setCollapsed] = useState(false);

  const hasFreeDelivery = totals.deliveryFee === 0;

  return (
    <section
      aria-label="ஆர்டர் மதிப்பீடு"
      style={{
        background:   '#FFFFFF',
        border:       `1px solid ${T.border}`,
        borderRadius: '20px',
        overflow:     'hidden',
        boxShadow:    '0 4px 20px rgba(26,58,42,0.07)',
      }}
    >
      {/* ── Panel header ────────────────────────────────────────────────── */}
      <button
        className="vt-review-header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls="vt-review-body"
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          width:          '100%',
          padding:        '18px 20px',
          background:     'linear-gradient(135deg, rgba(26,58,42,0.04) 0%, rgba(26,58,42,0.01) 100%)',
          borderBottom:   collapsed ? 'none' : `1px solid rgba(221,208,184,0.50)`,
          border:         'none',
          cursor:         'pointer',
          textAlign:      'left',
          transition:     'background 150ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ReceiptIcon />
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
              {title}
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
              {totals.itemCount} பொருட்கள் · ₹{totals.total.toLocaleString('ta-IN')}
            </p>
          </div>
        </div>

        {/* Chevron */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
          className="vt-review-chevron"
          style={{
            flexShrink: 0,
            transition: 'transform 220ms ease',
            transform:  collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          <path
            d="M4.5 7L9 11.5 13.5 7"
            stroke={T.muted}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ── Collapsible body ─────────────────────────────────────────────── */}
      {!collapsed && (
        <div id="vt-review-body">
          {/* Items list */}
          <div style={{ padding: '0 20px' }}>
            {items.map((item) => (
              <ReviewItemRow
                key={`${item.productId}-${item.variantId ?? ''}`}
                item={item}
              />
            ))}
          </div>

          {/* ── Pricing breakdown ──────────────────────────────────────── */}
          <div
            style={{
              padding:      '16px 20px 20px',
              borderTop:    `1px solid rgba(221,208,184,0.40)`,
              background:   'rgba(245,239,224,0.20)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>

              {/* Subtotal */}
              <SummaryRow
                label={`விலை (${totals.itemCount} பொருட்கள்)`}
                value={`₹${totals.subtotal.toLocaleString('ta-IN')}`}
              />

              {/* MRP discount */}
              {totals.discount > 0 && (
                <SummaryRow
                  label="தள்ளுபடி"
                  value={`−₹${totals.discount.toLocaleString('ta-IN')}`}
                  valueColor={T.leaf}
                />
              )}

              {/* Coupon discount */}
              {appliedCoupon && totals.couponDiscount > 0 && (
                <SummaryRow
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      கூப்பன்
                      <span
                        style={{
                          fontFamily:    FONT.body,
                          fontSize:      '10px',
                          fontWeight:    700,
                          background:    'rgba(61,122,85,0.10)',
                          color:         T.leaf,
                          border:        '1px solid rgba(61,122,85,0.20)',
                          padding:       '1px 6px',
                          borderRadius:  '100px',
                          letterSpacing: '0.05em',
                          whiteSpace:    'nowrap',
                        }}
                      >
                        {appliedCoupon.code}
                      </span>
                    </span>
                  }
                  value={`−₹${totals.couponDiscount.toLocaleString('ta-IN')}`}
                  valueColor={T.leaf}
                />
              )}

              {/* Delivery fee */}
              <SummaryRow
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DeliveryIcon />
                    டெலிவரி கட்டணம்
                  </span>
                }
                value={hasFreeDelivery ? 'இலவசம்' : `₹${totals.deliveryFee}`}
                valueColor={hasFreeDelivery ? T.leaf : undefined}
                valueBold={hasFreeDelivery}
              />

              {/* Divider */}
              <div
                style={{
                  height:     '1px',
                  background: T.creamAlt,
                  margin:     '2px 0',
                }}
                aria-hidden="true"
              />

              {/* Grand total */}
              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.display,
                    fontSize:   '17px',
                    fontWeight: 700,
                    color:      T.darkText,
                  }}
                >
                  மொத்த தொகை
                </span>
                <span
                  style={{
                    fontFamily: FONT.serif,
                    fontSize:   '26px',
                    fontWeight: 700,
                    color:      T.forestPrimary,
                    lineHeight: 1.1,
                  }}
                >
                  ₹{totals.total.toLocaleString('ta-IN')}
                </span>
              </div>
            </div>

            {/* Savings callout */}
            {totals.savings > 0 && (
              <div
                role="status"
                aria-label={`இந்த ஆர்டரில் ₹${totals.savings.toLocaleString('ta-IN')} சேமித்தீர்கள்`}
                style={{
                  marginTop:    '14px',
                  padding:      '12px 16px',
                  background:   'linear-gradient(135deg, rgba(61,122,85,0.09) 0%, rgba(61,122,85,0.04) 100%)',
                  border:       '1px solid rgba(61,122,85,0.18)',
                  borderRadius: '12px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                }}
              >
                <span
                  style={{ lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
                  aria-hidden="true"
                >
                  <FontAwesomeIcon icon={faLeaf} style={{ width: 16, height: 16, color: '#3D7A55' }} />
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
                  இந்த ஆர்டரில்{' '}
                  <strong>₹{totals.savings.toLocaleString('ta-IN')}</strong>
                  {' '}சேமித்தீர்கள்!
                </p>
              </div>
            )}

            {/* Free delivery achievement */}
            {hasFreeDelivery && (
              <div
                role="status"
                style={{
                  marginTop:    '10px',
                  padding:      '10px 14px',
                  background:   'rgba(201,146,42,0.06)',
                  border:       '1px solid rgba(201,146,42,0.18)',
                  borderRadius: '10px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '8px',
                }}
              >
                <span style={{ lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
                  <FontAwesomeIcon icon={faGift} style={{ width: 14, height: 14, color: '#C9922A' }} />
                </span>
                <p
                  style={{
                    fontFamily: FONT.body,
                    fontSize:   '12px',
                    fontWeight: 600,
                    color:      T.gold,
                    margin:     0,
                    lineHeight: 1.4,
                  }}
                >
                  இலவச டெலிவரி பெற்றுவிட்டீர்கள்!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 640px) {
          .vt-review-item { padding: 14px 0 !important; }
          .vt-review-header { padding: 14px 16px !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Icon sub-components ──────────────────────────────────────────────────────

function HerbImagePlaceholder() {
  return (
    <div
      aria-hidden="true"
      style={{
        width:          '100%',
        height:         '100%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        opacity:        0.25,
      }}
    >
      <svg width="40" height="40" viewBox="0 0 72 72" fill="none">
        <path
          d="M36 8C26 14 18 22 18 34a18 18 0 0 0 18 18 18 18 0 0 0 18-18C54 22 46 14 36 8z"
          stroke="#3D7A55"
          strokeWidth="2"
          fill="rgba(61,122,85,0.12)"
        />
        <path d="M36 22v26" stroke="#3D7A55" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 32c5-2 10-2 10 0" stroke="#3D7A55" strokeWidth="2" strokeLinecap="round" />
        <path d="M46 38c-5-2-10-2-10 0" stroke="#3D7A55" strokeWidth="2" strokeLinecap="round" />
        <circle cx="36" cy="52" r="3" fill="#3D7A55" opacity="0.45" />
      </svg>
    </div>
  );
}

function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4 2h10v14l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V2Z"
        stroke={T.forestPrimary}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 6h5M6.5 9h3.5M6.5 12h4"
        stroke={T.forestPrimary}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M2 11V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6"
        stroke={T.muted}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 7h2.5l2 3V13h-2M12 13H6"
        stroke={T.muted}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4.5" cy="13.5" r="1.5" stroke={T.muted} strokeWidth="1.5" />
      <circle cx="14" cy="13.5" r="1.5" stroke={T.muted} strokeWidth="1.5" />
    </svg>
  );
}
