'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faClipboardCheck,
  faCubes,
  faGear,
  faHouse,
  faLeaf,
  faShieldHalved,
  faSignOutAlt,
  faUsers,
  faCircleUser,
} from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';

const nav = [
  { href: '/admin/dashboard',     label: 'Dashboard',     icon: faChartBar },
  { href: '/admin/orders',        label: 'Orders',        icon: faClipboardCheck },
  { href: '/admin/medicines',     label: 'Inventory',     icon: faCubes },
  { href: '/admin/prescriptions', label: 'Prescriptions', icon: faShieldHalved },
  { href: '/admin/users',         label: 'Customers',     icon: faUsers },
  { href: '/admin/reports',       label: 'Reports',       icon: faChartBar },
  { href: '/admin/settings',      label: 'Settings',      icon: faGear },
];

export function AdminShell({ children, title = 'Admin' }: { children: ReactNode; title?: string }) {
  const path = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem('vt_token');
      sessionStorage.removeItem('vt_token');
    } catch { /* ignore */ }
    router.replace('/admin/login');
  };

  return (
    <div className="vt-admin-shell">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="vt-admin-topbar">
        {/* Brand Logo */}
        <Link href="/admin/dashboard" className="vt-admin-brand">
          <span className="vt-admin-brand-mark">
            <FontAwesomeIcon icon={faLeaf} style={{ width: 20, height: 20 }} />
          </span>
          <span>Vaithiyam <span style={{ fontWeight: 400, color: 'var(--vt-admin-green)', opacity: 0.75 }}>| Admin</span></span>
        </Link>

        {/* Center Nav Links */}
        <nav className="vt-admin-nav">
          {nav.map((item) => {
            const active = path === item.href || (item.href !== '/admin/dashboard' && path.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`vt-admin-nav-link ${active ? 'active' : ''}`}
                style={{
                  borderBottom: active ? '2px solid #1E472E' : '2px solid transparent',
                  borderRadius: '0px',
                  padding: '6px 4px',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Admin Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Back to site */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.85rem',
              color: '#5A665D',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 71, 46, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <FontAwesomeIcon icon={faHouse} style={{ width: 14, height: 14 }} />
            Storefront
          </Link>

          <div style={{ width: '1px', height: '20px', background: '#E4DACF' }} />

          {/* Admin user Profile row with logout click */}
          <button
            type="button"
            onClick={handleLogout}
            className="vt-admin-user-badge"
            title="வெளியேறு (Logout)"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              outline: 'none',
            }}
          >
            <FontAwesomeIcon icon={faCircleUser} style={{ width: 18, height: 18, color: '#1E472E' }} />
            <span style={{ color: '#1E3024', fontWeight: 600, fontSize: '0.94rem' }}>Admin User</span>
            <FontAwesomeIcon icon={faSignOutAlt} style={{ width: 12, height: 12, color: '#6B7A70', marginLeft: 4 }} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
