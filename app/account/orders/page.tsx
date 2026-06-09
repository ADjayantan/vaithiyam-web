'use client';

/**
 * apps/web/app/account/orders/page.tsx
 *
 * Vaithiyam — Order History Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Route ────────────────────────────────────────────────────────────────────
 *   /account/orders
 *
 * ─── Layout ──────────────────────────────────────────────────────────────────
 *   1. Sticky forest-green header (back to /account + brand + order count chip)
 *   2. Page title + subtitle
 *   3. Search bar (debounced 300 ms, searches order ID + product name)
 *   4. OrderFilters (status tabs + time range picker)
 *   5. OrderHistoryList (infinite scroll cards)
 *
 * ─── Auth guard ───────────────────────────────────────────────────────────────
 *   Reads vt_token from localStorage → sessionStorage.
 *   Unauthenticated users → /auth/login?next=/account/orders
 *
 * ─── State ───────────────────────────────────────────────────────────────────
 *   searchInput   — immediate (controls the text input value)
 *   searchQuery   — debounced (passed to OrderHistoryList, triggers API)
 *   filters       — { status, timeRange } (passed to OrderFilters + List)
 *   totalCount    — total orders matching current filters (shown in chip)
 *   toasts        — toast notification stack
 *
 * ─── Components used ──────────────────────────────────────────────────────────
 *   OrderFilters      →  apps/web/components/orders/OrderFilters.tsx
 *   OrderHistoryList  →  apps/web/components/orders/OrderHistoryList.tsx
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
import {
  faBox, faMagnifyingGlass, faCircleUser, faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { CustomerHeader, CustomerFooter, MobileBottomNav } from '@/components/layout/CustomerShell';

import OrderFilters, {
  type OrderFiltersState,
} from '../../../components/orders/OrderFilters';

import OrderHistoryList from '../../../components/orders/OrderHistoryList';

// ─── Design tokens (mirrors account page exactly) ─────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const SEARCH_DEBOUNCE_MS = 300;

const DEFAULT_FILTERS: OrderFiltersState = {
  status:    'all',
  timeRange: '30d',
};

// ─── Auth helpers (identical to account/page.tsx) ──────────────────────────────
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

// ─── Toast stack ──────────────────────────────────────────────────────────────
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
            animation:     'vt-oh-toast-in 0.22s ease forwards',
          }}
        >
          <style>{`
            @keyframes vt-oh-toast-in {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <span aria-hidden="true">{t.kind === 'success' ? '✓' : '⚠'}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="மூடு"
            style={{
              background: 'none',
              border:     'none',
              color:      '#fff',
              cursor:     'pointer',
              fontSize:   '1.1rem',
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

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({
  value,
  onChange,
  onClear,
  disabled = false,
}: {
  value:     string;
  onChange:  (val: string) => void;
  onClear:   () => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Search icon */}
      <span
        aria-hidden="true"
        style={{
          position:       'absolute',
          left:           '14px',
          top:            '50%',
          transform:      'translateY(-50%)',
          pointerEvents:  'none',
          display:        'flex',
          alignItems:     'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke={T.muted} strokeWidth="1.5" />
          <path d="M12.5 12.5L16 16" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ஆர்டர் ID அல்லது பொருள் பெயர் தேடவும்"
        disabled={disabled}
        aria-label="ஆர்டர்கள் தேடவும்"
        style={{
          width:       '100%',
          boxSizing:   'border-box',
          height:      '46px',
          padding:     '0 42px 0 42px',
          border:      `1.5px solid ${T.border}`,
          borderRadius:'14px',
          background:  'rgba(255, 255, 255, 0.05)',
          fontFamily:  FONT.body,
          fontSize:    '0.9rem',
          color:       T.darkText,
          outline:     'none',
          transition:  'border-color 0.15s, box-shadow 0.15s',
          cursor:      disabled ? 'not-allowed' : 'text',
          opacity:     disabled ? 0.6 : 1,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--vt-forest-600)';
          e.target.style.boxShadow  = '0 0 0 3px rgba(61, 138, 92, 0.15)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = T.border;
          e.target.style.boxShadow  = 'none';
        }}
      />

      {/* Clear button */}
      {value.length > 0 && !disabled && (
        <button
          type="button"
          onClick={onClear}
          aria-label="தேடலை அழி"
          style={{
            position:       'absolute',
            right:          '12px',
            top:            '50%',
            transform:      'translateY(-50%)',
            background:     T.creamAlt,
            border:         'none',
            borderRadius:   '50%',
            width:          '22px',
            height:         '22px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            cursor:         'pointer',
            color:          T.muted,
            fontSize:       '0.9rem',
            lineHeight:     1,
            flexShrink:     0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrderHistoryPage() {
  const router = useRouter();

  // ── Auth / mount guard ────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!getToken()) {
      router.replace('/auth/login?next=/account/orders');
    }
  }, [router]);

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(val.trim());
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  }, []);

  // Cleanup timer on unmount
  useEffect(
    () => () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); },
    [],
  );

  // ── Filters state ─────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<OrderFiltersState>(DEFAULT_FILTERS);

  // ── Total count (from list component's first-page response) ───────────────
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const toastCounter = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, kind: Toast['kind']) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, msg, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── 401 handler ───────────────────────────────────────────────────────────
  const handleUnauthorized = useCallback(() => {
    clearSession();
    router.replace('/auth/login?next=/account/orders');
  }, [router]);

  // ── Guard: not yet mounted ────────────────────────────────────────────────
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

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      <main
        style={{
          maxWidth: '640px',
          margin:   '0 auto',
          padding:  'clamp(18px, 4vw, 32px) 16px 20px',
        }}
      >
        {/* ── Page heading ─────────────────────────────────────────────── */}
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
              <FontAwesomeIcon icon={faBox} style={{ width: 18, height: 18, color: 'var(--vt-forest-600)' }} />
            </span>
            என் ஆர்டர்கள்
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
            உங்கள் அனைத்து ஆர்டர்களும் இங்கே காட்டப்படும்
          </p>
        </div>

        {/* ── Search bar ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: '16px' }}>
          <SearchBar
            value={searchInput}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
          />
        </div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div
          style={{
            background:   'var(--vt-card)',
            borderRadius: '18px',
            border:       `1px solid ${T.border}`,
            padding:      '14px 14px',
            marginBottom: '16px',
            boxShadow:    'var(--vt-shadow-sm)',
          }}
        >
          <OrderFilters
            filters={filters}
            onChange={setFilters}
            totalCount={totalCount}
          />
        </div>

        {/* ── Active search indicator ───────────────────────────────────── */}
        {searchQuery.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '8px 12px',
              background:   'rgba(201,146,42,0.07)',
              border:       '1px solid rgba(201,146,42,0.20)',
              borderRadius: '10px',
              marginBottom: '14px',
            }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 13, height: 13, color: '#9C8060' }} />
            </span>
            <span
              style={{
                fontFamily: FONT.body,
                fontSize:   '0.82rem',
                color:      T.secondaryText,
                flex:       1,
              }}
            >
              <strong style={{ color: T.gold, fontFamily: FONT.display }}>
                "{searchQuery}"
              </strong>
              {' '}தேடுகிறோம்…
            </span>
            <button
              type="button"
              onClick={handleSearchClear}
              aria-label="தேடலை அழி"
              style={{
                background:  'none',
                border:      'none',
                cursor:      'pointer',
                fontFamily:  FONT.body,
                fontSize:    '0.76rem',
                color:       T.muted,
                padding:     '0',
                textDecoration: 'underline',
              }}
            >
              அழி
            </button>
          </div>
        )}

        {/* ── Order list ────────────────────────────────────────────────── */}
        <OrderHistoryList
          filters={filters}
          searchQuery={searchQuery}
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

// ─── Bottom quick-nav links ───────────────────────────────────────────────────
const BOTTOM_LINKS: { href: string; icon: IconDefinition; labelTa: string }[] = [
  { href: '/account',  icon: faCircleUser, labelTa: 'என் கணக்கு'   },
  { href: '/',         icon: faLeaf,       labelTa: 'தொடர் கடைபிடி' },
];
