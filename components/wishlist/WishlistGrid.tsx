'use client';

/**
 * apps/web/components/wishlist/WishlistGrid.tsx
 *
 * Vaithiyam — Wishlist Product Grid
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • 2-column responsive grid (WishlistCard shape — image-top portrait cards)
 *   • Infinite scroll via IntersectionObserver on a sentinel <div>
 *   • Stale-fetch prevention with AbortController per mount/retry
 *   • Initial loading state  — animated card skeletons (6 cards, 2-col)
 *   • "Load more" spinner    — below last row during pagination
 *   • Empty state            — delegates to EmptyWishlist component
 *   • Error state            — retry button, mirrors OrderHistoryList style
 *   • End-of-list marker     — "இறுதி" rule when all items rendered
 *   • Per-card loading state — addingToCart + removing tracked via Sets
 *   • Optimistic remove      — item removed from local state immediately on success
 *   • All callbacks emit toast events via onToast prop (parent shows toast)
 *
 * ─── API contracts ────────────────────────────────────────────────────────────
 *   GET    /api/wishlist?page=&limit=  →  { items: WishlistItem[], total: number, hasMore: boolean }
 *   DELETE /api/wishlist/:itemId       →  { ok: true }
 *   POST   /api/cart/add               →  { cartItemCount: number }
 *   Body for POST:  { productId: string, qty: 1 }
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See WishlistGridProps below.
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import WishlistCard  from './WishlistCard';
import EmptyWishlist from './EmptyWishlist';
import type { WishlistItem } from './WishlistCard';

// ─── Design tokens (identical to all Vaithiyam modules) ───────────────────────
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
} as const;

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE            = 20;
const SENTINEL_ROOT_MARGIN = '300px';

// ─── Auth helpers (mirrors account/page.tsx exactly) ──────────────────────────
function getToken(): string | null {
  try {
    return (
      localStorage.getItem('vt_token') ??
      sessionStorage.getItem('vt_token')
    );
  } catch { return null; }
}

function authHeaders(): HeadersInit {
  const tok = getToken();
  return tok
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }
    : { 'Content-Type': 'application/json' };
}

// ─── API types ────────────────────────────────────────────────────────────────
interface WishlistApiResponse {
  items:   WishlistItem[];
  total:   number;
  hasMore: boolean;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchWishlistApi(
  page:   number,
  signal: AbortSignal,
): Promise<WishlistApiResponse> {
  const params = new URLSearchParams({
    page:  String(page),
    limit: String(PAGE_SIZE),
  });
  const res = await fetch(`/api/wishlist?${params.toString()}`, {
    headers: authHeaders(),
    signal,
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'விருப்பப்பட்டியல் ஏற்ற தோல்வி.');
  }
  return res.json() as Promise<WishlistApiResponse>;
}

async function removeFromWishlistApi(itemId: string): Promise<void> {
  const res = await fetch(`/api/wishlist/${itemId}`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'நீக்க தோல்வி.');
  }
}

async function addToCartApi(
  item: WishlistItem,
): Promise<{ cartItemCount: number }> {
  const res = await fetch('/api/cart/add', {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({ productId: item.productId, qty: 1 }),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'கூடையில் சேர்க்க தோல்வி.');
  }
  return res.json() as Promise<{ cartItemCount: number }>;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface WishlistGridProps {
  /** Called once after first-page response with total item count */
  onTotalCount?:  (total: number) => void;
  /** Parent renders a ToastStack; grid emits events upward */
  onToast:        (msg: string, kind: 'success' | 'error') => void;
  /** Called on any 401 so parent can clear session and redirect */
  onUnauthorized: () => void;
}

