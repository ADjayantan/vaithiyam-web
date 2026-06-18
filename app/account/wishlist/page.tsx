'use client';

/**
 * apps/web/app/account/wishlist/page.tsx
 *
 * Iyarkai Nala Maruthuvamanai — My Wishlist Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Route ────────────────────────────────────────────────────────────────────
 *   /account/wishlist
 *
 * ─── Layout ───────────────────────────────────────────────────────────────────
 *   1. Sticky forest-green header  — back to /account · brand mark · item-count chip
 *   2. Page title + subtitle
 *   3. WishlistGrid                — infinite-scroll 2-col product grid
 *   4. Bottom quick-nav            — account / orders / home links
 *   5. ToastStack                  — fixed bottom, slides in on action
 *
 * ─── Auth guard ───────────────────────────────────────────────────────────────
 *   Reads vt_token from localStorage → sessionStorage.
 *   Unauthenticated users → /auth/login?next=/account/wishlist
 *   Any 401 from WishlistGrid calls handleUnauthorized → same redirect.
 *
 * ─── State ────────────────────────────────────────────────────────────────────
 *   mounted     — prevents SSR mismatch; page returns null until hydrated
 *   totalCount  — total wishlist items (echoed from WishlistGrid first-page response)
 *   toasts      — toast notification stack (success / error)
 *
 * ─── Components used ──────────────────────────────────────────────────────────
 *   WishlistGrid  →  apps/web/components/wishlist/WishlistGrid.tsx
 *     ↳ WishlistCard    → apps/web/components/wishlist/WishlistCard.tsx
 *     ↳ EmptyWishlist   → apps/web/components/wishlist/EmptyWishlist.tsx
 *
 * ─── API surface (delegated to WishlistGrid) ──────────────────────────────────
 *   GET    /api/wishlist?page=&limit=  →  { items, total, hasMore }
 *   DELETE /api/wishlist/:itemId       →  { ok: true }
 *   POST   /api/cart/add               →  { cartItemCount }
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useRouter }       from 'next/navigation';
import Link                from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faCircleUser, faBox, faLeaf } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { CustomerHeader, CustomerFooter, MobileBottomNav } from '@/components/layout/CustomerShell';

import WishlistGrid from '../../../components/wishlist/WishlistGrid';

// ─── Design tokens (mirrors all Iyarkai Nala modules exactly) ────────────────────
const T = {
  forestPrimary: 'var(--vt-forest-800)',
  forestDark:    'var(--vt-deep)',
  creamBase:     'var(--vt-void)',
  creamAlt:      'rgba(255, 255, 255, 0.05)',
  gold:          'var(--vt-gold-500)',
  goldPale:      'var(--vt-gold-200)',
  leaf:          'var(--vt-forest-600)',
  saffron:       'var(--vt-gold-500)',
  terracotta:    'var(--vt-coral-500)',
  darkText:      'var(--vt-ink)',
  secondaryText: 'var(--vt-muted)',
  muted:         'var(--vt-muted)',
  border:        'var(--vt-border)',
} as const;

const FONT = {
  display: "var(--vt-font-display)",
  body:    "var(--vt-font-body)",
  serif:   "var(--vt-font-serif)",
} as const;

// ─── Auth helpers (identical to account/page.tsx and account/orders/page.tsx) ──
function getToken(): string | null {
  try {
    return (
      localStorage.getItem('vt_token') ??
      sessionStorage.getItem('vt_token')
    );
  } catch { return null; }
}

function clearSession(): void {
  try {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_user');
    sessionStorage.removeItem('vt_token');
    sessionStorage.removeItem('vt_user');
  } catch { /* ignore */ }
}

// ─── Toast types ──────────────────────────────────────────────────────────────
interface Toast {
  id:   number;
  msg:  string;
  kind: 'success' | 'error';
}

