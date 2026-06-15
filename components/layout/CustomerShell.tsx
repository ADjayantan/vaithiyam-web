'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBarcode, faCartShopping, faCircleUser, faHeart,
  faHouse, faLeaf, faMagnifyingGlass, faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { CartItem } from '@/types/order';

function HeaderNavLinks() {
  const pathname = usePathname();

  const links = [
    { label: 'முகப்பு', href: '/', active: pathname === '/' },
    { label: 'மருந்துகள்', href: '/products', active: pathname === '/products' || pathname.startsWith('/products/') },
    { label: 'உதவி', href: '/help', active: pathname === '/help' },
    { label: 'பற்றி', href: '/about', active: pathname === '/about' },
    { label: 'எங்களைத் தொடர்பு கொள்ள', href: '/contact', active: pathname === '/contact' },
  ];

  return (
    <div className="vt-header-nav-links">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className={link.active ? 'active' : ''}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function CustomerHeader({
  cartCount,
  searchValue = '',
  onSearchChange,
}: {
  cartCount?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const storeItems = useCartStore((state) => state.items);
  const storeItemCount = storeItems.reduce((s, i) => s + i.qty, 0);

  const [localCartCount, setLocalCartCount] = useState(cartCount !== undefined ? cartCount : storeItemCount);
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cartCount !== undefined) {
      setLocalCartCount(cartCount);
    } else {
      setLocalCartCount(storeItemCount);
    }
  }, [cartCount, storeItemCount]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token')) : null;
    if (!token) return;
    fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then((data: { items?: CartItem[] } | null) => {
        if (data?.items) {
          useCartStore.getState().setItems(data.items);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchActive]);

  return (
    <header className="vt-app-header">
      {/* ── Top row: brand | search | actions ── */}
      <div className="vt-header-inner">
        <Link href="/" className="vt-brand" aria-label="Vaithiyam home" style={{ textDecoration: 'none' }}>
          <span className="vt-brand-mark">
            <FontAwesomeIcon icon={faLeaf} style={{ width: 22, height: 22 }} />
          </span>
          <span>
            <span className="vt-brand-title">வைத்தியம் <span className="vt-brand-suffix">(Vaithiyam)</span></span>
          </span>
        </Link>

        {/* Center links OR active search input */}
        {searchActive && onSearchChange ? (
          <div className="vt-header-search-active-container" style={{ flex: 1, maxWidth: 480, display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto' }}>
            <div className="vt-header-search" style={{ flex: 1, margin: 0, display: 'block' }}>
              <FontAwesomeIcon aria-hidden="true" icon={faMagnifyingGlass} style={{ width: 17, height: 17 }} />
              <input
                ref={searchInputRef}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search Tamil or English medicine name…"
                aria-label="Search medicines"
              />
            </div>
            <button
              onClick={() => {
                setSearchActive(false);
                onSearchChange('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(245,237,214,0.6)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 8px'
              }}
              aria-label="Close search"
            >
              ✕
            </button>
          </div>
        ) : (
          <Suspense fallback={<div style={{ flex: 1 }} />}>
            <HeaderNavLinks />
          </Suspense>
        )}

        <nav className="vt-nav-actions" aria-label="Customer navigation">
          {onSearchChange ? (
            <button
              type="button"
              className={`vt-icon-link ${searchActive ? 'active' : ''}`}
              onClick={() => setSearchActive(!searchActive)}
              aria-label="Search"
              style={{
                background: searchActive ? 'rgba(212,137,10,0.15)' : 'transparent',
                borderColor: searchActive ? 'var(--vt-saffron)' : 'rgba(61,138,92,0.16)',
                color: searchActive ? 'var(--vt-saffron)' : 'rgba(245,237,214,0.70)',
                cursor: 'pointer',
              }}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 18, height: 18 }} />
            </button>
          ) : (
            <Link className="vt-icon-link" href="/products" aria-label="Search">
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 18, height: 18 }} />
            </Link>
          )}

          <Link className="vt-icon-link vt-icon-desktop-only" href="/prescriptions" aria-label="Upload prescription">
            <FontAwesomeIcon icon={faUpload} style={{ width: 18, height: 18 }} />
          </Link>
          <Link className="vt-icon-link vt-icon-desktop-only" href="/scanner" aria-label="Barcode scanner">
            <FontAwesomeIcon icon={faBarcode} style={{ width: 18, height: 18 }} />
          </Link>
          <Link className="vt-icon-link vt-icon-desktop-only" href="/account/wishlist" aria-label="Wishlist">
            <FontAwesomeIcon icon={faHeart} style={{ width: 18, height: 18 }} />
          </Link>
          <Link className="vt-icon-link vt-icon-desktop-only" href="/account" aria-label="Account">
            <FontAwesomeIcon icon={faCircleUser} style={{ width: 18, height: 18 }} />
          </Link>
          <Link className="vt-icon-link" href="/cart" aria-label="Cart" style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faCartShopping} style={{ width: 18, height: 18 }} />
            {localCartCount > 0 && (
              <span className="vt-cart-count">{localCartCount > 99 ? '99+' : localCartCount}</span>
            )}
          </Link>
        </nav>
      </div>

      {/* ── Mobile search strip (always visible on small screens when onSearchChange is active) ── */}
      {onSearchChange && (
        <div className="vt-mobile-search-strip" role="search">
          <div className="vt-header-search">
            <FontAwesomeIcon aria-hidden="true" icon={faMagnifyingGlass} style={{ width: 17, height: 17 }} />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search medicines…"
              aria-label="Search medicines"
            />
          </div>
        </div>
      )}
    </header>
  );
}

