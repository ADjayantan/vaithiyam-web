import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faClipboardCheck, faCubes, faGear, faHouse, faShieldHalved, faTableColumns, faTags, faUsers } from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: faTableColumns },
  { href: '/admin/medicines', label: 'Medicines', icon: faCubes },
  { href: '/admin/categories', label: 'Categories', icon: faTags },
  { href: '/admin/orders', label: 'Orders', icon: faClipboardCheck },
  { href: '/admin/prescriptions', label: 'Prescriptions', icon: faShieldHalved },
  { href: '/admin/users', label: 'Users', icon: faUsers },
  { href: '/admin/reports', label: 'Reports', icon: faChartBar },
  { href: '/admin/settings', label: 'Settings', icon: faGear },
];

export function AdminShell({ children, title = 'Admin' }: { children: ReactNode; title?: string }) {
  return (
    <div className="vt-admin-shell">
      <div className="vt-admin-grid">
        <aside className="vt-admin-sidebar">
          <Link href="/admin/dashboard" className="vt-brand" style={{ marginBottom: 28 }}>
            <span className="vt-brand-mark"><FontAwesomeIcon icon={faShieldHalved} style={{width: 22, height: 22}} /></span>
            <span>
              <span className="vt-brand-title">Vaithiyam</span>
              <span className="vt-brand-subtitle">Admin portal</span>
            </span>
          </Link>
          <nav style={{ display: 'grid', gap: 8 }}>
            {nav.map((item) => {
              return (
                <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 14, color: 'rgba(236,255,248,0.78)' }}>
                  <FontAwesomeIcon icon={item.icon} style={{width: 18, height: 18}} /> {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 26, color: 'rgba(236,255,248,0.56)' }}>
            <FontAwesomeIcon icon={faHouse} style={{width: 17, height: 17}} /> Customer site
          </Link>
        </aside>
        <main className="vt-admin-main">
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
            <div>
              <p style={{ margin: 0, color: 'rgba(236,255,248,0.55)', fontWeight: 700 }}>Admin portal</p>
              <h1 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.8rem)' }}>{title}</h1>
            </div>
            <Link className="vt-button vt-button-gold" href="/admin/settings">Admin settings</Link>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
