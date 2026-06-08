'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCartShopping, faHeart, faStar,
  faLeaf, faSeedling, faMortarPestle,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { SeedMedicine } from '@/lib/medicineData';
import { Button } from '@/components/ui/Button';

/* ─── Tradition meta ─────────────────────────────────────────── */
const traditionLabel: Record<SeedMedicine['tradition'], string> = {
  siddha:   'சித்தம்',
  ayurveda: 'Ayurveda',
  natural:  'Natural',
};

const traditionIcon: Record<SeedMedicine['tradition'], IconDefinition> = {
  siddha:   faMortarPestle,
  ayurveda: faLeaf,
  natural:  faSeedling,
};

const artBg: Record<SeedMedicine['tradition'], string> = {
  siddha:   'linear-gradient(160deg, #071c12 0%, #0f3322 60%, #172e1e 100%)',
  ayurveda: 'linear-gradient(160deg, #0e1600 0%, #1f2e00 60%, #243410 100%)',
  natural:  'linear-gradient(160deg, #060d19 0%, #0f1d34 60%, #10243a 100%)',
};

const artIconColor: Record<SeedMedicine['tradition'], string> = {
  siddha:   '#3D8A5C',
  ayurveda: '#D4890A',
  natural:  '#4DB8A8',
};

const badgeColor: Record<SeedMedicine['tradition'], { bg: string; color: string; border: string }> = {
  siddha:   { bg: 'rgba(61,138,92,0.18)',  color: '#7EC89A', border: 'rgba(61,138,92,0.30)' },
  ayurveda: { bg: 'rgba(212,137,10,0.14)', color: '#E8A820', border: 'rgba(212,137,10,0.28)' },
  natural:  { bg: 'rgba(77,184,168,0.14)', color: '#4DB8A8', border: 'rgba(77,184,168,0.28)' },
};

/* ─── Star helpers ───────────────────────────────────────────── */
function StarBar({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {Array(full).fill(0).map((_, i) => (
        <FontAwesomeIcon key={`f${i}`} icon={faStar} style={{ width: 11, height: 11, color: '#f0c050' }} />
      ))}
      {half === 1 && (
        <FontAwesomeIcon icon={faStar} style={{ width: 11, height: 11, color: '#f0c050', opacity: 0.55 }} />
      )}
      {Array(empty).fill(0).map((_, i) => (
        <FontAwesomeIcon key={`e${i}`} icon={faStar} style={{ width: 11, height: 11, color: 'rgba(245,237,214,0.15)' }} />
      ))}
    </span>
  );
}

/* ─── ProductCard ────────────────────────────────────────────── */
export function ProductCard({
  product,
  onAddToCart,
  onWishlist,
}: {
  product: SeedMedicine;
  onAddToCart?: (product: SeedMedicine) => void;
  onWishlist?: (product: SeedMedicine) => void;
}) {
  const discount    = Math.max(0, Math.round((1 - product.price / product.mrp) * 100));
  const badge       = badgeColor[product.tradition];
  const icon        = traditionIcon[product.tradition];
  const iconColor   = artIconColor[product.tradition];
  const bg          = artBg[product.tradition];
  const label       = traditionLabel[product.tradition];
  const outOfStock  = !product.inStock;

  return (
    <article
      className="vt-fk-card"
      data-tradition={product.tradition}
      style={{ opacity: outOfStock ? 0.75 : 1 }}
    >
      {/* ── IMAGE AREA (Flipkart-style: white-ish bg, centered product art) ── */}
      <Link href={`/products/${product.slug}`} className="vt-fk-img-wrap" aria-label={`${product.nameEn} details`}>

        {/* Tradition badge — top left */}
        <span
          className="vt-fk-tradition-badge"
          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
        >
          {label}
        </span>

        {/* Rx badge — top right */}
        {product.prescriptionRequired && (
          <span className="vt-fk-rx-badge">℞ Rx</span>
        )}

        {/* Wishlist heart — top right corner */}
        <button
          className="vt-fk-wish-btn"
          type="button"
          onClick={(e) => { e.preventDefault(); onWishlist?.(product); }}
          aria-label={`Wishlist ${product.nameEn}`}
        >
          <FontAwesomeIcon icon={faHeart} style={{ width: 15, height: 15 }} />
        </button>

        {/* Artwork */}
        <div className="vt-fk-art" style={{ background: bg }}>
          {/* Large icon */}
          <div className="vt-fk-art-icon-wrap">
            <FontAwesomeIcon
              icon={icon}
              style={{ width: 52, height: 52, color: iconColor, filter: `drop-shadow(0 0 18px ${iconColor}60)` }}
            />
          </div>
          {/* Initials sub-label */}
          <span className="vt-fk-art-initials" style={{ color: iconColor }}>
            {product.nameEn.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          </span>
        </div>

        {/* Discount ribbon — only when in stock */}
        {discount > 0 && !outOfStock && (
          <span className="vt-fk-discount-ribbon">{discount}% off</span>
        )}
        {outOfStock && (
          <span className="vt-fk-oos-ribbon">Out of Stock</span>
        )}
      </Link>

      {/* ── PRODUCT INFO (Flipkart-style body) ─────────────────────── */}
      <div className="vt-fk-body">

        {/* Product name */}
        <Link href={`/products/${product.slug}`} className="vt-fk-name-link">
          <h3 className="vt-fk-name-ta">{product.nameTa}</h3>
          <p className="vt-fk-name-en">{product.nameEn}</p>
        </Link>

        {/* Rating row */}
        <div className="vt-fk-rating-row">
          <span className="vt-fk-rating-pill">
            <StarBar rating={product.rating} />
            <span className="vt-fk-rating-num">{product.rating.toFixed(1)}</span>
          </span>
          <span className="vt-fk-review-count">({product.reviewCount.toLocaleString()} reviews)</span>
        </div>

        {/* Price row — Flipkart style */}
        <div className="vt-fk-price-row">
          <span className="vt-fk-price">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="vt-fk-mrp">₹{product.mrp}</span>
          )}
          {discount > 0 && (
            <span className="vt-fk-save-badge">{discount}% off</span>
          )}
        </div>

        {/* Stock info */}
        <div className="vt-fk-stock-row">
          {product.inStock ? (
            <span className="vt-fk-in-stock">✓ In Stock · {product.stockCount} left</span>
          ) : (
            <span className="vt-fk-out-stock">✗ Currently unavailable</span>
          )}
        </div>

        {/* Rx warning */}
        {product.prescriptionRequired && (
          <p className="vt-fk-rx-note">
            ℞ Prescription required before checkout
          </p>
        )}

        {/* Actions — Flipkart style: full-width Add to Cart */}
        <div className="vt-fk-actions">
          <Button
            type="button"
            disabled={outOfStock}
            onClick={() => onAddToCart?.(product)}
            aria-label={`Add ${product.nameEn} to cart`}
            className={`vt-fk-cart-btn${outOfStock ? ' disabled' : ''}`}
          >
            <FontAwesomeIcon icon={faCartShopping} style={{ width: 15, height: 15 }} />
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </article>
  );
}