// ─── Card skeleton — matches WishlistCard proportions ─────────────────────────
function CardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        background:    '#FFFFFF',
        borderRadius:  '20px',
        border:        `1px solid ${T.border}`,
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
        animation:     `vt-wg-pulse 1.5s ease-in-out ${delay}ms infinite`,
      }}
    >
      <style>{`
        @keyframes vt-wg-pulse {
          0%,100% { opacity: 1;    }
          50%      { opacity: 0.45; }
        }
      `}</style>

      {/* Image zone — matches WishlistCard aspect ratio (10/11) */}
      <div
        style={{
          width:       '100%',
          aspectRatio: '10 / 11',
          background:  T.creamAlt,
          position:    'relative',
        }}
      >
        {/* Tradition badge placeholder */}
        <div
          style={{
            position:     'absolute',
            top:          '10px',
            left:         '10px',
            width:        '52px',
            height:       '20px',
            borderRadius: '100px',
            background:   T.border,
          }}
        />
        {/* Heart button placeholder */}
        <div
          style={{
            position:     'absolute',
            top:          '8px',
            right:        '8px',
            width:        '30px',
            height:       '30px',
            borderRadius: '50%',
            background:   T.border,
          }}
        />
      </div>

      {/* Content zone */}
      <div
        style={{
          padding:       '14px 14px 0',
          display:       'flex',
          flexDirection: 'column',
          gap:           '8px',
          flex:          1,
        }}
      >
        <div style={{ height: 15, borderRadius: 5, background: T.creamAlt, width: '88%' }} />
        <div style={{ height: 15, borderRadius: 5, background: T.creamAlt, width: '66%' }} />
        <div style={{ height: 11, borderRadius: 5, background: T.creamAlt, width: '48%' }} />
        <div style={{ height: 11, borderRadius: 5, background: T.creamAlt, width: '36%' }} />
        <div style={{ height: 22, borderRadius: 5, background: T.creamAlt, width: '52%', marginTop: '2px' }} />
      </div>

      {/* CTA zone */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ height: 42, borderRadius: 12, background: T.creamAlt }} />
      </div>
    </div>
  );
}

// ─── Load-more spinner ────────────────────────────────────────────────────────
function LoadMoreSpinner() {
  return (
    <div
      role="status"
      aria-label="மேலும் பொருட்கள் ஏற்றுகிறோம்"
      style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}
    >
      <svg
        width="28" height="28" viewBox="0 0 24 24" fill="none"
        aria-hidden="true"
        style={{ animation: 'vt-wg-spin 0.8s linear infinite' }}
      >
        <style>{`@keyframes vt-wg-spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke={T.creamAlt} strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke={T.leaf} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '14px',
        padding:        '48px 24px',
        textAlign:      'center',
        background:     '#FFFFFF',
        borderRadius:   '20px',
        border:         `1px solid ${T.border}`,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2.8rem', lineHeight: 1 }}>⚠️</span>
      <div>
        <h3
          style={{
            fontFamily: FONT.display,
            fontSize:   '1rem',
            fontWeight: 700,
            color:      T.darkText,
            margin:     '0 0 6px',
          }}
        >
          விருப்பப்பட்டியல் ஏற்ற தோல்வி
        </h3>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '0.85rem',
            color:      T.secondaryText,
            margin:     '0 0 18px',
            lineHeight: 1.6,
            maxWidth:   '260px',
          }}
        >
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding:      '10px 28px',
          border:       'none',
          borderRadius: '100px',
          background:   `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
          color:        '#fff',
          fontFamily:   FONT.display,
          fontSize:     '0.88rem',
          fontWeight:   700,
          cursor:       'pointer',
          boxShadow:    '0 3px 10px rgba(26,58,42,0.22)',
        }}
      >
        மீண்டும் முயற்சி
      </button>
    </div>
  );
}

// ─── End-of-list marker ───────────────────────────────────────────────────────
function EndMarker() {
  return (
    <div
      role="status"
      aria-label="அனைத்து விருப்பங்களும் காட்டப்படுகின்றன"
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '8px',
        padding:        '28px 16px',
        textAlign:      'center',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '280px' }}
        aria-hidden="true"
      >
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span
          style={{
            fontFamily:    FONT.body,
            fontSize:      '0.72rem',
            color:         T.muted,
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
            whiteSpace:    'nowrap',
          }}
        >
          இறுதி
        </span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
    </div>
  );
}

