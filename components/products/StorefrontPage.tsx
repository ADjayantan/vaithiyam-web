'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBoxOpen, faCircleCheck, faFilter, faMagnifyingGlass, faShieldHalved, faStethoscope, faUpload, faDroplet, faAppleWhole, faBolt, faTemperatureHalf, faFlask, faWandSparkles, faLeaf, faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { MedicineCategory, SeedMedicine, Tradition } from '@/lib/medicineData';
import { ButtonLink } from '@/components/ui/Button';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';
import { ProductCard } from '@/components/products/ProductCard';

type StockFilter = 'all' | 'in-stock' | 'rx';
type SortKey = 'newest' | 'price-low' | 'price-high' | 'rating';

const defaultCategories: MedicineCategory[] = [
  { id: 'all', nameTa: 'அனைத்தும்', nameEn: 'All', slug: 'all', icon: 'Leaf', createdAt: '' },
];

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

function productQuery({ search, tradition, category, stock, sort }: { search: string; tradition: Tradition | 'all'; category: string; stock: StockFilter; sort: SortKey }) {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (tradition !== 'all') params.set('tradition', tradition);
  if (category !== 'all') params.set('category', category);
  if (stock === 'in-stock') params.set('inStock', 'true');
  if (stock === 'rx') params.set('prescriptionRequired', 'true');
  params.set('sort', sort);
  params.set('limit', '48');
  return `/api/products?${params.toString()}`;
}

const CAT_META: Record<string, { icon: IconDefinition; bg: string; fg: string }> = {
  'siddha':           { icon: faLeaf,          bg: '#e3f7ed', fg: '#1b8a58' },
  'ayurveda':         { icon: faWandSparkles,  bg: '#fdf5d0', fg: '#b07800' },
  'natural-wellness': { icon: faFlask,         bg: '#d9f5f4', fg: '#0f8a86' },
  'digestive-care':   { icon: faAppleWhole,    bg: '#fff0e6', fg: '#c45e00' },
  'skin-care':        { icon: faWandSparkles,  bg: '#fce8f0', fg: '#b03070' },
  'hair-care':        { icon: faDroplet,       bg: '#ede8ff', fg: '#6d28d9' },
  'immunity-support': { icon: faShieldHalved,  bg: '#dbeafe', fg: '#1d4ed8' },
  'general-wellness': { icon: faHeartPulse,    bg: '#fde8e8', fg: '#be123c' },
  'pain-relief':      { icon: faBolt,          bg: '#ffedd5', fg: '#c2410c' },
  'fever-care':       { icon: faTemperatureHalf, bg: '#e0e7ff', fg: '#4338ca' },
};
const DEFAULT_CAT_META = { icon: faLeaf, bg: '#e3f7ed', fg: '#1b8a58' };

