'use client';

/**
 * apps/web/components/order/OrderSummary.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Order Summary
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Ordered items list: image, Tamil/English name, qty badge, unit price, line total
 *   • MRP strikethrough + savings badge per item
 *   • Prescription Rx and subscription frequency badges
 *   • Pricing breakdown: subtotal, discount, coupon, delivery, grand total
 *   • Shipping address card
 *   • Payment information section
 *   • Collapsible items panel (default expanded; collapses on mobile by default)
 *   • Image fallback herb placeholder
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   order        — full OrderData object (see type below)
 *   collapsible  — allow collapsing the items section (default: false)
 *   showAddress  — show shipping address section (default: true)
 *   showPayment  — show payment info section (default: true)
 */

import { useState }        from 'react';
import Image               from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faGift }  from '@fortawesome/free-solid-svg-icons';

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  rx:            '#7C3AED',
} as const;

const FONT = {
  display: "'Mukta Malar', sans-serif",
  body:    "'Hind Madurai', sans-serif",
  serif:   "'Lora', serif",
} as const;

// ─── Types (expected from lib/order.ts + packages/shared) ────────────────────
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId:              string;
  variantId?:             string;
  nameTa:                 string;
  nameEn:                 string;
  imageUrl?:              string;
  qty:                    number;
  price:                  number;   // sale price per unit
  mrp:                    number;   // MRP per unit
  lineTotal:              number;
  requiresPrescription?:  boolean;
  isSubscription?:        boolean;
  subscriptionFrequency?: 'monthly' | 'bimonthly' | 'quarterly';
}

export interface ShippingAddress {
  name:      string;
  phone:     string;
  line1:     string;
  line2?:    string;
  city:      string;
  state:     string;
  pincode:   string;
  landmark?: string;
}

