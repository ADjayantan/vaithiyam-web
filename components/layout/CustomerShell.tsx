'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode, faCartShopping, faCircleUser, faHeart, faHouse, faLeaf, faMagnifyingGlass, faUpload } from '@fortawesome/free-solid-svg-icons';

export function CustomerHeader({ cartCount = 0, searchValue = '', onSearchChange }: { cartCount?: number; searchValue?: string; onSearchChange?: (value: string) => void }) {
  return (
    <header className="vt-app-header">
      <div className="vt-header-inner">
        <Link href="/" className="vt-brand" aria-label="Vaithiyam home">
          <span className="vt-brand-mark"><FontAwesomeIcon icon={faLeaf} style={{width: 23, height: 23}} /></span>
          <span>
            <span className="vt-brand-title">வைத்தியம்</span>
            <span className="vt-brand-subtitle">Siddha · Ayurveda · Natural</span>
          </span>
        </Link>

        <div className="vt-header-search">
          <FontAwesomeIcon aria-hidden="true" icon={faMagnifyingGlass} style={{width: 20, height: 20}} />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search Tamil or English medicine name"
            aria-label="Search medicines"
          />
        </div>

        <nav className="vt-nav-actions" aria-label="Customer navigation">
          <Link className="vt-icon-link" href="/prescriptions" aria-label="Upload prescription"><FontAwesomeIcon icon={faUpload} style={{width: 20, height: 20}} /></Link>
          <Link className="vt-icon-link" href="/scanner" aria-label="Scanner"><FontAwesomeIcon icon={faBarcode} style={{width: 20, height: 20}} /></Link>
          <Link className="vt-icon-link" href="/account/wishlist" aria-label="Wishlist"><FontAwesomeIcon icon={faHeart} style={{width: 20, height: 20}} /></Link>
          <Link className="vt-icon-link" href="/account" aria-label="Account"><FontAwesomeIcon icon={faCircleUser} style={{width: 20, height: 20}} /></Link>
          <Link className="vt-icon-link" href="/cart" aria-label="Cart" style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faCartShopping} style={{width: 20, height: 20}} />
            {cartCount > 0 && <span className="vt-cart-count">{cartCount > 99 ? '99+' : cartCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const path = usePathname();

  const tabs = [
    { href: '/',                 icon: faHouse,          label: 'Home'    },
    { href: '/products',         icon: faMagnifyingGlass, label: 'Search' },
    { href: '/cart',             icon: faCartShopping,   label: 'Cart'    },
    { href: '/account/wishlist', icon: faHeart,          label: 'Wishlist'},
    { href: '/account',          icon: faCircleUser,     label: 'Account' },
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
            style={active ? {
              background: 'rgba(0, 200, 194, 0.18)',
              color: '#00c8c2',
            } : {}}
            aria-current={active ? 'page' : undefined}
          >
            <FontAwesomeIcon icon={tab.icon} style={{width: 18, height: 18}} />
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
            <span className="vt-brand-mark"><FontAwesomeIcon icon={faLeaf} style={{width: 22, height: 22}} /></span>
            <span>
              <span className="vt-brand-title" style={{ color: 'var(--vt-forest-800)' }}>வைத்தியம்</span>
              <span className="vt-brand-subtitle" style={{ color: 'var(--vt-muted)' }}>Premium medical-commerce demo</span>
            </span>
          </Link>
          <p className="vt-muted" style={{ marginTop: 14, lineHeight: 1.7, maxWidth: 520 }}>
            Product information is educational only. Vaithiyam does not provide diagnosis, dosage advice, or self-medication recommendations.
          </p>
        </div>
        <div>
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--vt-font-display)' }}>Care</h3>
          <div style={{ display: 'grid', gap: 9, color: 'var(--vt-muted)' }}>
            <Link href="/prescriptions">Prescriptions</Link>
            <Link href="/scanner">Scanner</Link>
            <Link href="/help">Help center</Link>
          </div>
        </div>
        <div>
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--vt-font-display)' }}>Legal</h3>
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
