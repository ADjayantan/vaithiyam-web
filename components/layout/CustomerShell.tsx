'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBarcode, faCartShopping, faCircleUser, faHeart,
  faHouse, faLeaf, faMagnifyingGlass, faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { Suspense, useEffect, useRef, useState } from 'react';

function HeaderNavLinks() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tradition = searchParams.get('tradition');

  const links = [
    { label: 'சித்த மருத்துவம்', href: '/products?tradition=siddha', active: pathname === '/products' && tradition === 'siddha' },
    { label: 'ஆயுர்வேதம்',       href: '/products?tradition=ayurveda', active: pathname === '/products' && tradition === 'ayurveda' },
    { label: 'இயற்கை',            href: '/products?tradition=natural', active: pathname === '/products' && tradition === 'natural' },
    { label: 'ஆரோக்கியம்',        href: '/products', active: pathname === '/products' && !tradition },
    { label: 'நம்பகம்',           href: '/help', active: pathname === '/help' },
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
  cartCount = 0,
  searchValue = '',
  onSearchChange,
}: {
  cartCount?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const [localCartCount, setLocalCartCount] = useState(cartCount);
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalCartCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token')) : null;
    if (!token) return;
    fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then((data: { cartItemCount?: number } | null) => {
        if (data && typeof data.cartItemCount === 'number') {
          setLocalCartCount(data.cartItemCount);
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
            <span className="vt-brand-title">வைத்தியம்</span>
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
      <div className="vt-container vt-footer-grid">
        <div>
          <Link href="/" className="vt-brand">
            <span className="vt-brand-mark">
              <FontAwesomeIcon icon={faLeaf} style={{ width: 22, height: 22 }} />
            </span>
            <span>
              <span className="vt-brand-title" style={{ color: 'var(--vt-ink)' }}>வைத்தியம்</span>
              <span className="vt-brand-subtitle" style={{ color: 'var(--vt-muted)' }}>Premium medical-commerce demo</span>
            </span>
          </Link>
          <p className="vt-muted" style={{ marginTop: 14, lineHeight: 1.7, maxWidth: 520 }}>
            Product information is educational only. Vaithiyam does not provide diagnosis, dosage advice,
            or self-medication recommendations.
          </p>
        </div>
        <div>
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-ink)' }}>Care</h3>
          <div style={{ display: 'grid', gap: 9, color: 'var(--vt-muted)' }}>
            <Link href="/prescriptions">Prescriptions</Link>
            <Link href="/scanner">Scanner</Link>
            <Link href="/help">Help center</Link>
          </div>
        </div>
        <div>
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-ink)' }}>Legal</h3>
          <div style={{ display: 'grid', gap: 9, color: 'var(--vt-muted)' }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/admin/login">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
