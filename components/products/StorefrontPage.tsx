'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faBoxOpen, faCircleCheck, faFilter, faMagnifyingGlass, faShieldHalved, faStethoscope, faUpload, faLeaf, faCartShopping, faBagShopping, faUserCircle, faGlobe } from '@fortawesome/free-solid-svg-icons';
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
    nameTa: 'அமுக்கரா மாத்திரை',
    nameEn: 'Withania Somnifera · Vitality & Stress',
    price: '₹425',
    originalPrice: '₹500',
    discount: '15% OFF',
    stock: 'In Stock',
    category: 'SIDDHA',
    slug: 'ashwagandha-churnam',
  },
  {
    image: '/catalogue-ref-2.png',
    nameTa: 'நிலவேம்பு குடிநீர்',
    nameEn: 'Andrographis Paniculata · Fever & Immunity',
    price: '₹280',
    originalPrice: '₹310',
    discount: '10% OFF',
    stock: 'In Stock',
    category: 'SIDDHA',
    slug: 'nilavembu-kudineer',
  },
  {
    image: '/catalogue-ref-3.png',
    nameTa: 'பஞ்ச முஷ்டி லேகியம்',
    nameEn: 'Herbal Jam · Digestion & Gut Health',
    price: '₹650',
    originalPrice: '',
    discount: '',
    stock: 'Limited Stock',
    category: 'SIDDHA',
    slug: 'arugampul-powder',
  },
  {
    image: '/catalogue-ref-4.png',
    nameTa: 'திரிபலா மாத்திரை',
    nameEn: 'Triphala · Detox & Rejuvenation',
    price: '₹195',
    originalPrice: '',
    discount: '',
    stock: 'In Stock',
    category: 'SIDDHA',
    slug: 'daily-wellness-combo',
  },
  {
    image: '/catalogue-ref-5.png',
    nameTa: 'பிரம்ம நிவாரணி',
    nameEn: 'Brahmi Oil · Focus & Memory',
    price: '₹390',
    originalPrice: '',
    discount: '',
    stock: 'In Stock',
    category: 'SIDDHA',
    slug: 'brahmi-oil',
  },
  {
    image: '/catalogue-ref-6.png',
    nameTa: 'அரிஷ்டம்',
    nameEn: 'Jeeraka Arishtam · Blood Purity',
    price: '₹640',
    originalPrice: '',
    discount: '',
    stock: 'In Stock',
    category: 'SIDDHA',
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

    let bannerSubtitle = 'HERBAL MEDICINES';
    let bannerTitle = 'மூலிகை மருந்துகள்';
    let bannerDesc = 'ஆய்வுக்கணக்கான ஆண்டுகளால் பாரம்பரியமும் நவீன மருத்துவ அறிவியலும் இணைந்த உயர்தர மூலிகை சிகிச்சைகள்.';
    let breadcrumbText = 'மூலிகை மருந்துகள்';

    if (tradition === 'siddha') {
      bannerSubtitle = 'SIDDHA TRADITION';
      bannerTitle = 'சித்த மருத்துவம்';
      bannerDesc = 'சித்த மருத்துவம் என்பது சுமார் 5000 ஆண்டுகளுக்கு மேலான பழமை வாய்ந்தது. தமிழ் மண்ணிற்கே உரிய ஒரு தொன்மையான மருத்துவ முறையாகும். சித்தர்களால் உருவாக்கப்பட்ட இந்த மருத்துவம், \'உணவே மருந்து, மருந்தே உணவு\' என்ற தத்துவத்தின் அடிப்படையில் உடலையும் மனதையும் தூய்மைப்படுத்துகிறது.';
      breadcrumbText = 'சித்த மருத்துவம்';
    } else if (tradition === 'ayurveda') {
      bannerSubtitle = 'AYURVEDA TRADITION';
      bannerTitle = 'ஆயுர்வேத மருத்துவம்';
      bannerDesc = 'ஆயுர்வேத மருத்துவம் என்பது இந்தியாவின் பழமையான பாரம்பரிய மருத்துவ முறையாகும். இது மனித உடலின் வாதம், பித்தம், கபம் ஆகிய மூன்று தோஷங்களைச் சமநிலைப்படுத்தி ஆரோக்கியத்தை மேம்படுத்துவதை நோக்கமாகக் கொண்டுள்ளது.';
      breadcrumbText = 'ஆயுர்வேதம்';
    } else if (tradition === 'natural') {
      bannerSubtitle = 'NATURAL WELLNESS';
      bannerTitle = 'இயற்கை நலம்';
      bannerDesc = 'இயற்கை ஆரோக்கியம் என்பது மூலிகைகள், இயற்கை பொருட்கள் மற்றும் வாழ்க்கை முறை மாற்றங்கள் மூலம் உடலை ஆரோக்கியமாக வைத்திருக்கும் ஒரு முறையாகும்.';
      breadcrumbText = 'இயற்கை நலம்';
    }

    return (
      <div className="vt-catalogue-page" style={{ minHeight: '100dvh', background: '#061711', color: '#e8e4dd', fontFamily: "'Outfit','Catamaran',system-ui,sans-serif" }}>
        <CustomerHeader cartCount={cartCount} searchValue={search} onSearchChange={setSearch} />

        <main className="vt-catalogue-main" style={{ width: 'min(1324px, calc(100% - 48px))', margin: '0 auto', padding: '34px 0 108px' }}>
          <section style={{
            marginBottom: 52,
            border: '1px solid rgba(61,138,92,0.16)',
            background: 'rgba(5, 12, 8, 0.25)',
            padding: '38px 46px 42px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 24, height: 1, background: '#e9c349' }} />
              <span style={{
                fontSize: '0.78rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#e9c349',
                fontWeight: 700,
              }}>
                {bannerSubtitle}
              </span>
            </div>
            <h1 style={{
              margin: '0 0 24px',
              fontFamily: "'Noto Serif Tamil','Catamaran',serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
              lineHeight: 1.2,
              fontWeight: 700,
              color: '#f0efec',
              letterSpacing: 0,
            }}>
              {bannerTitle}
            </h1>
            <p style={{ margin: 0, color: '#a5aca7', fontSize: '0.95rem', lineHeight: 1.8, fontWeight: 500 }}>
              {bannerDesc}
            </p>
          </section>

          <section className="vt-catalogue-layout" style={{ display: 'grid', gridTemplateColumns: '303px minmax(0, 1fr)', gap: 27, alignItems: 'start' }}>
            <aside className="vt-catalogue-filter" style={{ position: 'sticky', top: 100, display: 'grid', gap: 40, paddingTop: 3 }}>
              <FilterGroup title="TRADITION">
                <CatalogueCheck
                  label="சித்த மருத்துவம் (Siddha)"
                  checked={tradition === 'siddha'}
                  onChange={() => setTradition(tradition === 'siddha' ? 'all' : 'siddha')}
                />
                <CatalogueCheck
                  label="Ayurveda (ஆயுர்வேதம்)"
                  checked={tradition === 'ayurveda'}
                  onChange={() => setTradition(tradition === 'ayurveda' ? 'all' : 'ayurveda')}
                />
                <CatalogueCheck
                  label="Natural (இயற்கை)"
                  checked={tradition === 'natural'}
                  onChange={() => setTradition(tradition === 'natural' ? 'all' : 'natural')}
                />
              </FilterGroup>

              <FilterGroup title="HEALTH GOALS">
                <CatalogueCheck
                  label="நோய் எதிர்ப்பு சக்தி (Immunity)"
                  checked={category === 'immunity-support'}
                  onChange={() => setCategory(category === 'immunity-support' ? 'all' : 'immunity-support')}
                />
                <CatalogueCheck
                  label="செரிமானம் (Digestive Care)"
                  checked={category === 'digestive-care'}
                  onChange={() => setCategory(category === 'digestive-care' ? 'all' : 'digestive-care')}
                />
                <CatalogueCheck
                  label="வலி நிவாரணம் (Pain Relief)"
                  checked={category === 'pain-relief'}
                  onChange={() => setCategory(category === 'pain-relief' ? 'all' : 'pain-relief')}
                />
              </FilterGroup>

              <div style={{ marginTop: 10, overflow: 'hidden' }}>
                <Image
                  src="/cat-siddha.png"
                  alt="Siddha Tradition"
                  width={303}
                  height={303}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </aside>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <span style={{ fontSize: '0.92rem', color: '#e8e4dd', fontWeight: 500 }}>
                  Showing <strong style={{ color: '#e9c349' }}>{products.length}</strong> Premium {tradition === 'siddha' ? 'Siddha' : tradition === 'ayurveda' ? 'Ayurvedic' : tradition === 'natural' ? 'Natural' : 'Traditional'} Formulations
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#e8e4dd', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  SORT BY
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    style={{ background: 'transparent', border: 'none', color: '#e9c349', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="newest" style={{ background: '#050c08', color: '#fff' }}>Newest</option>
                    <option value="price-low" style={{ background: '#050c08', color: '#fff' }}>Price: Low to High</option>
                    <option value="price-high" style={{ background: '#050c08', color: '#fff' }}>Price: High to Low</option>
                    <option value="rating" style={{ background: '#050c08', color: '#fff' }}>Rating</option>
                  </select>
                </div>
              </div>

              {loading && products.length === 0 ? (
                <div className="vt-catalogue-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 28 }}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} style={{ minHeight: 420, background: 'rgba(30,29,29,0.78)' }} />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', display: 'grid', gap: 12 }}>
                  <FontAwesomeIcon icon={faBoxOpen} style={{ width: 44, height: 44, color: '#e9c349', margin: '0 auto' }} />
                  <h3 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1.4rem' }}>No products found</h3>
                  <p style={{ margin: 0, color: '#a5aca7', fontSize: '0.92rem' }}>Try modifying your search or sidebar filters.</p>
                </div>
              ) : (
                <div className="vt-catalogue-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 28 }}>
                  {products.map((product) => (
                    <CatalogueProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 58 }}>
                <button
                  type="button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 36px',
                    background: 'transparent',
                    border: '1px solid #e9c349',
                    color: '#e9c349',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  LOAD MORE TRADITIONS
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
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



function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ paddingBottom: 24, borderBottom: '1px solid rgba(232,228,221,0.08)', marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 16px', color: '#e9c349', fontSize: '0.82rem', letterSpacing: '0.12em', fontWeight: 700 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

function CatalogueCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange?: () => void;
}) {
  return (
    <label
      onClick={(e) => {
        e.preventDefault();
        onChange?.();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 32,
        color: checked ? '#e8e4dd' : '#7e8781',
        fontSize: '0.92rem',
        fontWeight: checked ? 600 : 500,
        cursor: 'pointer',
        userSelect: 'none',
        marginBottom: 10,
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        border: checked ? 'none' : '1px solid #4a544f',
        background: checked ? '#e9c349' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        transition: 'all 0.2s',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span>{label}</span>
    </label>
  );
}

function CatalogueProductCard({
  product,
  onAddToCart,
}: {
  product: SeedMedicine;
  onAddToCart: (product: SeedMedicine) => void;
}) {
  const discount = product.mrp > product.price
    ? `${Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF`
    : null;

  return (
    <article style={{
      background: '#040f0c',
      border: '1px solid rgba(61,138,92,0.16)',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', background: '#071711' }}>
        <Link href={`/products/${product.slug}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.nameTa} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7570', fontSize: '2rem' }}>
              🍃
            </div>
          )}
        </Link>
        {discount && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: '#e9c349',
            color: '#000',
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '4px 8px',
            letterSpacing: '0.05em',
            zIndex: 10,
          }}>
            {discount}
          </div>
        )}
      </div>
      <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.08)',
            color: '#a5aca7',
            fontSize: '0.62rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {product.categoryNameEn || product.categorySlug}
          </span>
        </div>
        <Link href={`/products/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 style={{
            margin: '0 0 8px',
            fontFamily: "'Noto Serif Tamil','Catamaran',serif",
            fontSize: '1.35rem',
            lineHeight: 1.25,
            fontWeight: 700,
            color: '#f0efec',
            letterSpacing: 0,
          }}>
            {product.nameTa}
          </h2>
          <p style={{ margin: '0 0 20px', color: '#a5aca7', fontSize: '0.8rem', lineHeight: 1.4, fontWeight: 500 }}>
            {product.nameEn}
          </p>
        </Link>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: '1.25rem', color: '#e9c349', fontWeight: 700 }}>₹{product.price}</span>
            {product.mrp > product.price && (
              <span style={{ fontSize: '0.92rem', color: '#6b7570', textDecoration: 'line-through' }}>₹{product.mrp}</span>
            )}
            <span style={{
              fontSize: '0.78rem',
              color: product.inStock ? '#8fa096' : '#dca149',
              fontWeight: 600,
              marginLeft: 'auto',
            }}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
            style={{
              width: '100%',
              padding: '12px 0',
              border: 'none',
              background: product.inStock ? '#e9c349' : '#3c413e',
              color: product.inStock ? '#000' : '#888',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            {product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
          </button>
        </div>
      </div>
    </article>
  );
}

function CatalogueFooter() {
  return (
    <footer style={{ background: '#050c08', borderTop: '1px solid rgba(61,138,92,0.1)', padding: '64px 0 48px' }}>
      <div style={{ width: 'min(1324px, calc(100% - 48px))', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: 48 }}>
        <div>
          <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, lineHeight: 1, color: '#f0d77a', textDecoration: 'none', fontWeight: 700, display: 'inline-block', marginBottom: 24 }}>
            Vaithiyam
          </Link>
          <p style={{ color: '#a5aca7', lineHeight: 1.7, maxWidth: 360, margin: '0 0 28px', fontSize: '0.88rem', fontWeight: 500 }}>
            A vanguard of holistic precision. We bridge the ancient wisdom of the Siddhars with the rigorous standards of modern oncology and lifestyle care.
          </p>
          <p style={{ margin: 0, color: '#6b7570', fontWeight: 500, fontSize: '0.8rem' }}>
            © 2024 Vaithiyam. Precision Holistic Care. All Rights Reserved.
          </p>
        </div>
        <div>
          <h3 style={{ margin: '0 0 20px', color: '#e9c349', fontSize: '0.82rem', letterSpacing: '0.12em', fontWeight: 700 }}>MEDICAL</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <Link href="/products" style={{ color: '#a5aca7', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s' }}>Institutional Partners</Link>
            <Link href="/products" style={{ color: '#a5aca7', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s' }}>Medical Ethics</Link>
            <Link href="/products" style={{ color: '#a5aca7', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s' }}>Health Disclaimers</Link>
          </div>
        </div>
        <div>
          <h3 style={{ margin: '0 0 20px', color: '#e9c349', fontSize: '0.82rem', letterSpacing: '0.12em', fontWeight: 700 }}>CONTACT</h3>
          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            <Link href="/privacy" style={{ color: '#a5aca7', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s' }}>Privacy Policy</Link>
            <Link href="/contact" style={{ color: '#a5aca7', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s' }}>Contact Us</Link>
          </div>
          <div style={{ display: 'flex', gap: 12, color: '#a5aca7' }}>
            <FontAwesomeIcon icon={faGlobe} style={{ width: 16, height: 16 }} />
            <FontAwesomeIcon icon={faCircleCheck} style={{ width: 16, height: 16 }} />
          </div>
        </div>
      </div>
    </footer>
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
