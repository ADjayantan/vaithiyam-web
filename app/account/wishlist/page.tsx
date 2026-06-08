'use client';

/**
 * apps/web/app/account/wishlist/page.tsx
 *
 * Vaithiyam — My Wishlist Page
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

import WishlistGrid from '../../../components/wishlist/WishlistGrid';

// ─── Design tokens (mirrors all Vaithiyam modules exactly) ────────────────────
const T = {
  forestPrimary: '#1A3A2A',
  forestDark:    '#0F2A1C',
  creamBase:     '#F5EFE0',
  creamAlt:      '#EDE3CE',
  gold:          '#C9922A',
  goldPale:      '#F0C96E',
  leaf:          '#3D7A55',
  saffron:       '#E07B39',
  terracotta:    '#8B3A2F',
  darkText:      '#1C1410',
  secondaryText: '#5C4A30',
  muted:         '#9C8060',
  border:        '#DDD0B8',
} as const;

const FONT = {
  display: "'Mukta Malar', sans-serif",
  body:    "'Hind Madurai', sans-serif",
  serif:   "'Lora', serif",
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
        background:    T.creamBase,
        paddingBottom: '64px',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          STICKY HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header
        role="banner"
        style={{
          position:   'sticky',
          top:        0,
          zIndex:     300,
          background: `linear-gradient(135deg, ${T.forestPrimary} 0%, #1E472E 100%)`,
          boxShadow:  '0 2px 16px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            maxWidth:   '640px',
            margin:     '0 auto',
            padding:    '13px 16px',
            display:    'flex',
            alignItems: 'center',
            gap:        '10px',
          }}
        >
          {/* ── Back to /account ───────────────────────────────────────── */}
          <Link
            href="/account"
            aria-label="கணக்கு பக்கத்திற்கு திரும்பவும்"
            style={{
              width:          '34px',
              height:         '34px',
              borderRadius:   '50%',
              border:         '1px solid rgba(240,201,110,0.22)',
              background:     'rgba(240,201,110,0.08)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              textDecoration: 'none',
              flexShrink:     0,
              transition:     'background 0.14s',
            }}
          >
            <svg
              width="15" height="15" viewBox="0 0 16 16"
              fill="none" aria-hidden="true"
            >
              <path
                d="M10 3L5 8l5 5"
                stroke={T.goldPale}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {/* ── Brand + page sub-label ─────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link
              href="/"
              style={{
                display:        'block',
                fontFamily:     FONT.display,
                fontSize:       '1.08rem',
                fontWeight:     700,
                color:          T.goldPale,
                letterSpacing:  '0.02em',
                textDecoration: 'none',
                lineHeight:     1.2,
              }}
            >
              வைத்தியம்
            </Link>
            <span
              style={{
                display:    'block',
                fontFamily: FONT.body,
                fontSize:   '0.68rem',
                color:      'rgba(240,201,110,0.60)',
                marginTop:  '1px',
              }}
            >
              என் விருப்பப்பட்டியல்
            </span>
          </div>

          {/* ── Item-count chip ────────────────────────────────────────── */}
          {totalCount !== undefined && totalCount > 0 && (
            <div
              aria-label={`${totalCount} பொருட்கள் சேமிக்கப்பட்டுள்ளன`}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '5px',
                padding:      '5px 12px',
                borderRadius: '100px',
                background:   'rgba(240,201,110,0.12)',
                border:       '1px solid rgba(240,201,110,0.26)',
                fontFamily:   FONT.display,
                fontSize:     '0.76rem',
                fontWeight:   700,
                color:        T.goldPale,
                flexShrink:   0,
                whiteSpace:   'nowrap',
              }}
            >
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faHeart} style={{ width: 11, height: 11, color: '#b33a28' }} />
              </span>
              {totalCount > 999 ? '999+' : totalCount}
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <main
        style={{
          maxWidth: '640px',
          margin:   '0 auto',
          padding:  'clamp(18px, 4vw, 32px) 16px 0',
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
              <FontAwesomeIcon icon={faHeart} style={{ width: 18, height: 18, color: '#b33a28' }} />
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

        {/* ── Bottom quick-nav ────────────────────────────────────────── */}
        <nav
          aria-label="கணக்கு விருப்பங்கள்"
          style={{
            display:    'flex',
            gap:        '10px',
            marginTop:  '28px',
            flexWrap:   'wrap',
          }}
        >
          {BOTTOM_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '6px',
                padding:        '9px 16px',
                borderRadius:   '100px',
                background:     '#FFFFFF',
                border:         `1px solid ${T.border}`,
                fontFamily:     FONT.display,
                fontSize:       '0.8rem',
                fontWeight:     600,
                color:          T.secondaryText,
                textDecoration: 'none',
                boxShadow:      '0 1px 4px rgba(26,58,42,0.05)',
                transition:     'all 0.14s',
                whiteSpace:     'nowrap',
              }}
            >
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={link.icon} style={{ width: 14, height: 14 }} />
              </span>
              {link.labelTa}
            </Link>
          ))}
        </nav>
      </main>

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