export interface OrderData {
  orderId:           string;
  placedAt:          string;
  status:            OrderStatus;
  paymentMethod:     'upi' | 'cod' | 'razorpay';
  paymentId?:        string;
  razorpayOrderId?:  string;
  upiId?:            string;
  items:             OrderItem[];
  address:           ShippingAddress;
  subtotal:          number;
  discount:          number;
  couponCode?:       string;
  couponDiscount:    number;
  deliveryFee:       number;
  total:             number;
  savings:           number;
  estimatedDelivery?: string;
  notes?:            string;
  statusHistory?: Array<{
    status:    OrderStatus;
    timestamp: string;
    note?:     string;
  }>;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface OrderSummaryProps {
  order:         OrderData;
  collapsible?:  boolean;
  showAddress?:  boolean;
  showPayment?:  boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
  upi:      'UPI',
  cod:      'பணமாக கொடுங்கள்',
  razorpay: 'ஆன்லைன் கட்டணம்',
};
const FREQ_LABELS: Record<string, string> = {
  monthly:   'மாதம்தோறும்',
  bimonthly: '2 மாதம் ஒரு முறை',
  quarterly: '3 மாதம் ஒரு முறை',
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderSummary({
  order,
  collapsible = false,
  showAddress = true,
  showPayment = true,
}: OrderSummaryProps) {
  const [itemsCollapsed, setItemsCollapsed] = useState(false);

  const hasFreeDelivery = order.deliveryFee === 0;
  const itemCount       = order.items.reduce((s, i) => s + i.qty, 0);

  const paymentLabel =
    order.paymentMethod === 'upi' && order.upiId
      ? `UPI · ${order.upiId}`
      : (PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ══════════════════════════════════════════════════════════════════════
          ITEMS PANEL
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="ஆர்டர் செய்த பொருட்கள்"
        style={{
          background:   '#FFFFFF',
          border:       `1px solid ${T.border}`,
          borderRadius: '20px',
          overflow:     'hidden',
          boxShadow:    '0 2px 16px rgba(26,58,42,0.06)',
        }}
      >
        {/* Panel header */}
        {collapsible ? (
          <button
            type="button"
            onClick={() => setItemsCollapsed((c) => !c)}
            aria-expanded={!itemsCollapsed}
            aria-controls="vt-os-items"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              width:          '100%',
              padding:        '18px 20px',
              background:     'rgba(26,58,42,0.03)',
              borderBottom:   itemsCollapsed ? 'none' : `1px solid rgba(221,208,184,0.50)`,
              border:         'none',
              cursor:         'pointer',
              textAlign:      'left',
              transition:     'background 150ms ease',
            }}
          >
            <PanelTitle icon={<PackageIcon />} title="ஆர்டர் செய்த பொருட்கள்" sub={`${itemCount} items`} />
            <ChevronIcon collapsed={itemsCollapsed} />
          </button>
        ) : (
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '18px 20px',
              borderBottom: `1px solid rgba(221,208,184,0.50)`,
              background:   'rgba(26,58,42,0.03)',
            }}
          >
            <PanelTitle icon={<PackageIcon />} title="ஆர்டர் செய்த பொருட்கள்" sub={`${itemCount} items`} />
          </div>
        )}

        {!itemsCollapsed && (
          <div id="vt-os-items">
            {/* Item rows */}
            <div style={{ padding: '0 20px' }}>
              {order.items.map((item, idx) => (
                <ItemRow
                  key={`${item.productId}-${item.variantId ?? ''}-${idx}`}
                  item={item}
                  isLast={idx === order.items.length - 1}
                />
              ))}
            </div>

            {/* Pricing breakdown */}
            <div
              style={{
                padding:    '16px 20px 20px',
                borderTop:  `1px solid rgba(221,208,184,0.40)`,
                background: 'rgba(245,239,224,0.25)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <PriceRow
                  label={`விலை (${itemCount} பொருட்கள்)`}
                  value={`₹${order.subtotal.toLocaleString('ta-IN')}`}
                />
                {order.discount > 0 && (
                  <PriceRow
                    label="தள்ளுபடி"
                    value={`−₹${order.discount.toLocaleString('ta-IN')}`}
                    valueColor={T.leaf}
                  />
                )}
                {order.couponCode && order.couponDiscount > 0 && (
                  <PriceRow
                    label={
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        கூப்பன்
                        <span
                          style={{
                            fontFamily:   FONT.body,
                            fontSize:     '10px',
                            fontWeight:   700,
                            background:   'rgba(61,122,85,0.10)',
                            color:        T.leaf,
                            border:       '1px solid rgba(61,122,85,0.22)',
                            padding:      '1px 6px',
                            borderRadius: '100px',
                            letterSpacing:'0.05em',
                          }}
                        >
                          {order.couponCode}
                        </span>
                      </span>
                    }
                    value={`−₹${order.couponDiscount.toLocaleString('ta-IN')}`}
                    valueColor={T.leaf}
                  />
                )}
                <PriceRow
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DeliveryIcon />
                      டெலிவரி கட்டணம்
                    </span>
                  }
                  value={hasFreeDelivery ? 'இலவசம்' : `₹${order.deliveryFee}`}
                  valueColor={hasFreeDelivery ? T.leaf : undefined}
                  valueBold={hasFreeDelivery}
                />

                {/* Grand total divider */}
                <div style={{ height: '1px', background: T.creamAlt, margin: '4px 0' }} aria-hidden="true" />

                {/* Grand total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
                    ₹{order.total.toLocaleString('ta-IN')}
                  </span>
                </div>
              </div>

              {/* Savings callout */}
              {order.savings > 0 && (
                <div
                  role="status"
                  style={{
                    marginTop:    '14px',
                    padding:      '12px 16px',
                    background:   'linear-gradient(135deg,rgba(61,122,85,0.09) 0%,rgba(61,122,85,0.04) 100%)',
                    border:       '1px solid rgba(61,122,85,0.18)',
                    borderRadius: '12px',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '10px',
                  }}
                >
                  <span style={{ lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
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
                    இந்த ஆர்டரில் <strong>₹{order.savings.toLocaleString('ta-IN')}</strong> சேமித்தீர்கள்!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SHIPPING ADDRESS
      ══════════════════════════════════════════════════════════════════════ */}
      {showAddress && (
        <section
          aria-label="டெலிவரி முகவரி"
          style={{
            background:   '#FFFFFF',
            border:       `1px solid ${T.border}`,
            borderRadius: '20px',
            overflow:     'hidden',
            boxShadow:    '0 2px 16px rgba(26,58,42,0.06)',
          }}
        >
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '18px 20px',
              borderBottom: `1px solid rgba(221,208,184,0.50)`,
              background:   'rgba(26,58,42,0.03)',
            }}
          >
            <PanelTitle icon={<LocationIcon />} title="டெலிவரி முகவரி" />
          </div>
          <div style={{ padding: '18px 20px' }}>
            <p
              style={{
                fontFamily: FONT.display,
                fontSize:   '16px',
                fontWeight: 700,
                color:      T.darkText,
                margin:     '0 0 4px',
                lineHeight: 1.3,
              }}
            >
              {order.address.name}
            </p>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '14px',
                color:      T.secondaryText,
                margin:     '0 0 2px',
                lineHeight: 1.6,
              }}
            >
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ''}
            </p>
            {order.address.landmark && (
              <p
                style={{
                  fontFamily: FONT.body,
                  fontSize:   '13px',
                  color:      T.muted,
                  margin:     '0 0 2px',
                  lineHeight: 1.5,
                }}
              >
                அருகில்: {order.address.landmark}
              </p>
            )}
            <p
              style={{
                fontFamily: FONT.body,
                fontSize:   '14px',
                color:      T.secondaryText,
                margin:     '0 0 8px',
                lineHeight: 1.6,
              }}
            >
              {order.address.city}, {order.address.state} – {order.address.pincode}
            </p>
            <a
              href={`tel:${order.address.phone}`}
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '6px',
                fontFamily:     FONT.body,
                fontSize:       '13px',
                fontWeight:     600,
                color:          T.leaf,
                textDecoration: 'none',
              }}
            >
              <PhoneIcon />
              {order.address.phone}
            </a>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PAYMENT INFORMATION
      ══════════════════════════════════════════════════════════════════════ */}
      {showPayment && (
        <section
          aria-label="கட்டண தகவல்"
          style={{
            background:   '#FFFFFF',
            border:       `1px solid ${T.border}`,
            borderRadius: '20px',
            overflow:     'hidden',
            boxShadow:    '0 2px 16px rgba(26,58,42,0.06)',
          }}
        >
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '18px 20px',
              borderBottom: `1px solid rgba(221,208,184,0.50)`,
              background:   'rgba(26,58,42,0.03)',
            }}
          >
            <PanelTitle icon={<WalletIcon />} title="கட்டண தகவல்" />
          </div>
          <div style={{ padding: '0 20px' }}>
            <PayInfoRow label="கட்டண முறை" value={paymentLabel} />
            {order.paymentId && (
              <>
                <PayDivider />
                <PayInfoRow label="கட்டண ஐடி" value={order.paymentId} mono />
              </>
            )}
            {order.razorpayOrderId && (
              <>
                <PayDivider />
                <PayInfoRow label="Razorpay ஆர்டர்" value={order.razorpayOrderId} mono />
              </>
            )}
            <PayDivider />
            <PayInfoRow
              label="நிலை"
              value={
                order.paymentMethod === 'cod'
                  ? 'டெலிவரியில் சேகரிக்கவும்'
                  : order.paymentId
                  ? 'கட்டணம் பெறப்பட்டது ✓'
                  : 'நிலுவையில் உள்ளது'
              }
              valueColor={
                order.paymentMethod === 'cod'
                  ? T.gold
                  : order.paymentId
                  ? T.leaf
                  : T.saffron
              }
              valueBold
            />
          </div>

          {/* Notes */}
          {order.notes && (
            <div
              style={{
                padding:    '14px 20px',
                borderTop:  `1px solid rgba(221,208,184,0.40)`,
                background: 'rgba(245,239,224,0.30)',
              }}
            >
              <p
                style={{
                  fontFamily:    FONT.body,
                  fontSize:      '10px',
                  color:         T.muted,
                  margin:        '0 0 5px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight:    1.3,
                }}
              >
                குறிப்புகள்
              </p>
              <p
                style={{
                  fontFamily: FONT.body,
                  fontSize:   '13px',
                  color:      T.secondaryText,
                  margin:     0,
                  lineHeight: 1.6,
                }}
              >
                {order.notes}
              </p>
            </div>
          )}
        </section>
      )}

      <style>{`
        @media (max-width: 640px) {
          .vt-os-item { padding: 14px 0 !important; }
        }
      `}</style>
    </div>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────