export function StorefrontPage({
  mode = 'home',
  initialCategory,
  initialTradition,
  initialSort,
}: {
  mode?: 'home' | 'products';
  initialCategory?: string;
  initialTradition?: Tradition | 'all';
  initialSort?: SortKey;
}) {
  const [products, setProducts] = useState<SeedMedicine[]>([]);
  const [categories, setCategories] = useState<MedicineCategory[]>(defaultCategories);
  const [search, setSearch] = useState('');
  const [tradition, setTradition] = useState<Tradition | 'all'>(initialTradition ?? 'all');
  const [category, setCategory] = useState(initialCategory ?? 'all');
  const [stock, setStock] = useState<StockFilter>('all');
  const [sort, setSort] = useState<SortKey>(initialSort ?? 'newest');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(productQuery({ search, tradition, category, stock, sort }), { cache: 'no-store' });
      if (!res.ok) throw new Error('products failed');
      const data = await res.json() as { products: SeedMedicine[] };
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
      showToast('Products could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, search, showToast, sort, stock, tradition]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.ok ? res.json() : null)
      .then((data: { categories?: MedicineCategory[] } | null) => {
        setCategories([...defaultCategories, ...(data?.categories ?? [])]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProducts(), 220);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((data: { cartItemCount?: number } | null) => {
        setCartCount(data?.cartItemCount ?? 0);
      })
      .catch(() => {});
  }, []);

  const featured = useMemo(() => ({
    popular: products.filter((product) => product.rating >= 4.5).slice(0, 4),
    newlyAdded: [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    wellness: products.filter((product) => ['general-wellness', 'natural-wellness', 'immunity-support'].includes(product.categorySlug)).slice(0, 4),
    prescription: products.filter((product) => product.prescriptionRequired).slice(0, 4),
  }), [products]);

  const addToCart = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) {
      showToast('Please login to add medicines to cart.');
      return;
    }

    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, qty: 1 }),
      });
      const data = await res.json().catch(() => ({})) as { cartItemCount?: number; message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Could not add to cart.');
      setCartCount((count) => data.cartItemCount ?? count + 1);
      showToast(`${product.nameTa} added to cart.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not add to cart.');
    }
  }, [showToast]);

  const addToWishlist = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) {
      showToast('Please login to save wishlist items.');
      return;
    }

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Could not add to wishlist.');
      showToast(data.message ?? 'Added to wishlist.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not add to wishlist.');
    }
  }, [showToast]);

  return (
    <div className="vt-page-shell">
      <CustomerHeader cartCount={cartCount} searchValue={search} onSearchChange={setSearch} />
      <section className="vt-hero">
        <div className="vt-container vt-hero-grid">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1>Vaithiyam for verified traditional medicine shopping</h1>
            <p className="vt-hero-copy">
              Tamil-friendly Siddha, Ayurveda, and natural wellness products with prescription checks where needed. Educational product details only; always consult a doctor or pharmacist.
            </p>
            <div className="vt-search-panel" style={{ marginTop: 24 }}>
              <div className="vt-search-box">
                <FontAwesomeIcon aria-hidden="true" icon={faMagnifyingGlass} style={{width: 20, height: 20}} />
                <input className="vt-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Tamil, English, category, or slug" />
              </div>
              <ButtonLink href="/products" variant="gold">Shop Medicines <FontAwesomeIcon icon={faArrowRight} style={{width: 18, height: 18}} /></ButtonLink>
              <ButtonLink href="/prescriptions" variant="ghost"><FontAwesomeIcon icon={faUpload} style={{width: 18, height: 18}} /> Upload Prescription</ButtonLink>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
              {[
                ['Safe checkout',      faShieldHalved],
                ['Verified products',  faCircleCheck],
                ['Tamil support',      faStethoscope],
              ].map(([label, icon]) => (
                <span key={String(label)} className="vt-badge vt-badge-cyan" style={{ color: '#dff8f6', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}>
                  <FontAwesomeIcon icon={icon as typeof faShieldHalved} style={{ width: 14, height: 14 }} /> {String(label)}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div className="vt-card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.45 }} style={{ padding: 20, background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.62)' }}>Prescription desk</p>
                  <h2 style={{ margin: '4px 0 0', fontFamily: 'var(--vt-font-display)', fontSize: '1.65rem' }}>Verification before purchase</h2>
                </div>
                <FontAwesomeIcon icon={faShieldHalved} style={{width: 40, height: 40, color: "var(--vt-gold-300)"}} />
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>
                Products marked Rx cannot be ordered directly. Upload a prescription and proceed with pending verification or admin approval.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {['Upload', 'Review', 'Order'].map((label, index) => (
                  <div key={label} style={{ padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <strong>{index + 1}</strong>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.72)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <main>
        <section className="vt-section">
          <div className="vt-container">
            <div className="vt-section-heading">
              <div>
                <h2>Shop by care category</h2>
                <p>Siddha, Ayurveda, Natural, pain relief, fever care, digestive care, skin, hair, wellness, and prescription-required products.</p>
              </div>
            </div>
            {mode === 'products' ? (
              /* Visual category grid for /products page */
              <div className="vt-category-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 8 }}>
                {categories.map((item) => {
                  const meta = CAT_META[item.slug] ?? DEFAULT_CAT_META;
                  const isActive = category === item.slug;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => setCategory(item.slug)}
                      className="vt-category-card"
                      style={{
                        cursor: 'pointer', textAlign: 'left', border: 'none', background: 'none',
                        boxShadow: isActive ? '0 0 0 2px var(--vt-emerald-600)' : undefined,
                        transform: isActive ? 'scale(1.03)' : undefined,
                        transition: 'transform 160ms, box-shadow 160ms',
                      }}
                    >
                      <span
                        className="vt-category-icon"
                        style={{ width: 46, height: 46, borderRadius: 14, background: meta.bg, color: meta.fg, display: 'grid', placeItems: 'center' }}
                      >
                        <FontAwesomeIcon icon={meta.icon} style={{ width: 20, height: 20 }} />
                      </span>
                      <strong style={{ fontFamily: 'var(--vt-font-display)', fontSize: '0.9rem', lineHeight: 1.45, letterSpacing: 0, color: isActive ? 'var(--vt-emerald-600)' : 'var(--vt-forest-900)' }}>
                        {item.nameTa}
                      </strong>
                      <span style={{ fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)', fontWeight: 600 }}>{item.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Chip row for home mode */
              <div className="vt-chip-row" role="list" aria-label="Category filters">
                {categories.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    className={`vt-chip ${category === item.slug ? 'vt-chip-active' : ''}`}
                    onClick={() => setCategory(item.slug)}
                  >
                    {item.nameEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="vt-section" style={{ paddingTop: 4 }}>
          <div className="vt-container">
            <div className="vt-card" style={{ padding: 14, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: 'var(--vt-forest-800)' }}>
                <FontAwesomeIcon icon={faFilter} style={{width: 18, height: 18}} /> Search, filter, and sort
              </div>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <select className="vt-select" value={tradition} onChange={(event) => setTradition(event.target.value as Tradition | 'all')} aria-label="Filter by tradition">
                  <option value="all">All traditions</option>
                  <option value="siddha">Siddha</option>
                  <option value="ayurveda">Ayurveda</option>
                  <option value="natural">Natural</option>
                </select>
                <select className="vt-select" value={stock} onChange={(event) => setStock(event.target.value as StockFilter)} aria-label="Filter by stock or prescription">
                  <option value="all">All stock states</option>
                  <option value="in-stock">In stock only</option>
                  <option value="rx">Prescription required</option>
                </select>
                <select className="vt-select" value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Sort medicines">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price low to high</option>
                  <option value="price-high">Price high to low</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {mode === 'home' && (
          <>
            <FeaturedSection title="Popular medicines" products={featured.popular} onAddToCart={addToCart} onWishlist={addToWishlist} />
            <FeaturedSection title="Newly added" products={featured.newlyAdded} onAddToCart={addToCart} onWishlist={addToWishlist} />
            <FeaturedSection title="Common wellness products" products={featured.wellness} onAddToCart={addToCart} onWishlist={addToWishlist} />
            <FeaturedSection title="Prescription required" products={featured.prescription} onAddToCart={addToCart} onWishlist={addToWishlist} />
          </>
        )}

        <section className="vt-section">
          <div className="vt-container">
            <div className="vt-section-heading">
              <div>
                <h2>{mode === 'products' ? 'All medicines' : 'Product catalogue'}</h2>
                <p>Every product page includes educational information and doctor/pharmacist consultation warnings.</p>
              </div>
            </div>
            {loading ? (
              <div className="vt-grid">
                {Array.from({ length: 8 }, (_, index) => <div key={index} className="vt-skeleton" style={{ height: 360 }} />)}
              </div>
            ) : products.length > 0 ? (
              <div className="vt-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} onWishlist={addToWishlist} />
                ))}
              </div>
            ) : (
              <div className="vt-card vt-empty-state">
                <FontAwesomeIcon icon={faBoxOpen} style={{width: 48, height: 48, color: "var(--vt-emerald-600)"}} />
                <h3 style={{ margin: 0, fontFamily: 'var(--vt-font-display)' }}>No products found</h3>
                <p className="vt-muted" style={{ margin: 0 }}>Try a different category, tradition, or search term.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <CustomerFooter />
      <MobileBottomNav />
      {toast && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 94, zIndex: 100, transform: 'translateX(-50%)', padding: '12px 18px', borderRadius: 16, background: 'var(--vt-forest-900)', color: '#fff', boxShadow: 'var(--vt-shadow-soft)', fontWeight: 800, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function FeaturedSection({
  title,
  products,
  onAddToCart,
  onWishlist,
}: {
  title: string;
  products: SeedMedicine[];
  onAddToCart: (product: SeedMedicine) => void;
  onWishlist: (product: SeedMedicine) => void;
}) {
  if (products.length === 0) return null;

  return (
    <section className="vt-section" style={{ paddingTop: 10, paddingBottom: 10 }}>
      <div className="vt-container">
        <div className="vt-section-heading">
          <h2>{title}</h2>
        </div>
        <div className="vt-grid">
          {products.map((product) => (
            <ProductCard key={`${title}-${product.id}`} product={product} onAddToCart={onAddToCart} onWishlist={onWishlist} />
          ))}
        </div>
      </div>
    </section>
  );
}
