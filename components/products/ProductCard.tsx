'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCartShopping, faLeaf, faSeedling, faMortarPestle,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarReg, faHeart as faHeartReg } from '@fortawesome/free-regular-svg-icons';
import type { SeedMedicine } from '@/lib/medicineData';
import { Button } from '@/components/ui/Button';

/* ─── Tradition meta ─────────────────────────────────────────── */
const traditionLabel: Record<SeedMedicine['tradition'], string> = {
  siddha:   'சித்தம்',
  ayurveda: 'AYURVEDA',
  natural:  'NATURAL',
};

const badgeColor: Record<SeedMedicine['tradition'], { bg: string; color: string; border: string }> = {
  siddha:   { bg: 'rgba(61,138,92,0.18)',  color: '#7EC89A', border: 'rgba(61,138,92,0.30)' },
  ayurveda: { bg: 'rgba(212,137,10,0.14)', color: '#E8A820', border: 'rgba(212,137,10,0.28)' },
  natural:  { bg: 'rgba(77,184,168,0.14)', color: '#4DB8A8', border: 'rgba(77,184,168,0.28)' },
};

/* ─── Star helpers ───────────────────────────────────────────── */
function StarBar() {
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {Array(5).fill(0).map((_, i) => (
        <FontAwesomeIcon key={i} icon={faStarReg} style={{ width: 11, height: 11, color: '#E8A820' }} />
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
  const label       = traditionLabel[product.tradition];
  const outOfStock  = !product.inStock;

  return (
    <article
      className="vt-fk-card"
      data-tradition={product.tradition}
      style={{ opacity: outOfStock ? 0.75 : 1 }}
    >
      {/* ── IMAGE AREA (Flipkart-style: white-ish bg, centered product art) ── */}
      <div className="vt-fk-img-wrap-container" style={{ position: 'relative' }}>
        <Link href={`/products/${product.slug}`} className="vt-fk-img-wrap" aria-label={`${product.nameEn} details`}>
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.nameEn}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Artwork fallback if no image */}
          {!product.imageUrl && (
            <div className="vt-fk-art" style={{ background: 'linear-gradient(160deg, #0e1600 0%, #1f2e00 60%, #243410 100%)' }}>
              <div className="vt-fk-art-icon-wrap">
                <FontAwesomeIcon
                  icon={product.tradition === 'siddha' ? faMortarPestle : product.tradition === 'natural' ? faSeedling : faLeaf}
                  style={{ width: 52, height: 52, color: '#D4890A', filter: 'drop-shadow(0 0 18px #D4890A60)' }}
                />
              </div>
              <span className="vt-fk-art-initials" style={{ color: '#D4890A' }}>
                {product.nameEn.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* Badges container — top left stacked */}
        <div className="vt-fk-badge-container">
          <span
            className="vt-fk-tradition-badge"
            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
          >
            {label}
          </span>
          {product.prescriptionRequired && (
            <span className="vt-fk-rx-badge">
              <FontAwesomeIcon icon={faClipboardList} style={{ width: 9, height: 9, marginRight: 4 }} />
              Rx
            </span>
          )}
        </div>

        {/* Wishlist heart — top right corner */}
        <button
          className="vt-fk-wish-btn"
          type="button"
          onClick={(e) => { e.preventDefault(); onWishlist?.(product); }}
          aria-label={`Wishlist ${product.nameEn}`}
        >
          <FontAwesomeIcon icon={faHeartReg} style={{ width: 16, height: 16 }} />
        </button>

        {/* Discount ribbon — only when in stock */}
        {discount > 0 && !outOfStock && (
          <span className="vt-fk-discount-ribbon">{discount}% off</span>
        )}

        {/* Out of Stock banner overlay */}
        {outOfStock && (
          <div className="vt-fk-oos-overlay">
            <span className="vt-fk-oos-banner">OUT OF STOCK</span>
          </div>
        )}
      </div>

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
            <StarBar />
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
          <div className="vt-fk-rx-note-box">
            <FontAwesomeIcon icon={faClipboardList} style={{ width: 12, height: 12, flexShrink: 0 }} />
            <span>PRESCRIPTION REQUIRED BEFORE CHECKOUT</span>
          </div>
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
            <FontAwesomeIcon icon={faCartShopping} style={{ width: 14, height: 14 }} />
            {outOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
          </Button>
        </div>
      </div>
    </article>
  );
}
