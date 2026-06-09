import Link from 'next/link';

const T = {
  forestPrimary: 'var(--vt-forest-700)',
  creamBase: 'var(--vt-void)',
  goldPale: 'var(--vt-gold-300)',
  leaf: 'var(--vt-forest-600)',
  darkText: 'var(--vt-ink)',
  secondaryText: 'var(--vt-ink-80)',
  muted: 'var(--vt-muted)',
  border: 'var(--vt-border)',
} as const;

const FONT = {
  display: "var(--vt-font-display)",
  body: "var(--vt-font-body)",
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
      <header
        style={{
          position:   'sticky',
          top:        0,
          zIndex:     200,
          background: 'rgba(3, 12, 7, 0.75)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(61,138,92,0.14)',
          boxShadow:  '0 2px 16px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: T.goldPale, textDecoration: 'none', fontSize: 24 }}>‹</Link>
          <div>
            <p style={{ fontFamily: FONT.body, color: 'rgba(240,201,110,0.65)', margin: 0, fontSize: 12 }}>{eyebrow}</p>
            <h1 style={{ fontFamily: FONT.display, color: T.goldPale, margin: 0, fontSize: 20 }}>{title}</h1>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
        <section style={{ background: 'var(--vt-card)', border: `1px solid ${T.border}`, borderRadius: 18, padding: 22, boxShadow: 'var(--vt-shadow-sm)' }}>
          <div style={{ fontFamily: FONT.body, color: T.darkText, lineHeight: 1.75 }}>
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
