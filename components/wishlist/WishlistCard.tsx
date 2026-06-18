'use client';

/**
 * apps/web/components/wishlist/WishlistCard.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Wishlist Product Card
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Product image with tradition-tinted fallback illustration
 *   • Tradition badge: சித்தா / ஆயுர்வேதம் / இயற்கை
 *   • Discount percentage badge (shown only when mrp > price)
 *   • Animated remove-from-wishlist heart button (filled ❤ → outline on hover)
 *   • Tamil product name (primary, display font)
 *   • English / botanical name (secondary, body font, muted)
 *   • Star rating row with review count
 *   • Stock status badge (in-stock / low-stock / out-of-stock)
 *   • Prescription-required indicator
 *   • Price row: current price (Lora serif) + MRP strikethrough
 *   • Add-to-Cart CTA  — delegates to onAddToCart prop
 *   • Product detail navigation via name + image links → /products/:slug
 *   • Loading states for add-to-cart and remove individually
 *   • Accessible: role, aria-label, aria-busy throughout
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See WishlistCardProps below.
 *
 * ─── Types exported ────────────────────────────────────────────────────────────
 *   WishlistItem — product snapshot stored in the wishlist collection
 */

import { useState }        from 'react';
import Link               from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faSeedling, faMortarPestle } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// ─── Design tokens (identical to all Iyarkai Nala modules) ───────────────────────
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

// ─── Tradition config ──────────────────────────────────────────────────────────
const TRADITION_STYLE: Record<
  WishlistItem['tradition'],
  { labelTa: string; bg: string; color: string; border: string; imageBg: string }
> = {
  siddha:    {
    labelTa: 'சித்தா',
    bg:      'rgba(61,138,92,0.12)',
    color:   T.leaf,
    border:  'rgba(61,138,92,0.24)',
    imageBg: 'linear-gradient(135deg, rgba(13,34,24,0.60) 0%, rgba(61,138,92,0.12) 100%)',
  },
  ayurveda:  {
    labelTa: 'ஆயுர்வேதம்',
    bg:      'rgba(212,137,10,0.12)',
    color:   T.gold,
    border:  'rgba(212,137,10,0.26)',
    imageBg: 'linear-gradient(135deg, rgba(13,34,24,0.60) 0%, rgba(212,137,10,0.12) 100%)',
  },
  natural:   {
    labelTa: 'இயற்கை',
    bg:      'rgba(61,138,92,0.08)',
    color:   T.forestPrimary,
    border:  'rgba(61,138,92,0.18)',
    imageBg: 'linear-gradient(135deg, rgba(13,34,24,0.60) 0%, rgba(61,138,92,0.08) 100%)',
  },
};

// ─── Button variant map (mirrors OrderHistoryCard exactly) ─────────────────────
type BtnVariant = 'primary' | 'ghost' | 'outline';

const BTN_STYLES: Record<BtnVariant, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
    color:      '#FFFFFF',
    border:     'none',
    boxShadow:  '0 4px 12px rgba(61,138,92,0.22)',
  },
  ghost: {
    background: 'rgba(61,138,92,0.12)',
    color:      T.goldPale,
    border:     '1px solid var(--vt-border)',
  },
  outline: {
    background: 'transparent',
    color:      T.goldPale,
    border:     `1.5px solid var(--vt-border)`,
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WishlistItem {
  /** Wishlist entry ID (not product ID) */
  id:                    string;
  productId:             string;
  /** URL slug for /products/:slug */
  slug:                  string;
  nameTa:                string;
  nameEn:                string;
  imageUrl?:             string;
  tradition:             'siddha' | 'ayurveda' | 'natural';
  /** Sale price in rupees */
  price:                 number;
  /** Maximum retail price in rupees */
  mrp:                   number;
  rating?:               number;   // 1.0 – 5.0
  reviewCount?:          number;
  inStock:               boolean;
  stockCount?:           number;
  addedAt:               string;   // ISO date
  prescriptionRequired?: boolean;
}

export interface WishlistCardProps {
  item:          WishlistItem;
  onAddToCart:   (item: WishlistItem) => Promise<void>;
  onRemove:      (id: string) => Promise<void>;
  addingToCart?: boolean;
  removing?:     boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function discountPct(price: number, mrp: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

function fmtPrice(rupees: number): string {
  return new Intl.NumberFormat('ta-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      aria-hidden="true"
      style={{ animation: 'vt-wc-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.30)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"
        strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function StarRow({ rating, count }: { rating: number; count?: number }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.4;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
      aria-label={`மதிப்பீடு: ${rating.toFixed(1)} / 5${count ? ` · ${count} மதிப்புரைகள்` : ''}`}
    >
      <span aria-hidden="true" style={{ display: 'flex', gap: '1px' }}>
        {Array.from({ length: full  }).map((_, i) => <Star key={`f${i}`} fill="full" />)}
        {half && <Star key="h"  fill="half" />}
        {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} fill="empty" />)}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontFamily: FONT.body,
            fontSize:   '11px',
            color:      T.muted,
            lineHeight: 1,
          }}
        >
          ({count > 999 ? '999+' : count})
        </span>
      )}
    </div>
  );
}

