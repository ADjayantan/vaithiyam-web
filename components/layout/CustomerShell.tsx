'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBarcode, faCartShopping, faCircleUser, faHeart,
  faHouse, faLeaf, faMagnifyingGlass, faUpload,
  faShieldHalved, faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useLanguageStore } from '@/stores/languageStore';
import type { CartItem } from '@/types/order';

function HeaderNavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tradition = searchParams?.get('tradition') || 'all';
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ta';

  const links = currentLang === 'ta' ? [
    { label: 'முகப்பு', href: '/', active: pathname === '/' },
    { label: 'மருந்துகள்', href: '/products', active: pathname === '/products' && tradition === 'all' },
    { label: 'உதவி', href: '/help', active: pathname === '/help' },
    { label: 'பற்றி', href: '/about', active: pathname === '/about' },
    { label: 'எங்களைத் தொடர்பு கொள்ள', href: '/contact', active: pathname === '/contact' },
  ] : [
    { label: 'SIDDHA', href: '/products?tradition=siddha', active: pathname === '/products' && tradition === 'siddha' },
    { label: 'AYURVEDA', href: '/products?tradition=ayurveda', active: pathname === '/products' && tradition === 'ayurveda' },
    { label: 'NATURAL', href: '/products?tradition=natural', active: pathname === '/products' && tradition === 'natural' },
    { label: 'CONSULTATION', href: '/help', active: pathname === '/help' },
    { label: 'PHILOSOPHY', href: '/about', active: pathname === '/about' },
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
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  const [localCartCount, setLocalCartCount] = useState(cartCount !== undefined ? cartCount : storeItemCount);
  const [searchActive, setSearchActive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ta';

  useEffect(() => {
    if (cartCount !== undefined) {
      setLocalCartCount(cartCount);
    } else {
      setLocalCartCount(storeItemCount);
    }
  }, [cartCount, storeItemCount]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token')) : null;
    setIsLoggedIn(!!token);
    if (!token) return;
    fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then((data: { items?: CartItem[] } | null) => {
        if (data?.items) {
          useCartStore.getState().setItems(data.items);
        }
      })
      .catch(() => {});

    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then((user: { role?: string } | null) => {
        if (user?.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('vt_token');
      sessionStorage.removeItem('vt_token');
    } catch { /* ignore */ }
    window.location.href = '/auth/login';
  };

  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchActive]);

  return (
    <header className={`vt-app-header ${isHomepage && !isScrolled ? 'vt-header-transparent' : ''}`}>
      {/* ── Top row: brand | search | actions ── */}
      <div className="vt-header-inner">
        <Link href="/" className="vt-brand" aria-label="Iyarkai Nala Maruthuvamanai home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="vt-brand-mark">
            <FontAwesomeIcon icon={faLeaf} style={{ width: 22, height: 22 }} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: '1.25rem', color: 'var(--vt-gold, #c9a84c)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              {currentLang === 'ta' ? 'இயற்கை நல' : 'Iyarkai Nala'}
            </span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: '1.25rem', color: 'var(--vt-gold, #c9a84c)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              {currentLang === 'ta' ? 'மருத்துவமனை' : 'Maruthuvamanai'}
            </span>
          </div>
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
                placeholder={currentLang === 'ta' ? 'தமிழ் அல்லது ஆங்கிலத்தில் மருந்துகளைத் தேடுக…' : 'Search Tamil or English medicine name…'}
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

          {/* Consolidated User Dropdown */}
          <div ref={dropdownRef} className="vt-profile-dropdown-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`vt-icon-link ${profileMenuOpen ? 'active' : ''}`}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="User Account Menu"
              style={{
                background: profileMenuOpen ? 'rgba(201,168,76,0.15)' : 'transparent',
                borderColor: profileMenuOpen ? 'var(--vt-gold)' : 'rgba(61,138,92,0.16)',
                color: profileMenuOpen ? 'var(--vt-gold)' : 'rgba(245,237,214,0.70)',
                cursor: 'pointer',
              }}
            >
              <FontAwesomeIcon icon={faCircleUser} style={{ width: 18, height: 18 }} />
            </button>

            {profileMenuOpen && (
              <div
                className="vt-profile-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '240px',
                  backgroundColor: 'rgba(10, 20, 15, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                  padding: '8px 0',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      color: 'var(--vt-gold, #c9a84c)',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontFamily: "var(--vt-font-body)",
                      fontWeight: 600,
                      transition: 'background 0.2s',
                    }}
                    className="vt-dropdown-item"
                  >
                    <FontAwesomeIcon icon={faShieldHalved} style={{ width: 14, height: 14 }} />
                    <span>{currentLang === 'ta' ? 'நிர்வாகப் பலகை' : 'Admin Panel'}</span>
                  </Link>
                )}

                <Link
                  href="/account"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    color: 'rgba(245, 237, 214, 0.85)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "var(--vt-font-body)",
                    transition: 'background 0.2s',
                  }}
                  className="vt-dropdown-item"
                >
                  <FontAwesomeIcon icon={faCircleUser} style={{ width: 14, height: 14 }} />
                  <span>{currentLang === 'ta' ? 'எனது சுயவிவரம்' : 'My Profile'}</span>
                </Link>

                <Link
                  href="/account/wishlist"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    color: 'rgba(245, 237, 214, 0.85)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "var(--vt-font-body)",
                    transition: 'background 0.2s',
                  }}
                  className="vt-dropdown-item"
                >
                  <FontAwesomeIcon icon={faHeart} style={{ width: 14, height: 14 }} />
                  <span>{currentLang === 'ta' ? 'விருப்பப்பட்டியல்' : 'My Wishlist'}</span>
                </Link>

                <Link
                  href="/prescriptions"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    color: 'rgba(245, 237, 214, 0.85)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "var(--vt-font-body)",
                    transition: 'background 0.2s',
                  }}
                  className="vt-dropdown-item"
                >
                  <FontAwesomeIcon icon={faUpload} style={{ width: 14, height: 14 }} />
                  <span>{currentLang === 'ta' ? 'மருந்துச் சீட்டு பதிவேற்றம்' : 'Upload Prescription'}</span>
                </Link>

                <Link
                  href="/scanner"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    color: 'rgba(245, 237, 214, 0.85)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "var(--vt-font-body)",
                    transition: 'background 0.2s',
                  }}
                  className="vt-dropdown-item"
                >
                  <FontAwesomeIcon icon={faBarcode} style={{ width: 14, height: 14 }} />
                  <span>{currentLang === 'ta' ? 'பார்கோடு ஸ்கேனர்' : 'Barcode Scanner'}</span>
                </Link>

                {isLoggedIn ? (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'rgba(201, 168, 76, 0.15)', margin: '4px 0' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        color: '#dc5050',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        width: '100%',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontFamily: "var(--vt-font-body)",
                        transition: 'background 0.2s',
                      }}
                      className="vt-dropdown-item"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} style={{ width: 14, height: 14 }} />
                      <span>{currentLang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'rgba(201, 168, 76, 0.15)', margin: '4px 0' }} />
                    <Link
                      href="/auth/login"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        color: 'var(--vt-gold, #c9a84c)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontFamily: "var(--vt-font-body)",
                        fontWeight: 600,
                        transition: 'background 0.2s',
                      }}
                      className="vt-dropdown-item"
                    >
                      <FontAwesomeIcon icon={faCircleUser} style={{ width: 14, height: 14 }} />
                      <span>{currentLang === 'ta' ? 'உள்நுழைக' : 'Login'}</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

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
              placeholder={currentLang === 'ta' ? 'மருந்துகளைத் தேடுக…' : 'Search medicines…'}
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
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const storeItems = useCartStore((state) => state.items);
  const storeItemCount = storeItems.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ta';

  const tabs = currentLang === 'ta' ? [
    { href: '/',                  icon: faHouse,          label: 'முகப்பு'    },
    { href: '/products',          icon: faMagnifyingGlass, label: 'தேடுக'    },
    { href: '/cart',              icon: faCartShopping,   label: 'கூடை',    count: storeItemCount },
    { href: '/account/wishlist',  icon: faHeart,          label: 'விருப்பம்'  },
    { href: '/account',           icon: faCircleUser,     label: 'கணக்கு'    },
  ] : [
    { href: '/',                  icon: faHouse,          label: 'Home'     },
    { href: '/products',          icon: faMagnifyingGlass, label: 'Search'   },
    { href: '/cart',              icon: faCartShopping,   label: 'Cart',     count: storeItemCount },
    { href: '/account/wishlist',  icon: faHeart,          label: 'Saved'    },
    { href: '/account',           icon: faCircleUser,     label: 'Account'  },
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
            style={{ position: 'relative' }}
          >
            <FontAwesomeIcon icon={tab.icon} style={{ width: 18, height: 18 }} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: 'calc(50% - 22px)',
                  background: 'var(--vt-gold, #c9a84c)',
                  color: 'var(--vt-void, #030C07)',
                  borderRadius: '50%',
                  width: '15px',
                  height: '15px',
                  fontSize: '0.55rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                }}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function CustomerFooter() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ta';

  return (
    <footer className="vt-footer">
      <div className="vt-container vt-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '30px' }}>
        <div>
          <Link href="/" className="vt-brand" style={{ textDecoration: 'none' }}>
            <span className="vt-brand-mark">
              <FontAwesomeIcon icon={faLeaf} style={{ width: 22, height: 22 }} />
            </span>
            <span>
              <span className="vt-brand-title" style={{ color: 'var(--vt-ink)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: '1.45rem', letterSpacing: '0.02em' }}>{currentLang === 'ta' ? 'இயற்கை நல மருத்துவமனை' : 'Iyarkai Nala Maruthuvamanai'}</span>
            </span>
          </Link>
          <p className="vt-muted" style={{ marginTop: 14, lineHeight: 1.7, maxWidth: 520, color: 'var(--vt-muted)', fontSize: '0.85rem' }}>
            Elevating traditional Indian-medicine to the standards of global luxury medical couture.
          </p>
        </div>
        <div>
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-gold-500)', fontSize: '1.25rem' }}>விரைவு இணைப்புகள்</h3>
          <div style={{ display: 'grid', gap: 9, color: 'var(--vt-muted)', fontSize: '0.9rem' }}>
            <Link href="/">முகப்பு</Link>
            <Link href="/products">மருந்துகள்</Link>
            <Link href="/help">உதவி</Link>
            <Link href="/about">இயற்கை நல மருத்துவமனை பற்றி</Link>
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
          {currentLang === 'ta' ? '© 2024 இயற்கை நல மருத்துவமனை. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' : '© 2024 Iyarkai Nala Maruthuvamanai. All rights reserved.'}
        </p>
      </div>
    </footer>
  );
}