// ─── ToastStack (mirrors account/orders/page.tsx exactly) ─────────────────────
function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts:    Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position:      'fixed',
        bottom:        '24px',
        left:          '50%',
        transform:     'translateX(-50%)',
        zIndex:        600,
        display:       'flex',
        flexDirection: 'column-reverse',
        gap:           '8px',
        pointerEvents: 'none',
        width:         'min(92vw, 420px)',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '10px',
            padding:       '12px 16px',
            borderRadius:  '14px',
            background:    t.kind === 'success'
              ? `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`
              : T.terracotta,
            color:         '#fff',
            fontFamily:    FONT.display,
            fontSize:      '0.88rem',
            fontWeight:    600,
            boxShadow:     '0 4px 20px rgba(0,0,0,0.18)',
            pointerEvents: 'all',
            animation:     'vt-wl-toast-in 0.22s ease forwards',
          }}
        >
          <style>{`
            @keyframes vt-wl-toast-in {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0);    }
            }
          `}</style>
          <span aria-hidden="true" style={{ fontSize: '1rem', flexShrink: 0 }}>
            {t.kind === 'success' ? '✓' : '⚠'}
          </span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="மூடு"
            style={{
              background: 'none',
              border:     'none',
              color:      'rgba(255,255,255,0.80)',
              cursor:     'pointer',
              fontSize:   '1.15rem',
              padding:    '2px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WishlistPage() {
  const router = useRouter();

  // ── Hydration / auth guard ─────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!getToken()) {
      router.replace('/auth/login?next=/account/wishlist');
    }
  }, [router]);

  // ── Wishlist item count (echoed from WishlistGrid first-page response) ──────
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toastCounter = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, kind: Toast['kind']) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, msg, kind }]);
    // Auto-dismiss after 3.8 s
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3800,
    );
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── 401 handler ────────────────────────────────────────────────────────────
  const handleUnauthorized = useCallback(() => {
    clearSession();
    router.replace('/auth/login?next=/account/wishlist');
  }, [router]);

  // ── SSR guard — return nothing until client is hydrated ───────────────────
  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight:     '100dvh',
        background:    'var(--vt-void)',
        paddingBottom: '80px',
      }}
    >
      <CustomerHeader />

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <main
        style={{
          maxWidth: '640px',
          margin:   '0 auto',
          padding:  'clamp(18px, 4vw, 32px) 16px 20px',
        }}
      >
        {/* ── Page heading ────────────────────────────────────────────── */}
        <div style={{ marginBottom: '22px' }}>
          <h1
            style={{
              fontFamily:    FONT.display,
              fontSize:      'clamp(1.3rem, 4vw, 1.6rem)',
              fontWeight:    700,
              color:         T.darkText,
              margin:        '0 0 6px',
              lineHeight:    1.25,
              letterSpacing: '0.01em',
            }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', marginRight: 6 }}>
              <FontAwesomeIcon icon={faHeart} style={{ width: 18, height: 18, color: 'var(--vt-rose-500)' }} />
            </span>
            என் விருப்பப்பட்டியல்
          </h1>
          <p
            style={{
              fontFamily: FONT.body,
              fontSize:   '0.88rem',
              color:      T.secondaryText,
              margin:     0,
              lineHeight: 1.5,
            }}
          >
            உங்கள் சேமித்த பொருட்கள் அனைத்தும் இங்கே காட்டப்படும்
          </p>
        </div>

        {/* ── WishlistGrid ─────────────────────────────────────────────── */}
        <WishlistGrid
          onTotalCount={setTotalCount}
          onToast={showToast}
          onUnauthorized={handleUnauthorized}
        />

      </main>

      <CustomerFooter />
      <MobileBottomNav />

      {/* ── Toast notifications ───────────────────────────────────────────── */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ─── Bottom quick-nav link data ───────────────────────────────────────────────
const BOTTOM_LINKS: { href: string; icon: IconDefinition; labelTa: string }[] = [
  { href: '/account',        icon: faCircleUser, labelTa: 'என் கணக்கு'    },
  { href: '/account/orders', icon: faBox,        labelTa: 'என் ஆர்டர்கள்' },
  { href: '/',               icon: faLeaf,       labelTa: 'தொடர் கடைபிடி'  },
];
