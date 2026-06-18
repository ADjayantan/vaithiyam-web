'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faClipboardCheck,
  faCubes,
  faGear,
  faLeaf,
  faPlus,
  faShieldHalved,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';

const nav = [
  { href: '/admin/dashboard',     label: 'நிர்வாகப் பலகை',     icon: faChartBar },
  { href: '/admin/medicines',     label: 'தயாரிப்புகள்',     icon: faCubes },
  { href: '/admin/orders',        label: 'கட்டளைகள்',        icon: faClipboardCheck },
  { href: '/admin/prescriptions', label: 'மருந்துச் சீட்டுகள்', icon: faShieldHalved },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem('vt_token');
      sessionStorage.removeItem('vt_token');
    } catch { /* ignore */ }
    router.replace('/admin/login');
  };

  const handleOpenAddModal = () => {
    window.dispatchEvent(new CustomEvent('open-add-medicine-modal'));
  };

  return (
    <div className="vt-admin-shell">
      {/* ── Vertical Left Sidebar ── */}
      <aside className="vt-admin-sidebar">
        <div className="vt-admin-sidebar-logo">
          <Link href="/admin/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#3D8A5C', display: 'inline-flex' }}>
              <FontAwesomeIcon icon={faLeaf} style={{ width: 22, height: 22 }} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <h1 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--vt-gold, #c9a84c)' }}>இயற்கை நல</h1>
              <h1 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--vt-gold, #c9a84c)' }}>மருத்துவமனை</h1>
              <p style={{ margin: '2px 0 0 0' }}>நிர்வாகி</p>
            </div>
          </Link>
        </div>

        {/* Navigation Link List */}
        <nav className="vt-admin-sidebar-nav">
          {nav.map((item) => {
            const active = path === item.href || (item.href !== '/admin/dashboard' && path.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`vt-admin-sidebar-link ${active ? 'active' : ''}`}
              >
                <FontAwesomeIcon icon={item.icon} style={{ width: 16, height: 16 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="vt-admin-sidebar-divider" />

          {/* Quick Action Button inside Sidebar */}
          <button
            type="button"
            className="vt-admin-sidebar-btn"
            onClick={handleOpenAddModal}
            title="புதிய தயாரிப்பு (Add Product)"
          >
            <FontAwesomeIcon icon={faPlus} style={{ width: 12, height: 12 }} />
            <span>புதிய தயாரிப்பு</span>
          </button>

          <div style={{ flexGrow: 1 }} />

          {/* Settings Link at the bottom */}
          <Link
            href="/admin/settings"
            className={`vt-admin-sidebar-link ${path.startsWith('/admin/settings') ? 'active' : ''}`}
            style={{ marginBottom: 4 }}
          >
            <FontAwesomeIcon icon={faGear} style={{ width: 16, height: 16 }} />
            <span>அமைப்புகள்</span>
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="vt-admin-sidebar-link"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              outline: 'none',
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} style={{ width: 16, height: 16 }} />
            <span>வெளியேறு</span>
          </button>
        </nav>
      </aside>

      {/* ── Main Panel Content (on the right) ── */}
      <div className="vt-admin-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flexGrow: 1 }}>
          {children}
        </div>
        <footer style={{ padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(245, 240, 232, 0.4)' }}>
          © 2024 இயற்கை நல மருத்துவமனை. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.
        </footer>
      </div>
    </div>
  );
}
