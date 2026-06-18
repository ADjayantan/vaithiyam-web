'use client';

/**
 * apps/web/components/orders/OrderHistoryList.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Order History List
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Infinite scroll via IntersectionObserver on a sentinel <div>
 *   • Stale-fetch prevention with AbortController per filter change
 *   • Initial loading state  — animated card skeletons
 *   • "Load more" state      — spinner below last card
 *   • Empty state            — contextual Tamil message for each filter combo
 *   • Error state            — retry button
 *   • Filter + search integration — full reset on any filter/query change
 *   • Reorder handler        — POST /api/orders/:id/reorder → redirect to cart
 *   • Invoice handler        — GET /api/orders/:id/invoice → open in new tab
 *   • All callbacks emit toast events via onToast prop (parent shows toast)
 *
 * ─── API contract ─────────────────────────────────────────────────────────────
 *   GET /api/orders/history
 *   Query params: status, timeRange, query, page, limit (20)
 *   Response: { orders: OrderHistorySummary[], total: number, hasMore: boolean }
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See OrderHistoryListProps below.
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { FontAwesomeIcon }   from '@fortawesome/react-fontawesome';
import {
  faBox, faMagnifyingGlass, faTruck,
  faCircleCheck, faGift, faCartShopping,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import OrderHistoryCard from './OrderHistoryCard';
import type { OrderHistorySummary } from './OrderHistoryCard';
import type { OrderFiltersState }   from './OrderFilters';

// ─── Design tokens ────────────────────────────────────────────────────
const T = {
  forestPrimary: 'var(--vt-forest-800)',
  creamBase:     'var(--vt-void)',
  creamAlt:      'rgba(255, 255, 255, 0.05)',
  gold:          'var(--vt-gold-500)',
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
} as const;

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE           = 20;
const SENTINEL_ROOT_MARGIN = '300px'; // preload before sentinel is visible

// ─── Auth helper (mirrors account page exactly) ────────────────────────────────
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

// ─── API response type ────────────────────────────────────────────────────────
interface OrdersApiResponse {
  orders:   OrderHistorySummary[];
  total:    number;
  hasMore:  boolean;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchOrdersApi(
  filters:     OrderFiltersState,
  searchQuery: string,
  page:        number,
  signal:      AbortSignal,
): Promise<OrdersApiResponse> {
  const params = new URLSearchParams({
    status:    filters.status,
    timeRange: filters.timeRange,
    page:      String(page),
    limit:     String(PAGE_SIZE),
  });
  if (searchQuery.trim()) params.set('query', searchQuery.trim());

  const res = await fetch(`/api/orders/history?${params.toString()}`, {
    headers: authHeaders(),
    signal,
  });

  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'ஆர்டர்கள் ஏற்ற தோல்வி.');
  }
  return res.json() as Promise<OrdersApiResponse>;
}

// POST /api/orders/:orderId/reorder — adds all items back to cart
async function reorderApi(orderId: string): Promise<{ cartItemsAdded: number }> {
  const res = await fetch(`/api/orders/${orderId}/reorder`, {
    method:  'POST',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'மீண்டும் ஆர்டர் செய்ய தோல்வி.');
  }
  return res.json() as Promise<{ cartItemsAdded: number }>;
}

// GET /api/orders/:orderId/invoice — returns a PDF/blob response
async function fetchInvoiceUrl(orderId: string): Promise<string> {
  const res = await fetch(`/api/orders/${orderId}/invoice`, {
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'விலைப்பட்டியல் ஏற்ற தோல்வி.');
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OrderHistoryListProps {
  filters:     OrderFiltersState;
  searchQuery: string;
  onTotalCount?: (total: number) => void;
  onToast:     (msg: string, kind: 'success' | 'error') => void;
  onUnauthorized: () => void;
}

// ─── Card skeleton ────────────────────────────────────────────────────────────
function CardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        background:   'var(--vt-card)',
        borderRadius: '20px',
        border:       `1px solid ${T.border}`,
        padding:      '15px',
        animation:    `vt-ohl-pulse 1.5s ease-in-out ${delay}ms infinite`,
      }}
    >
      <style>{`
        @keyframes vt-ohl-pulse {
          0%,100% { opacity: 1;    }
          50%      { opacity: 0.45; }
        }
      `}</style>

      {/* Top row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
        {/* Thumb placeholders */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 48, height: 48, borderRadius: 11, background: T.creamAlt }} />
          ))}
        </div>
        {/* Meta */}
        <div style={{ flex: 1 }}>
          <div style={{ height: 20, borderRadius: 6, background: T.creamAlt, marginBottom: 8, width: '55%' }} />
          <div style={{ height: 14, borderRadius: 6, background: T.creamAlt, width: '70%' }} />
        </div>
        {/* Total */}
        <div style={{ width: 60 }}>
          <div style={{ height: 22, borderRadius: 6, background: T.creamAlt }} />
        </div>
      </div>

      {/* CTA row */}
      <div style={{ height: 1, background: T.border, margin: '10px 0' }} />
      <div style={{ display: 'flex', gap: 7 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 38, borderRadius: 10, background: T.creamAlt, animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function LoadMoreSpinner() {
  return (
    <div
      role="status"
      aria-label="மேலும் ஆர்டர்கள் ஏற்றுகிறோம்"
      style={{
        display:        'flex',
        justifyContent: 'center',
        padding:        '24px 0',
      }}
    >
      <svg
        width="28" height="28" viewBox="0 0 24 24" fill="none"
        aria-hidden="true"
        style={{ animation: 'vt-ohl-spin 0.8s linear infinite' }}
      >
        <style>{`@keyframes vt-ohl-spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke={T.creamAlt} strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke={T.leaf} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  filters,
  searchQuery,
}: {
  filters:     OrderFiltersState;
  searchQuery: string;
}) {
  const hasSearch = searchQuery.trim().length > 0;
  const isFiltered = filters.status !== 'all' || filters.timeRange !== '30d';

  let icon:    IconDefinition = faBox;
  let heading = 'ஆர்டர்கள் இல்லை';
  let body    = 'இன்னும் எந்த ஆர்டரும் செய்யவில்லை.';

  if (hasSearch) {
    icon    = faMagnifyingGlass;
    heading = 'பொருத்தம் இல்லை';
    body    = `"${searchQuery}" க்கு எந்த ஆர்டரும் கிடைக்கவில்லை.`;
  } else if (filters.status === 'active') {
    icon    = faTruck;
    heading = 'செயலில் ஆர்டர்கள் இல்லை';
    body    = 'தற்போது எந்த ஆர்டரும் டெலிவரி வழியில் இல்லை.';
  } else if (filters.status === 'delivered') {
    icon    = faCircleCheck;
    heading = 'டெலிவரி ஆர்டர்கள் இல்லை';
    body    = 'இந்த காலகட்டத்தில் டெலிவரி ஆர்டர்கள் இல்லை.';
  } else if (filters.status === 'cancelled') {
    icon    = faGift;
    heading = 'ரத்து ஆர்டர்கள் இல்லை';
    body    = 'அருமை! எந்த ஆர்டரும் ரத்து செய்யப்படவில்லை.';
  } else if (isFiltered) {
    body    = 'இந்த வடிகட்டிகளுக்கு எந்த ஆர்டரும் கிடைக்கவில்லை.';
  }

  return (
    <div
      role="status"
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '14px',
        padding:        '56px 24px',
        textAlign:      'center',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          lineHeight: 1,
          display:    'inline-flex',
          animation: 'vt-ohl-float 3s ease-in-out infinite',
        }}
      >
        <FontAwesomeIcon icon={icon} style={{ width: 48, height: 48, color: 'rgba(61,138,92,0.38)' }} />
      </span>
      <style>{`
        @keyframes vt-ohl-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
      `}</style>
      <div>
        <h3
          style={{
            fontFamily:  FONT.display,
            fontSize:    '1.1rem',
            fontWeight:  700,
            color:       T.darkText,
            margin:      '0 0 6px',
            lineHeight:  1.3,
          }}
        >
          {heading}
        </h3>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize:   '0.88rem',
            color:      T.secondaryText,
            margin:     0,
            lineHeight: 1.6,
            maxWidth:   '260px',
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
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
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2.8rem', lineHeight: 1 }}>⚠️</span>
      <div>
        <h3
          style={{
            fontFamily:  FONT.display,
            fontSize:    '1rem',
            fontWeight:  700,
            color:       T.darkText,
            margin:      '0 0 6px',
          }}
        >
          ஆர்டர்கள் ஏற்ற தோல்வி
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
      aria-label="அனைத்து ஆர்டர்களும் காட்டப்படுகின்றன"
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
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '10px',
          width:      '100%',
          maxWidth:   '280px',
        }}
        aria-hidden="true"
      >
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontFamily: FONT.body, fontSize: '0.72rem', color: T.muted, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          இறுதி
        </span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
    </div>
  );
}

// ─── Main list component ──────────────────────────────────────────────────────
export default function OrderHistoryList({
  filters,
  searchQuery,
  onTotalCount,
  onToast,
  onUnauthorized,
}: OrderHistoryListProps) {
  const [orders,      setOrders]      = useState<OrderHistorySummary[]>([]);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loading,     setLoading]     = useState(true);  // initial page load
  const [loadingMore, setLoadingMore] = useState(false); // pagination
  const [error,       setError]       = useState('');

  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // ── Initial / filter-change fetch ─────────────────────────────────────────
  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setOrders([]);
    setPage(1);
    setHasMore(true);
    setError('');
    setLoading(true);

    fetchOrdersApi(filters, searchQuery, 1, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setOrders(data.orders);
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
  }, [filters, searchQuery]);

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);

    const ctrl = new AbortController();

    fetchOrdersApi(filters, searchQuery, nextPage, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setOrders((prev) => [...prev, ...data.orders]);
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
  }, [loadingMore, hasMore, loading, page, filters, searchQuery, onToast, onUnauthorized]);

  // ── IntersectionObserver for infinite scroll ──────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: SENTINEL_ROOT_MARGIN },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Retry ─────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError('');
    setLoading(true);

    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;

    fetchOrdersApi(filters, searchQuery, 1, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setOrders(data.orders);
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
  }, [filters, searchQuery, onTotalCount, onUnauthorized]);

  // ── Reorder handler ───────────────────────────────────────────────────────
  const handleReorder = useCallback(
    async (order: OrderHistorySummary) => {
      try {
        const { cartItemsAdded } = await reorderApi(order.orderId);
        onToast(
          `${cartItemsAdded} பொருட்கள் கார்ட்டில் சேர்க்கப்பட்டன!`,
          'success',
        );
        // Optionally navigate to cart — parent can intercept via onToast or add a callback
        // router.push('/cart');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'மீண்டும் ஆர்டர் தோல்வி.';
        if (msg === 'UNAUTHORIZED') { onUnauthorized(); return; }
        onToast(msg, 'error');
      }
    },
    [onToast, onUnauthorized],
  );

  // ── Invoice handler ───────────────────────────────────────────────────────
  const handleInvoice = useCallback(
    async (order: OrderHistorySummary) => {
      try {
        // Use cached URL if available; otherwise fetch from API
        const url = order.invoiceUrl ?? await fetchInvoiceUrl(order.orderId);
        window.open(url, '_blank', 'noopener,noreferrer');
        onToast('விலைப்பட்டியல் திறக்கப்படுகிறது…', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'விலைப்பட்டியல் ஏற்ற தோல்வி.';
        if (msg === 'UNAUTHORIZED') { onUnauthorized(); return; }
        onToast(msg, 'error');
      }
    },
    [onToast, onUnauthorized],
  );

  // ── Render: initial loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div
        role="status"
        aria-label="ஆர்டர்கள் ஏற்றுகிறோம்"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} delay={i * 80} />
        ))}
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        style={{
          background:   'var(--vt-card)',
          borderRadius: '20px',
          border:       `1px solid ${T.border}`,
        }}
      >
        <ErrorState message={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ── Render: empty ─────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div
        style={{
          background:   'var(--vt-card)',
          borderRadius: '20px',
          border:       `1px solid ${T.border}`,
        }}
      >
        <EmptyState filters={filters} searchQuery={searchQuery} />
      </div>
    );
  }

  // ── Render: list ─────────────────────────────────────────────────────────
  return (
    <div>
      <div
        role="feed"
        aria-label="ஆர்டர் வரலாறு"
        aria-busy={loadingMore}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {orders.map((order) => (
          <OrderHistoryCard
            key={order.orderId}
            order={order}
            onReorder={handleReorder}
            onInvoice={handleInvoice}
          />
        ))}
      </div>

      {/* Load-more spinner */}
      {loadingMore && <LoadMoreSpinner />}

      {/* End of list marker */}
      {!hasMore && !loadingMore && orders.length > 0 && <EndMarker />}

      {/* Sentinel for IntersectionObserver — invisible, sits below last card */}
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
