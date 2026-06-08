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
      <Link href={`/products/${product.slug}`} aria-label={`${product.nameEn} details`}>
        <MedicineArt product={product} />
      </Link>
      <div className="vt-product-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start' }}>
          <span className="vt-badge">{traditionLabels[product.tradition]}</span>
          <span className={product.inStock ? 'vt-badge vt-badge-cyan' : 'vt-badge vt-badge-danger'}>
            {product.inStock ? `${product.stockCount} left` : 'Out'}
          </span>
        </div>
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 style={{ margin: 0, color: 'var(--vt-forest-950)', fontFamily: 'var(--vt-font-display)', fontSize: '1.14rem', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
              {product.nameTa}
            </h3>
          </Link>
          <p className="vt-muted" style={{ margin: '3px 0 0', fontSize: '0.9rem' }}>{product.nameEn}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--vt-gold-500)', fontWeight: 700 }}>
          <FontAwesomeIcon icon={faStar} style={{width: 16, height: 16}} />
          <span>{product.rating.toFixed(1)}</span>
          <span className="vt-muted" style={{ fontWeight: 500 }}>({product.reviewCount})</span>
        </div>
        <div className="vt-price-row">
          <span className="vt-price">₹{product.price}</span>
          <span className="vt-mrp">₹{product.mrp}</span>
          {discount > 0 && <span className="vt-badge vt-badge-gold">{discount}% off</span>}
        </div>
        {product.prescriptionRequired && (
          <div className="vt-safe-note" style={{ padding: 10, fontSize: '0.82rem' }}>
            Prescription verification required before checkout.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          <Button type="button" disabled={!product.inStock} onClick={() => onAddToCart?.(product)} aria-label={`Add ${product.nameEn} to cart`}>
            <FontAwesomeIcon icon={faCartShopping} style={{width: 17, height: 17}} />
            {product.inStock ? 'கூடையில் சேர்' : 'கையிருப்பில் இல்லை'}
          </Button>
          <button className="vt-icon-button" type="button" onClick={() => onWishlist?.(product)} aria-label={`Add ${product.nameEn} to wishlist`}>
            <FontAwesomeIcon icon={faHeart} style={{width: 18, height: 18}} />
          </button>
        </div>
      </div>
    </article>
  );
}
