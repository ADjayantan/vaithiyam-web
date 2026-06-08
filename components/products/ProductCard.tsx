'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart, faStar } from '@fortawesome/free-solid-svg-icons';
import type { SeedMedicine } from '@/lib/medicineData';
import { MedicineArt } from '@/components/ui/MedicineArt';
import { Button } from '@/components/ui/Button';

const traditionLabels: Record<SeedMedicine['tradition'], string> = {
  siddha:   'சித்தம்',
  ayurveda: 'Ayurveda',
  natural:  'Natural',
};

export function ProductCard({
  product,
  onAddToCart,
  onWishlist,
}: {
  product: SeedMedicine;
  onAddToCart?: (product: SeedMedicine) => void;
  onWishlist?: (product: SeedMedicine) => void;
}) {
  const discount = Math.max(0, Math.round((1 - product.price / product.mrp) * 100));

  return (
    <article
      className="vt-card vt-card-solid vt-product-card"
      data-tradition={product.tradition}
    >
      {/* Product art image area */}
      <Link href={`/products/${product.slug}`} aria-label={`${product.nameEn} details`}>
        <MedicineArt product={product} />
      </Link>

      {/* Card body — flex column, actions pinned to bottom */}
      <div className="vt-product-body">
        {/* Badges row */}
        <div className="vt-product-meta">
          <span className="vt-badge vt-badge-tradition">{traditionLabels[product.tradition]}</span>
          <span className={product.inStock ? 'vt-badge vt-stock-in' : 'vt-badge vt-stock-out'}>
            {product.inStock ? `${product.stockCount} left` : 'Out of stock'}
          </span>
        </div>

        {/* Names */}
        <div className="vt-product-names">
          <Link href={`/products/${product.slug}`}>
            <h3 className="vt-product-title">{product.nameTa}</h3>
          </Link>
          <p className="vt-product-subtitle">{product.nameEn}</p>
        </div>

        {/* Rating */}
        <div className="vt-product-rating">
          <FontAwesomeIcon icon={faStar} style={{ width: 14, height: 14 }} />
          <span className="vt-rating-value">{product.rating.toFixed(1)}</span>
          <span className="vt-muted vt-rating-count">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="vt-price-row">
          <span className="vt-price">₹{product.price}</span>
          <span className="vt-mrp">₹{product.mrp}</span>
          {discount > 0 && <span className="vt-discount-badge">{discount}% off</span>}
        </div>

        {/* Rx note */}
        {product.prescriptionRequired && (
          <p className="vt-rx-note">
            ℞ Prescription verification required before checkout.
          </p>
        )}

        {/* Actions — always pinned to bottom via margin-top: auto on parent */}
        <div className="vt-product-actions">
          <Button
            type="button"
            disabled={!product.inStock}
            onClick={() => onAddToCart?.(product)}
            aria-label={`Add ${product.nameEn} to cart`}
            className="vt-btn-add vt-button-primary"
          >
            <FontAwesomeIcon icon={faCartShopping} style={{ width: 14, height: 14 }} />
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          <button
            className="vt-btn-icon"
            type="button"
            onClick={() => onWishlist?.(product)}
            aria-label={`Add ${product.nameEn} to wishlist`}
          >
            <FontAwesomeIcon icon={faHeart} style={{ width: 16, height: 16, color: 'var(--vt-rose-500)' }} />
          </button>
        </div>
      </div>
    </article>
  );
}