function ItemRow({ item, isLast }: { item: OrderItem; isLast: boolean }) {
  const [imgErr, setImgErr] = useState(false);

  const unitPrice  = item.price;
  const lineTotal  = item.lineTotal;
  const mrpLine    = item.mrp * item.qty;
  const savings    = Math.max(0, mrpLine - lineTotal);
  const discPct    = item.mrp > unitPrice
    ? Math.round(((item.mrp - unitPrice) / item.mrp) * 100)
    : 0;

  return (
    <div
      className="vt-os-item"
      style={{
        display:      'flex',
        gap:          '14px',
        padding:      '16px 0',
        borderBottom: isLast ? 'none' : '1px solid rgba(221,208,184,0.45)',
        alignItems:   'flex-start',
      }}
    >
      {/* Image */}
      <div
        style={{
          flexShrink:   0,
          width:        '72px',
          height:       '72px',
          borderRadius: '12px',
          overflow:     'hidden',
          background:   T.creamAlt,
          border:       `1px solid ${T.border}`,
          position:     'relative',
        }}
      >
        {!imgErr && item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.nameTa}
            fill
            sizes="72px"
            style={{ objectFit: 'cover' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <HerbPlaceholder />
        )}
        {/* Qty badge */}
        <div
          aria-label={`${item.qty} எண்ணிக்கை`}
          style={{
            position:       'absolute',
            bottom:         '3px',
            right:          '3px',
            minWidth:       '21px',
            height:         '21px',
            background:     T.forestPrimary,
            borderRadius:   '100px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontFamily:     FONT.body,
            fontSize:       '10px',
            fontWeight:     700,
            color:          T.goldPale,
            padding:        '0 4px',
            lineHeight:     1,
          }}
        >
          ×{item.qty}
        </div>
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '5px' }}>
          {item.requiresPrescription && (
            <Badge bg={T.rx} color="#FFF">Rx தேவை</Badge>
          )}
          {item.isSubscription && (
            <Badge bg="rgba(61,122,85,0.10)" color={T.leaf} border="rgba(61,122,85,0.22)">
              ↻ {FREQ_LABELS[item.subscriptionFrequency ?? 'monthly']}
            </Badge>
          )}
          {discPct > 0 && (
            <Badge bg="rgba(224,123,57,0.10)" color={T.saffron} border="rgba(224,123,57,0.18)">
              {discPct}% சேமிப்பு
            </Badge>
          )}
        </div>

        <p
          style={{
            fontFamily:      FONT.display,
            fontSize:        '15px',
            fontWeight:      700,
            color:           T.darkText,
            margin:          0,
            lineHeight:      1.35,
            overflow:        'hidden',
            display:         '-webkit-box',
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
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '12px',
            color:      T.muted,
            margin:     '4px 0 0',
            lineHeight: 1.4,
          }}
        >
          ₹{unitPrice.toLocaleString('ta-IN')} × {item.qty}
        </p>
      </div>

      {/* Price */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', paddingTop: '2px' }}>
        <span style={{ fontFamily: FONT.serif, fontSize: '17px', fontWeight: 700, color: T.forestPrimary, lineHeight: 1.2 }}>
          ₹{lineTotal.toLocaleString('ta-IN')}
        </span>
        {mrpLine > lineTotal && (
          <span style={{ fontFamily: FONT.body, fontSize: '12px', color: T.muted, textDecoration: 'line-through', lineHeight: 1.3 }}>
            ₹{mrpLine.toLocaleString('ta-IN')}
          </span>
        )}
        {savings > 0 && (
          <span style={{ fontFamily: FONT.body, fontSize: '11px', fontWeight: 600, color: T.leaf, lineHeight: 1.3 }}>
            −₹{savings.toLocaleString('ta-IN')}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function PanelTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
      {icon}
      <div>
        <h3 style={{ fontFamily: FONT.display, fontSize: '17px', fontWeight: 700, color: T.darkText, margin: 0, lineHeight: 1.3 }}>
          {title}
        </h3>
        {sub && (
          <p style={{ fontFamily: FONT.body, fontSize: '12px', color: T.muted, margin: '2px 0 0', lineHeight: 1.4 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Badge({
  bg, color, border, children,
}: {
  bg: string; color: string; border?: string; children: React.ReactNode;
}) {
  return (
    <span
      style={{
        fontFamily:   FONT.body,
        fontSize:     '10px',
        fontWeight:   700,
        background:   bg,
        color,
        border:       border ? `1px solid ${border}` : 'none',
        padding:      '2px 7px',
        borderRadius: '100px',
        lineHeight:   1.6,
        whiteSpace:   'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function PriceRow({
  label, value, valueColor, valueBold,
}: {
  label: React.ReactNode; value: string; valueColor?: string; valueBold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontFamily: FONT.body, fontSize: '14px', color: T.secondaryText, lineHeight: 1.5 }}>{label}</span>
      <span style={{ fontFamily: FONT.body, fontSize: '14px', fontWeight: valueBold ? 700 : 600, color: valueColor ?? T.darkText, flexShrink: 0 }}>
        {value}
      </span>
    </div>
  );
}

function PayInfoRow({
  label, value, valueColor, valueBold, mono,
}: {
  label: string; value: string; valueColor?: string; valueBold?: boolean; mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '12px 0' }}>
      <span style={{ fontFamily: FONT.body, fontSize: '13px', color: T.muted, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontFamily:   mono ? 'monospace' : FONT.display,
          fontSize:     mono ? '12px' : '14px',
          fontWeight:   valueBold ? 700 : 600,
          color:        valueColor ?? T.darkText,
          textAlign:    'right',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          maxWidth:     '65%',
          letterSpacing: mono ? '0.03em' : 'normal',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PayDivider() {
  return <div aria-hidden="true" style={{ height: '1px', background: 'rgba(221,208,184,0.50)' }} />;
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, transition: 'transform 200ms ease', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
      <path d="M4.5 7L9 11.5 13.5 7" stroke={T.muted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HerbPlaceholder() {
  return (
    <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.22 }}>
      <svg width="38" height="38" viewBox="0 0 72 72" fill="none">
        <path d="M36 8C26 14 18 22 18 34a18 18 0 0 0 18 18 18 18 0 0 0 18-18C54 22 46 14 36 8z" stroke="#3D7A55" strokeWidth="2" fill="rgba(61,122,85,0.12)" />
        <path d="M36 22v26" stroke="#3D7A55" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 32c5-2 10-2 10 0" stroke="#3D7A55" strokeWidth="2" strokeLinecap="round" />
        <path d="M46 38c-5-2-10-2-10 0" stroke="#3D7A55" strokeWidth="2" strokeLinecap="round" />
        <circle cx="36" cy="52" r="3" fill="#3D7A55" opacity="0.45" />
      </svg>
    </div>
  );
}
function PackageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2 5l7-3 7 3v8l-7 3-7-3V5z" stroke={T.forestPrimary} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 2v13M2 5l7 3 7-3" stroke={T.forestPrimary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M9 2a5 5 0 0 1 5 5c0 4-5 9-5 9s-5-5-5-9a5 5 0 0 1 5-5z" stroke={T.forestPrimary} strokeWidth="1.5" />
      <circle cx="9" cy="7" r="2" stroke={T.forestPrimary} strokeWidth="1.4" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="2" y="5" width="14" height="10" rx="2" stroke={T.forestPrimary} strokeWidth="1.5" />
      <path d="M2 8h14" stroke={T.forestPrimary} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13" cy="11.5" r="1.2" fill={T.forestPrimary} />
    </svg>
  );
}
function DeliveryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2 11V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6" stroke={T.muted} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 7h2.5l2 3V13h-2M12 13H6" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.5" cy="13.5" r="1.5" stroke={T.muted} strokeWidth="1.5" />
      <circle cx="14" cy="13.5" r="1.5" stroke={T.muted} strokeWidth="1.5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 3C2.5 2.7 2.8 2.5 3 2.5h2.5l1 3-1.5 1c.8 1.6 2 2.8 3.5 3.5l1-1.5 3 1v2.5c0 .3-.2.5-.5.5C6 13.5 2.5 10 2.5 5.5V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
