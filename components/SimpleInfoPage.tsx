import Link from 'next/link';

const T = {
  forestPrimary: '#1A3A2A',
  creamBase: '#F5EFE0',
  goldPale: '#F0C96E',
  leaf: '#3D7A55',
  darkText: '#1C1410',
  secondaryText: '#5C4A30',
  muted: '#9C8060',
  border: '#DDD0B8',
} as const;

const FONT = {
  display: "'Mukta Malar', sans-serif",
  body: "'Hind Madurai', sans-serif",
} as const;

export default function SimpleInfoPage({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100dvh', background: T.creamBase }}>
      <header style={{ background: `linear-gradient(135deg, ${T.forestPrimary} 0%, #1E472E 100%)` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: T.goldPale, textDecoration: 'none', fontSize: 24 }}>‹</Link>
          <div>
            <p style={{ fontFamily: FONT.body, color: 'rgba(240,201,110,0.65)', margin: 0, fontSize: 12 }}>{eyebrow}</p>
            <h1 style={{ fontFamily: FONT.display, color: T.goldPale, margin: 0, fontSize: 20 }}>{title}</h1>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
        <section style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 18, padding: 22, boxShadow: '0 2px 12px rgba(26,58,42,0.06)' }}>
          <div style={{ fontFamily: FONT.body, color: T.secondaryText, lineHeight: 1.75 }}>
            {children}
          </div>
        </section>
        <Link href="/products" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 44, padding: '0 20px', borderRadius: 12, background: T.leaf, color: '#fff', fontFamily: FONT.display, fontWeight: 800, textDecoration: 'none' }}>
          பொருட்களை பார்க்க
        </Link>
      </main>
    </div>
  );
}
