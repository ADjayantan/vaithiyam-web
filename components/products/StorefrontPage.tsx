'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import type { MedicineCategory, SeedMedicine, Tradition } from '@/lib/medicineData';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';
import { useCartStore } from '@/stores/cartStore';
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

export function StorefrontPage({
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
  const [stock] = useState<StockFilter>('all');
  const [sort, setSort] = useState<SortKey>(initialSort ?? 'newest');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }, []);

  const addToWishlist = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) {
      router.push(`/auth/login?next=/products`);
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      showToast(data.message ?? (res.ok ? 'Saved to wishlist.' : 'Could not save wishlist item.'));
    } catch {
      showToast('Could not add to wishlist.');
    }
  }, [router, showToast]);

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

  const addToCart = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) {
      useCartStore.getState().addItem({
        productId: product.id,
        nameTa: product.nameTa,
        nameEn: product.nameEn,
        price: product.price,
        qty: 1,
        mrp: product.mrp,
        requiresPrescription: product.prescriptionRequired,
      });
      showToast(`${product.nameTa} added to cart.`);
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

  const healthGoals = useMemo(() => {
    return categories.filter(cat =>
      cat.slug !== 'all' &&
      cat.slug !== 'siddha' &&
      cat.slug !== 'ayurveda' &&
      cat.slug !== 'natural-wellness'
    );
  }, [categories]);

  let bannerSubtitle = 'HERBAL MEDICINES';
  let bannerTitle = 'மூலிகை மருந்துகள்';
  let bannerDesc = 'ஆய்வுக்கணக்கான ஆண்டுகளால் பாரம்பரியமும் நவீன மருத்துவ அறிவியலும் இணைந்த உயர்தர மூலிகை சிகிச்சைகள்.';

  if (tradition === 'siddha') {
    bannerSubtitle = 'SIDDHA TRADITION';
    bannerTitle = 'சித்த மருத்துவம்';
    bannerDesc = 'சித்த மருத்துவம் என்பது சுமார் 5000 ஆண்டுகளுக்கு மேலான பழமை வாய்ந்தது. தமிழ் மண்ணிற்கே உரிய ஒரு தொன்மையான மருத்துவ முறையாகும். சித்தர்களால் உருவாக்கப்பட்ட இந்த மருத்துவம், \'உணவே மருந்து, மருந்தே உணவு\' என்ற தத்துவத்தின் அடிப்படையில் உடலையும் மனதையும் தூய்மைப்படுத்துகிறது.';
  } else if (tradition === 'ayurveda') {
    bannerSubtitle = 'AYURVEDA TRADITION';
    bannerTitle = 'ஆயுர்வேத மருத்துவம்';
    bannerDesc = 'ஆயுர்வேத மருத்துவம் என்பது இந்தியாவின் பழமையான பாரம்பரிய மருத்துவ முறையாகும். இது மனித உடலின் வாதம், பித்தம், கபம் ஆகிய மூன்று தோஷங்களைச் சமநிலைப்படுத்தி ஆரோக்கியத்தை மேம்படுத்துவதை நோக்கமாகக் கொண்டுள்ளது.';
  } else if (tradition === 'natural') {
    bannerSubtitle = 'NATURAL WELLNESS';
    bannerTitle = 'இயற்கை நலம்';
    bannerDesc = 'இயற்கை ஆரோக்கியம் என்பது மூலிகைகள், இயற்கை பொருட்கள் மற்றும் வாழ்க்கை முறை மாற்றங்கள் மூலம் உடலை ஆரோக்கியமாக வைத்திருக்கும் ஒரு முறையாகும்.';
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
              {healthGoals.map((item) => (
                <CatalogueCheck
                  key={item.slug}
                  label={`${item.nameTa} (${item.nameEn})`}
                  checked={category === item.slug}
                  onChange={() => setCategory(category === item.slug ? 'all' : item.slug)}
                />
              ))}
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
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    onWishlist={addToWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <CustomerFooter />
      <MobileBottomNav />
      {toast && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 94, zIndex: 100, transform: 'translateX(-50%)', padding: '12px 18px', borderRadius: 2, background: '#1d1c1c', border: '1px solid rgba(233,195,73,0.28)', color: '#fff', fontWeight: 800, whiteSpace: 'nowrap' }}>
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

