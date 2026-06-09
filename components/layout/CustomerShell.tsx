'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBarcode, faCartShopping, faCircleUser, faHeart,
  faHouse, faMagnifyingGlass, faUpload,
} from '@fortawesome/free-solid-svg-icons';

export function CustomerHeader({
  cartCount = 0,
  searchValue = '',
  onSearchChange,
}: {
  cartCount?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  return (
    <header className="vt-app-header">
      {/* ── Top row: brand | search | actions ── */}
      <div className="vt-header-inner">
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, lineHeight: 1, color: '#f0d77a', textDecoration: 'none', fontWeight: 700 }} aria-label="Vaithiyam home">
          Vaithiyam
        </Link>

        {/* Search — visible on desktop, hidden on mobile (shown in strip below) */}
        <div className="vt-header-search vt-header-search-desktop" role="search">
          <FontAwesomeIcon aria-hidden="true" icon={faMagnifyingGlass} style={{ width: 17, height: 17 }} />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search Tamil or English medicine name…"
            aria-label="Search medicines"
          />
        </div>

        <nav className="vt-nav-actions" aria-label="Customer navigation">
          <Link className="vt-icon-link" href="/prescriptions" aria-label="Upload prescription">
            <FontAwesomeIcon icon={faUpload} style={{ width: 18, height: 18 }} />
          </Link>
          <Link className="vt-icon-link" href="/scanner" aria-label="Barcode scanner">
            <FontAwesomeIcon icon={faBarcode} style={{ width: 18, height: 18 }} />
          </Link>
          <Link className="vt-icon-link" href="/account/wishlist" aria-label="Wishlist">
            <FontAwesomeIcon icon={faHeart} style={{ width: 18, height: 18 }} />
          </Link>
          <Link className="vt-icon-link" href="/account" aria-label="Account">
            <FontAwesomeIcon icon={faCircleUser} style={{ width: 18, height: 18 }} />
          </Link>
          <Link className="vt-icon-link" href="/cart" aria-label="Cart" style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faCartShopping} style={{ width: 18, height: 18 }} />
            {cartCount > 0 && (
              <span className="vt-cart-count">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>
        </nav>
      </div>

      {/* ── Mobile search strip (always visible on small screens) ── */}
      <div className="vt-mobile-search-strip" role="search">
        <div className="vt-header-search">
          <FontAwesomeIcon aria-hidden="true" icon={faMagnifyingGlass} style={{ width: 17, height: 17 }} />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search medicines…"
            aria-label="Search medicines"
          />
        </div>
      </div>
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
          <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, lineHeight: 1, color: '#f0d77a', textDecoration: 'none', fontWeight: 700 }}>
            Vaithiyam
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