function Star({ fill }: { fill: 'full' | 'half' | 'empty' }) {
  const filled = fill === 'full';
  const isHalf = fill === 'half';
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      {isHalf ? (
        <>
          <defs>
            <linearGradient id="vt-wc-half">
              <stop offset="50%" stopColor={T.gold} />
              <stop offset="50%" stopColor="none" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="url(#vt-wc-half)"
            stroke={T.gold}
            strokeWidth="1.2"
          />
        </>
      ) : (
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={filled ? T.gold : 'none'}
          stroke={filled ? T.gold : T.border}
          strokeWidth="1.4"
        />
      )}
    </svg>
  );
}

function StockBadge({ inStock, stockCount }: { inStock: boolean; stockCount?: number }) {
  if (!inStock) {
    return (
      <span
        style={{
          fontFamily:   FONT.body,
          fontSize:     '11px',
          fontWeight:   700,
          color:        T.terracotta,
          background:   'rgba(139,58,47,0.08)',
          border:       '1px solid rgba(139,58,47,0.20)',
          padding:      '2px 8px',
          borderRadius: '100px',
          lineHeight:   1.6,
          whiteSpace:   'nowrap',
        }}
      >
        கையிருப்பு இல்லை
      </span>
    );
  }

  if (stockCount !== undefined && stockCount <= 5) {
    return (
      <span
        style={{
          fontFamily:   FONT.body,
          fontSize:     '11px',
          fontWeight:   700,
          color:        T.saffron,
          background:   'rgba(224,123,57,0.09)',
          border:       '1px solid rgba(224,123,57,0.22)',
          padding:      '2px 8px',
          borderRadius: '100px',
          lineHeight:   1.6,
          whiteSpace:   'nowrap',
        }}
      >
        மட்டும் {stockCount} மிச்சம்!
      </span>
    );
  }

  return (
    <span
      style={{
        fontFamily:   FONT.body,
        fontSize:     '11px',
        fontWeight:   700,
        color:        T.leaf,
        background:   'rgba(61,122,85,0.08)',
        border:       '1px solid rgba(61,122,85,0.20)',
        padding:      '2px 8px',
        borderRadius: '100px',
        lineHeight:   1.6,
        whiteSpace:   'nowrap',
      }}
    >
      ✓ கையிருப்பில் உள்ளது
    </span>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function WishlistCard({
  item,
  onAddToCart,
  onRemove,
  addingToCart = false,
  removing     = false,
}: WishlistCardProps) {
  const [heartHover, setHeartHover] = useState(false);
  const [imgError,   setImgError]   = useState(false);

  const tradStyle = TRADITION_STYLE[item.tradition];
  const discount  = discountPct(item.price, item.mrp);
  const productHref = `/products/${item.slug}`;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (addingToCart || !item.inStock) return;
    onAddToCart(item);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (removing) return;
    onRemove(item.id);
  };

  return (
    <article
      aria-label={item.nameTa}
      style={{
        background:   'var(--vt-card)',
        border:       `1px solid var(--vt-border)`,
        borderRadius: '20px',
        overflow:     'hidden',
        boxShadow:    'var(--vt-shadow-xs)',
        display:      'flex',
        flexDirection:'column',
        transition:   'box-shadow 0.2s ease, transform 0.2s ease',
      }}
    >
      {/* ── Image zone ────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <Link
          href={productHref}
          tabIndex={-1}
          aria-hidden="true"
          style={{ display: 'block', textDecoration: 'none' }}
        >
          <div
            style={{
              aspectRatio: '1 / 1',
              background:  tradStyle.imageBg,
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              overflow:    'hidden',
              position:    'relative',
            }}
          >
            {item.imageUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.nameTa}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                style={{
                  width:      '100%',
                  height:     '100%',
                  objectFit:  'cover',
                  transition: 'transform 0.3s ease',
                }}
              />
            ) : (
              <HerbPlaceholder tradition={item.tradition} />
            )}
          </div>
        </Link>

        {/* Tradition badge — top-left */}
        <span
          style={{
            position:     'absolute',
            top:          '10px',
            left:         '10px',
            fontFamily:   FONT.body,
            fontSize:     '10px',
            fontWeight:   700,
            background:   tradStyle.bg,
            color:        tradStyle.color,
            border:       `1px solid ${tradStyle.border}`,
            padding:      '3px 9px',
            borderRadius: '100px',
            lineHeight:   1.6,
            backdropFilter: 'blur(4px)',
            whiteSpace:   'nowrap',
          }}
        >
          {tradStyle.labelTa}
        </span>

        {/* Discount badge — top-right */}
        {discount > 0 && (
          <span
            style={{
              position:     'absolute',
              top:          '10px',
              right:        '46px',
              fontFamily:   FONT.display,
              fontSize:     '10px',
              fontWeight:   700,
              background:   `linear-gradient(135deg, ${T.saffron} 0%, ${T.gold} 100%)`,
              color:        '#FFFFFF',
              padding:      '3px 8px',
              borderRadius: '100px',
              lineHeight:   1.6,
              whiteSpace:   'nowrap',
            }}
          >
            {discount}% தள்ளுபடி
          </span>
        )}

        {/* Remove / heart button — top-right */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          aria-label={removing ? 'நீக்குகிறோம்...' : 'விருப்பப்பட்டியலிலிருந்து நீக்கு'}
          aria-busy={removing}
          onMouseEnter={() => setHeartHover(true)}
          onMouseLeave={() => setHeartHover(false)}
          style={{
            position:       'absolute',
            top:            '8px',
            right:          '8px',
            width:          '34px',
            height:         '34px',
            borderRadius:   '50%',
            background:     heartHover && !removing
              ? 'rgba(249,92,56,0.14)'
              : 'rgba(13,34,24,0.70)',
            border:         heartHover && !removing
              ? '1px solid rgba(249,92,56,0.30)'
              : '1px solid var(--vt-border)',
            backdropFilter: 'blur(4px)',
            cursor:         removing ? 'not-allowed' : 'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            transition:     'all 0.18s ease',
            padding:        0,
            flexShrink:     0,
          }}
        >
          {removing ? (
            <Spinner />
          ) : (
            <HeartIcon hovered={heartHover} />
          )}
        </button>
      </div>

      {/* ── Content zone ──────────────────────────────────────────────── */}
      <div
        style={{
          padding:       '14px 14px 0',
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          gap:           '6px',
        }}
      >
        {/* Tamil name → links to product detail */}
        <Link
          href={productHref}
          style={{ textDecoration: 'none' }}
        >
          <h3
            style={{
              fontFamily:   FONT.display,
              fontSize:     '15px',
              fontWeight:   700,
              color:        T.darkText,
              margin:       0,
              lineHeight:   1.35,
              display:      '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow:     'hidden',
            }}
          >
            {item.nameTa}
          </h3>
        </Link>

        {/* English name */}
        {item.nameEn && (
          <p
            style={{
              fontFamily:  FONT.body,
              fontSize:    '11px',
              color:       T.muted,
              margin:      0,
              lineHeight:  1.4,
              overflow:    'hidden',
              textOverflow:'ellipsis',
              whiteSpace:  'nowrap',
            }}
          >
            {item.nameEn}
          </p>
        )}

        {/* Rating */}
        {item.rating !== undefined && item.rating > 0 && (
          <StarRow rating={item.rating} count={item.reviewCount} />
        )}

        {/* Stock + Prescription */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <StockBadge inStock={item.inStock} stockCount={item.stockCount} />
          {item.prescriptionRequired && (
            <span
              style={{
                fontFamily:   FONT.body,
                fontSize:     '10px',
                fontWeight:   700,
                color:        '#6B3280',
                background:   'rgba(107,50,128,0.07)',
                border:       '1px solid rgba(107,50,128,0.20)',
                padding:      '2px 7px',
                borderRadius: '100px',
                lineHeight:   1.6,
                whiteSpace:   'nowrap',
              }}
            >
              ℛ மருந்து சீட்டு
            </span>
          )}
        </div>

        {/* Price row */}
        <div
          style={{
            display:    'flex',
            alignItems: 'baseline',
            gap:        '8px',
            marginTop:  '2px',
          }}
        >
          <span
            style={{
              fontFamily: FONT.serif,
              fontSize:   '20px',
              fontWeight: 700,
              color:      T.darkText,
              lineHeight: 1,
            }}
          >
            {fmtPrice(item.price)}
          </span>
          {discount > 0 && (
            <span
              style={{
                fontFamily:     FONT.serif,
                fontSize:       '13px',
                fontWeight:     400,
                color:          T.muted,
                textDecoration: 'line-through',
                lineHeight:     1,
              }}
            >
              {fmtPrice(item.mrp)}
            </span>
          )}
        </div>
      </div>

      {/* ── CTA zone ──────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 14px 14px' }}>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addingToCart || !item.inStock}
          aria-label={
            !item.inStock
              ? 'கையிருப்பு இல்லை'
              : addingToCart
              ? 'கூடையில் சேர்க்கிறோம்...'
              : `${item.nameTa} கூடையில் சேர்க்கவும்`
          }
          aria-busy={addingToCart}
          style={{
            width:          '100%',
            height:         '42px',
            padding:        '0 14px',
            borderRadius:   '12px',
            cursor:         addingToCart || !item.inStock ? 'not-allowed' : 'pointer',
            fontFamily:     FONT.display,
            fontSize:       '13px',
            fontWeight:     700,
            letterSpacing:  '0.01em',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '7px',
            transition:     'opacity 0.15s ease, transform 0.12s ease',
            opacity:        !item.inStock ? 0.48 : 1,
            ...(!item.inStock
              ? {
                  background: T.creamAlt,
                  color:      T.muted,
                  border:     `1px solid ${T.border}`,
                  boxShadow:  'none',
                }
              : BTN_STYLES.primary),
          }}
        >
          {addingToCart ? (
            <>
              <Spinner />
              <span>சேர்க்கிறோம்...</span>
            </>
          ) : (
            <>
              <CartIcon outOfStock={!item.inStock} />
              <span>
                {item.inStock ? 'கூடையில் சேர்க்கவும்' : 'கையிருப்பு இல்லை'}
              </span>
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes vt-wc-spin { to { transform: rotate(360deg); } }
      `}</style>
    </article>
  );
}

// ─── HerbPlaceholder ─────────────────────────────────────────────────────────

const PLACEHOLDER_ICONS: Record<WishlistItem['tradition'], IconDefinition> = {
  siddha:   faMortarPestle,
  ayurveda: faLeaf,
  natural:  faSeedling,
};

function HerbPlaceholder({ tradition }: { tradition: WishlistItem['tradition'] }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width:          '100%',
        height:         '100%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        opacity:        0.55,
        userSelect:     'none',
      }}
    >
      <FontAwesomeIcon icon={PLACEHOLDER_ICONS[tradition]} style={{ width: 44, height: 44, color: 'rgba(61,138,92,0.40)' }} />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HeartIcon({ hovered }: { hovered: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      aria-hidden="true"
      style={{ transition: 'all 0.18s ease', flexShrink: 0 }}
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={hovered ? T.terracotta : T.gold}
        stroke={hovered ? T.terracotta : T.gold}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={hovered ? 0.85 : 1}
      />
    </svg>
  );
}

function CartIcon({ outOfStock }: { outOfStock: boolean }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none"
      aria-hidden="true" style={{ flexShrink: 0 }}
    >
      <path
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        stroke={outOfStock ? T.muted : 'currentColor'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="3" y1="6" x2="21" y2="6"
        stroke={outOfStock ? T.muted : 'currentColor'}
        strokeWidth="2" strokeLinecap="round"
      />
      <path d="M16 10a4 4 0 0 1-8 0"
        stroke={outOfStock ? T.muted : 'currentColor'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