export function MobileBottomNav() {
  const path = usePathname();

  const tabs = [
    { href: '/',                  icon: faHouse,          label: 'Home'    },
    { href: '/products',          icon: faMagnifyingGlass, label: 'Search' },
    { href: '/cart',              icon: faCartShopping,   label: 'Cart'    },
    { href: '/account/wishlist',  icon: faHeart,          label: 'Saved'   },
    { href: '/account',           icon: faCircleUser,     label: 'Account' },
  ];

  return (
    <nav className="vt-bottom-nav" aria-label="Mobile navigation">
      {tabs.map(tab => {
        const active = path === tab.href || (tab.href !== '/' && path.startsWith(tab.href + '/'));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
          >
            <FontAwesomeIcon icon={tab.icon} style={{ width: 18, height: 18 }} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CustomerFooter() {
  return (
    <footer className="vt-footer">
      <div className="vt-container vt-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '30px' }}>
        <div>
          <Link href="/" className="vt-brand" style={{ textDecoration: 'none' }}>
            <span className="vt-brand-mark">
              <FontAwesomeIcon icon={faLeaf} style={{ width: 22, height: 22 }} />
            </span>
            <span>
              <span className="vt-brand-title" style={{ color: 'var(--vt-ink)' }}>வைத்தியம்</span>
            </span>
          </Link>
          <p className="vt-muted" style={{ marginTop: 14, lineHeight: 1.7, maxWidth: 520, color: 'var(--vt-muted)' }}>
            பண்டைய சித்த மருத்துவத்தின் புனிதத்தையும் நவீன அறிவியலின் நேர்த்தியையும் இணைக்கும் ஒரு உன்னத தளம்.
          </p>
        </div>
        <div>
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-gold-500)', fontSize: '1.25rem' }}>விரைவு இணைப்புகள்</h3>
          <div style={{ display: 'grid', gap: 9, color: 'var(--vt-muted)', fontSize: '0.9rem' }}>
            <Link href="/">முகப்பு</Link>
            <Link href="/products">மருந்துகள்</Link>
            <Link href="/help">உதவி</Link>
            <Link href="/about">வைத்தியம் பற்றி</Link>
            <Link href="/contact">எங்களைத் தொடர்பு கொள்ள</Link>
          </div>
        </div>
        <div>
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-gold-500)', fontSize: '1.25rem' }}>சட்டம் (Legal)</h3>
          <div style={{ display: 'grid', gap: 9, color: 'var(--vt-muted)', fontSize: '0.9rem' }}>
            <Link href="/privacy">தனியுரிமைக் கொள்கை</Link>
            <Link href="/terms">விதிமுறைகள்</Link>
            <Link href="/returns">திரும்பப் பெறும் கொள்கை</Link>
            <Link href="/admin/login">அட்மின் (Admin)</Link>
          </div>
        </div>
      </div>
      <div className="vt-container" style={{ borderTop: '1px solid rgba(61,138,92,0.1)', marginTop: '30px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--vt-muted)' }}>
          © 2024 வைத்தியம் Siddha Care. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