// ─── Main grid ────────────────────────────────────────────────────────────────
export default function WishlistGrid({
  onTotalCount,
  onToast,
  onUnauthorized,
}: WishlistGridProps) {
  const [items,       setItems]       = useState<WishlistItem[]>([]);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loading,     setLoading]     = useState(true);   // initial page load
  const [loadingMore, setLoadingMore] = useState(false);  // pagination
  const [error,       setError]       = useState('');

  // Per-card loading sets — keyed by WishlistItem.id (entry ID, not productId)
  const [addingIds,   setAddingIds]   = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setItems([]);
    setPage(1);
    setHasMore(true);
    setError('');
    setLoading(true);

    fetchWishlistApi(1, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setItems(data.items);
        setHasMore(data.hasMore);
        onTotalCount?.(data.total);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'தோல்வி';
        if (msg === 'UNAUTHORIZED') { onUnauthorized(); return; }
        setError(msg);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);

    const ctrl = new AbortController();

    fetchWishlistApi(nextPage, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setItems((prev) => [...prev, ...data.items]);
        setHasMore(data.hasMore);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'மேலும் ஏற்ற தோல்வி.';
        if (msg === 'UNAUTHORIZED') { onUnauthorized(); return; }
        onToast(msg, 'error');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoadingMore(false);
      });
  }, [loadingMore, hasMore, loading, page, onToast, onUnauthorized]);

  // ── IntersectionObserver ──────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: SENTINEL_ROOT_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Retry ──────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError('');
    setLoading(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetchWishlistApi(1, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setItems(data.items);
        setPage(1);
        setHasMore(data.hasMore);
        onTotalCount?.(data.total);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'தோல்வி';
        if (msg === 'UNAUTHORIZED') { onUnauthorized(); return; }
        setError(msg);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  }, [onTotalCount, onUnauthorized]);

  // ── Add to cart ────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(
    async (item: WishlistItem) => {
      if (addingIds.has(item.id)) return;
      setAddingIds((prev) => new Set(prev).add(item.id));
      try {
        await addToCartApi(item);
        onToast(`${item.nameTa} கூடையில் சேர்க்கப்பட்டது!`, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'கூடையில் சேர்க்க தோல்வி.';
        if (msg === 'UNAUTHORIZED') { onUnauthorized(); return; }
        onToast(msg, 'error');
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev); next.delete(item.id); return next;
        });
      }
    },
    [addingIds, onToast, onUnauthorized],
  );

  // ── Remove from wishlist ───────────────────────────────────────────────────
  const handleRemove = useCallback(
    async (id: string) => {
      if (removingIds.has(id)) return;
      setRemovingIds((prev) => new Set(prev).add(id));
      try {
        await removeFromWishlistApi(id);
        // Optimistic update — splice from local state; parent count decremented
        setItems((prev) => {
          const next = prev.filter((item) => item.id !== id);
          onTotalCount?.(next.length);
          return next;
        });
        onToast('விருப்பப்பட்டியலிலிருந்து நீக்கப்பட்டது', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'நீக்க தோல்வி.';
        if (msg === 'UNAUTHORIZED') { onUnauthorized(); return; }
        onToast(msg, 'error');
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev); next.delete(id); return next;
        });
      }
    },
    [removingIds, onTotalCount, onToast, onUnauthorized],
  );

  // ── Render: initial loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div
        role="status"
        aria-label="விருப்பங்கள் ஏற்றுகிறோம்"
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:                 '12px',
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} delay={i * 60} />
        ))}
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} />;
  }

  // ── Render: empty ─────────────────────────────────────────────────────────
  if (items.length === 0) {
    return <EmptyWishlist />;
  }

  // ── Render: grid ──────────────────────────────────────────────────────────
  return (
    <div>
      <div
        role="feed"
        aria-label="விருப்பப்பட்டியல் பொருட்கள்"
        aria-busy={loadingMore}
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:                 '12px',
        }}
      >
        {items.map((item) => (
          <WishlistCard
            key={item.id}
            item={item}
            onAddToCart={handleAddToCart}
            onRemove={handleRemove}
            addingToCart={addingIds.has(item.id)}
            removing={removingIds.has(item.id)}
          />
        ))}
      </div>

      {/* Load-more spinner */}
      {loadingMore && <LoadMoreSpinner />}

      {/* End-of-list marker */}
      {!hasMore && !loadingMore && items.length > 0 && <EndMarker />}

      {/* Sentinel for IntersectionObserver — invisible, sits below last row */}
      {hasMore && (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          style={{ height: '1px', marginTop: '8px' }}
        />
      )}
    </div>
  );
}
