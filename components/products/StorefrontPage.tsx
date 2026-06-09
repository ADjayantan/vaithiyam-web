'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faBoxOpen, faCircleCheck, faFilter, faMagnifyingGlass, faShieldHalved, faStethoscope, faUpload, faLeaf, faCartShopping } from '@fortawesome/free-solid-svg-icons';
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

const CATALOGUE_CARDS = [
  {
    image: '/catalogue-ref-1.png',
    nameTa: 'அழுக்கரா மாத்திரை',
    nameEn: 'நரம்பு தளர்ச்சி மற்றும் தூக்கமின்மை',
    price: '₹450.00',
    slug: 'ashwagandha-churnam',
  },
  {
    image: '/catalogue-ref-2.png',
    nameTa: 'திரிபலா சூரணம்',
    nameEn: 'செரிமான மண்டல ஆரோக்கியம்',
    price: '₹280.00',
    slug: 'triphala-churnam',
  },
  {
    image: '/catalogue-ref-3.png',
    nameTa: 'அருகம்புல் தைலம்',
    nameEn: 'தோல் வியாதிகளுக்கான சித்த தீர்வு',
    price: '₹520.00',
    slug: 'arugampul-powder',
  },
  {
    image: '/catalogue-ref-4.png',
    nameTa: 'சவன்பிராஷ் லேகியம்',
    nameEn: 'நோய் எதிர்ப்பு சக்தி மேம்பாடு',
    price: '₹750.00',
    slug: 'daily-wellness-combo',
  },
  {
    image: '/catalogue-ref-5.png',
    nameTa: 'பிரம்ம நிவாரணி',
    nameEn: 'ஞாபக சக்தி மற்றும் மன அமைதி',
    price: '₹390.00',
    slug: 'brahmi-oil',
  },
  {
    image: '/catalogue-ref-6.png',
    nameTa: 'அரிஷ்டம்',
    nameEn: 'இரத்தச் சுத்திகரிப்பு மற்றும் மெலிவு',
    price: '₹640.00',
    slug: 'jeeraka-arishtam',
  },
] as const;

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

  if (mode === 'products') {
    const actionProducts = CATALOGUE_CARDS.map((card, index) => (
      products.find((product) => product.slug === card.slug) ?? products[index]
    ));

    return (
      <div className="vt-catalogue-page" style={{ minHeight: '100dvh', background: '#061711', color: '#e8e4dd', fontFamily: "'Outfit','Catamaran',system-ui,sans-serif" }}>
        <CatalogueNav cartCount={cartCount} />

        <main className="vt-catalogue-main" style={{ width: 'min(1324px, calc(100% - 48px))', margin: '0 auto', padding: '34px 0 108px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#9ea7a1', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>முகப்பு</Link>
            <span>›</span>
            <span style={{ color: '#d8d3ca' }}>சித்த மருத்துவம்</span>
          </div>

          <section style={{ marginBottom: 66 }}>
            <h1 style={{
              margin: '0 0 24px',
              fontFamily: "'Noto Serif Tamil','Catamaran',serif",
              fontSize: 'clamp(3.8rem, 5vw, 5.15rem)',
              lineHeight: 1.02,
              fontWeight: 700,
              color: '#f0efec',
              letterSpacing: 0,
            }}>
              மூலிகை மருந்துகள்
            </h1>
            <p style={{ margin: 0, maxWidth: 800, color: '#a5aca7', fontSize: '1.35rem', lineHeight: 1.72, fontWeight: 500 }}>
              ஆய்வுக்கணக்கான ஆண்டுகளால் பாரம்பரியமும் நவீன மருத்துவ அறிவியலும் இணைந்த உயர்தர மூலிகை சிகிச்சைகள்.
            </p>
          </section>

          <section className="vt-catalogue-layout" style={{ display: 'grid', gridTemplateColumns: '303px minmax(0, 1fr)', gap: 27, alignItems: 'start' }}>
            <aside className="vt-catalogue-filter" style={{ position: 'sticky', top: 100, display: 'grid', gap: 40, paddingTop: 3 }}>
              <FilterGroup title="வகை">
                <CatalogueCheck label="சித்தம் (124)" checked={false} />
                <CatalogueCheck label="ஆயுர்வேதம் (86)" checked />
                <CatalogueCheck label="யுனானி (42)" checked={false} />
              </FilterGroup>

              <FilterGroup title="ஆரோக்கிய இலக்கு">
                <CatalogueCheck label="நோய் எதிர்ப்பு சக்தி" checked={false} />
                <CatalogueCheck label="செரிமானம்" checked={false} />
                <CatalogueCheck label="மன அழுத்தம்" checked={false} />
              </FilterGroup>

              <FilterGroup title="வடிவம்">
                {['மாத்திரை', 'லேகியம்', 'தைலம்', 'சூரணம்'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    style={{
                      minHeight: 31, padding: '0 13px', marginRight: 8, marginBottom: 8,
                      border: `1px solid ${label === 'லேகியம்' ? '#e9c349' : 'rgba(232,228,221,0.42)'}`,
                      background: 'transparent',
                      color: label === 'லேகியம்' ? '#e9c349' : '#d6d1c8',
                      fontSize: 14, fontWeight: 800,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </FilterGroup>
            </aside>

            <div>
              {loading && products.length === 0 ? (
                <div className="vt-catalogue-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 28 }}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} style={{ minHeight: 526, background: 'rgba(30,29,29,0.78)' }} />
                  ))}
                </div>
              ) : (
                <div className="vt-catalogue-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 28 }}>
                  {CATALOGUE_CARDS.map((card, index) => (
                    <CatalogueProductCard
                      key={card.slug}
                      card={card}
                      actionProduct={actionProducts[index]}
                      onAddToCart={(product) => {
                        if (product) void addToCart(product);
                        else showToast('Products are still loading. Please try again.');
                      }}
                    />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 74 }}>
                {[
                  { label: '', icon: faArrowLeft, active: false },
                  { label: '1', active: true },
                  { label: '2', active: false },
                  { label: '3', active: false },
                  { label: '...', active: false },
                  { label: '12', active: false },
                  { label: '', icon: faArrowRight, active: false },
                ].map((item, index) => (
                  <button
                    key={`${item.label}-${index}`}
                    type="button"
                    style={{
                      width: 48, height: 48, display: 'inline-grid', placeItems: 'center',
                      border: item.label === '...' ? 'none' : '1px solid rgba(232,228,221,0.28)',
                      background: item.active ? '#e9c349' : 'transparent',
                      color: item.active ? '#241a00' : '#d8d3ca',
                      fontWeight: 800, fontSize: 18,
                    }}
                  >
                    {item.icon ? <FontAwesomeIcon icon={item.icon} style={{ width: 16, height: 16 }} /> : item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>

        <CatalogueFooter />
        <MobileBottomNav />
        {toast && (
          <div role="status" style={{ position: 'fixed', left: '50%', bottom: 94, zIndex: 100, transform: 'translateX(-50%)', padding: '12px 18px', borderRadius: 2, background: '#1d1c1c', border: '1px solid rgba(233,195,73,0.28)', color: '#fff', fontWeight: 800, whiteSpace: 'nowrap' }}>
            {toast}
          </div>
        )}
      </div>
    );
  }

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
                <h2>Product catalogue</h2>
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

function CatalogueNav({ cartCount }: { cartCount: number }) {
  const iconBtn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(61,138,92,0.18)',
    color: 'rgba(245,237,214,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none',
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(3,12,7,0.82)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(61,138,92,0.12)',
      padding: '0 32px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 20,
    }}>
      {/* Brand */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, #3D8A5C, #C9922A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FontAwesomeIcon icon={faLeaf} style={{ width: 15, height: 15, color: '#fff' }} />
        </span>
        <span style={{
          fontFamily: "'Cormorant Garamond','Noto Serif Tamil',serif",
          fontSize: '1.15rem', fontWeight: 600, color: '#F5EDD6', letterSpacing: '0.02em',
        }}>
          வைத்தியம்
        </span>
      </Link>

      {/* Center nav links */}
      <div className="vt-catalogue-navlinks" style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
        {[
          { label: 'சித்த மருத்துவம்', href: '/products?tradition=siddha' },
          { label: 'ஆயுர்வேதம்',       href: '/products?tradition=ayurveda' },
          { label: 'இயற்கை',            href: '/products?tradition=natural' },
          { label: 'ஆரோக்கியம்',        href: '/products' },
          { label: 'நம்பகம்',           href: '/help' },
        ].map(({ label, href }) => (
          <Link key={label} href={href} style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: '0.90rem', color: 'rgba(245,237,214,0.70)',
            textDecoration: 'none', fontWeight: 400, letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Link href="/products" aria-label="Search" style={iconBtn}>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 16, height: 16 }} />
        </Link>
        <Link href="/cart" aria-label="Cart" style={{ ...iconBtn, position: 'relative' }}>
          <FontAwesomeIcon icon={faCartShopping} style={{ width: 16, height: 16 }} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 15, height: 15, borderRadius: '50%',
              background: '#D4890A', color: '#000',
              fontSize: '0.58rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </Link>
      </div>
    </nav>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ paddingBottom: 35, borderBottom: '1px solid rgba(232,228,221,0.10)' }}>
      <h2 style={{ margin: '0 0 18px', color: '#e9c349', fontSize: 17, letterSpacing: '0.02em', fontWeight: 800 }}>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function CatalogueCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 13, minHeight: 40, color: '#c7cdc7', fontSize: 19, cursor: 'default' }}>
      <input type="checkbox" checked={checked} readOnly style={{ width: 20, height: 20, accentColor: '#e9c349' }} />
      <span>{label}</span>
    </label>
  );
}

function CatalogueProductCard({
  card,
  actionProduct,
  onAddToCart,
}: {
  card: typeof CATALOGUE_CARDS[number];
  actionProduct?: SeedMedicine;
  onAddToCart: (product?: SeedMedicine) => void;
}) {
  return (
    <article style={{ background: '#1f1d1d', minWidth: 0 }}>
      <Link href={`/products/${card.slug}`} style={{ display: 'block', position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', background: '#071711' }}>
        <Image src={card.image} alt={card.nameTa} fill sizes="(max-width: 900px) 50vw, 312px" style={{ objectFit: 'cover' }} />
      </Link>
      <div style={{ height: 214, padding: '24px 18px 18px', overflow: 'hidden' }}>
        <Link href={`/products/${card.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <h2 style={{
            margin: '0 0 11px',
            minHeight: 92,
            fontFamily: "'Noto Serif Tamil','Catamaran',serif",
            fontSize: 'clamp(2rem, 2.7vw, 2.55rem)',
            lineHeight: 1.14,
            fontWeight: 700,
            color: '#f0efec',
            letterSpacing: 0,
          }}>
            {card.nameTa}
          </h2>
          <p style={{ margin: 0, minHeight: 20, color: '#a1a19c', fontSize: 14, fontWeight: 700 }}>{card.nameEn}</p>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 17 }}>
          <strong style={{ fontSize: 24, color: '#f0efec', lineHeight: 1 }}>{card.price}</strong>
          <button
            type="button"
            onClick={() => onAddToCart(actionProduct)}
            style={{
              width: 61, height: 37, border: 'none',
              background: '#e9c349',
              color: '#241a00', fontWeight: 900, cursor: 'pointer',
            }}
          >
            சேர்
          </button>
        </div>
      </div>
    </article>
  );
}

function CatalogueFooter() {
  return (
    <footer style={{ background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '78px 0 32px' }}>
      <div className="vt-catalogue-footer" style={{ width: 'min(1324px, calc(100% - 48px))', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr', gap: 58 }}>
        <div>
          <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, lineHeight: 1, color: '#f0d77a', textDecoration: 'none', fontWeight: 700 }}>Vaithiyam</Link>
          <p style={{ color: '#a6aaa5', lineHeight: 1.85, maxWidth: 270, marginTop: 28, fontSize: 18 }}>பழமையான மருத்துவ முறைகள், நவீன வாழ்க்கைக்கு.</p>
        </div>
        <FooterColumn title="சேவைகள்" links={['Siddha Traditions', 'Cancer Protocols', 'Ayurvedic Wellness']} />
        <FooterColumn title="சட்டம்" links={['Privacy Policy', 'Terms of Service', 'Clinical Research']} />
        <div>
          <h3 style={{ margin: '0 0 31px', color: '#e9c349', fontSize: 16 }}>செய்தி மடல்</h3>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(232,228,221,0.22)' }}>
            <input placeholder="மின்னஞ்சல் முகவரி" style={{ flex: 1, height: 48, border: 'none', outline: 'none', background: 'transparent', color: '#e8e4dd', fontSize: 18 }} />
            <button aria-label="Subscribe" style={{ width: 48, border: 'none', background: 'transparent', color: '#e9c349' }}>
              <FontAwesomeIcon icon={faArrowRight} style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>
      </div>
      <p style={{ margin: '73px 0 0', textAlign: 'center', color: '#9ea7a1', fontWeight: 700, fontSize: 14 }}>© 2024 Vaithiyam Healthcare. All Rights Reserved.</p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 26px', color: '#e9c349', fontSize: 16 }}>{title}</h3>
      <div style={{ display: 'grid', gap: 16 }}>
        {links.map((link) => <Link key={link} href="/products" style={{ color: '#a7aea8', textDecoration: 'none', fontWeight: 800, fontSize: 16 }}>{link}</Link>)}
      </div>
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
