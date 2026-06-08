'use client';

/**
 * apps/web/app/account/page.tsx
 *
 * Vaithiyam — My Account Page
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Route ────────────────────────────────────────────────────────────────────
 *   /account
 *
 * ─── Layout ──────────────────────────────────────────────────────────────────
 *   1. Sticky forest-green header (brand mark + logout)
 *   2. ProfileCard     — shows current user, triggers edit
 *   3. EditProfileForm — slide-open panel below ProfileCard
 *   4. AddressBook     — add / edit / delete / set-default
 *
 * ─── Auth guard ───────────────────────────────────────────────────────────────
 *   Reads `vt_token` from localStorage → sessionStorage.
 *   Unauthenticated users are redirected to /auth/login?next=/account.
 *
 * ─── API contracts ────────────────────────────────────────────────────────────
 *   GET    /api/auth/profile              → UserProfile
 *   PATCH  /api/auth/profile              → UpdatedUserProfile
 *   POST   /api/auth/profile/photo        → { photoUrl: string }
 *
 *   GET    /api/addresses                 → Address[]
 *   POST   /api/addresses                 → Address
 *   PATCH  /api/addresses/:id             → Address
 *   DELETE /api/addresses/:id             → { ok: true }
 *   POST   /api/addresses/:id/set-default → Address[]  (server reorders)
 *
 * ─── Components used ──────────────────────────────────────────────────────────
 *   ProfileCard     →  apps/web/components/account/ProfileCard.tsx
 *   EditProfileForm →  apps/web/components/account/EditProfileForm.tsx
 *   AddressBook     →  apps/web/components/account/AddressBook.tsx
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter }         from 'next/navigation';
import Link                  from 'next/link';
import { FontAwesomeIcon }   from '@fortawesome/react-fontawesome';
import {
  faCircleUser, faBox, faPills, faHeadphones,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import ProfileCard, {
  type UserProfile,
} from '../../components/account/ProfileCard';

import EditProfileForm, {
  type ProfileUpdate,
} from '../../components/account/EditProfileForm';

import AddressBook, {
  type Address,
} from '../../components/account/AddressBook';

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

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getToken(): string | null {
  try {
    return (
      localStorage.getItem('vt_token') ??
      sessionStorage.getItem('vt_token')
    );
  } catch {
    return null;
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_user');
    sessionStorage.removeItem('vt_token');
    sessionStorage.removeItem('vt_user');
  } catch { /* ignore */ }
}

function authHeaders(): HeadersInit {
  const tok = getToken();
  return tok
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }
    : { 'Content-Type': 'application/json' };
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/auth/profile', { headers: authHeaders() });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(e.message ?? 'சுயவிவரம் ஏற்ற தோல்வி.');
  }
  return res.json() as Promise<UserProfile>;
}

async function patchProfile(update: ProfileUpdate): Promise<UserProfile> {
  const body: Record<string, string> = {};
  if (update.name)   body.name   = update.name;
  if (update.mobile) body.mobile = update.mobile;
  if (update.email)  body.email  = update.email;

  const res = await fetch('/api/auth/profile', {
    method:  'PATCH',
    headers: authHeaders(),
    body:    JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(e.message ?? 'சுயவிவரம் புதுப்பிக்க தோல்வி.');
  }
  return res.json() as Promise<UserProfile>;
}

async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('photo', file);
  const tok = getToken();
  const res = await fetch('/api/auth/profile/photo', {
    method:  'POST',
    headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    body:    form,
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(e.message ?? 'புகைப்படம் பதிவேற்ற தோல்வி.');
  }
  const data = await res.json() as { photoUrl: string };
  return data.photoUrl;
}

async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch('/api/addresses', { headers: authHeaders() });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(e.message ?? 'முகவரிகள் ஏற்ற தோல்வி.');
  }
  return res.json() as Promise<Address[]>;
}

async function createAddress(data: Omit<Address, 'id'>): Promise<Address> {
  const res = await fetch('/api/addresses', {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(data),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(e.message ?? 'முகவரி சேர்க்க தோல்வி.');
  }
  return res.json() as Promise<Address>;
}

async function updateAddress(id: string, data: Omit<Address, 'id'>): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}`, {
    method:  'PATCH',
    headers: authHeaders(),
    body:    JSON.stringify(data),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(e.message ?? 'முகவரி திருத்த தோல்வி.');
  }
  return res.json() as Promise<Address>;
}

async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(`/api/addresses/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(e.message ?? 'முகவரி நீக்க தோல்வி.');
  }
}

async function setDefaultAddress(id: string): Promise<Address[]> {
  const res = await fetch(`/api/addresses/${id}/set-default`, {
    method:  'POST',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(e.message ?? 'இயல்புநிலை அமைக்க தோல்வி.');
  }
  return res.json() as Promise<Address[]>;
}

// ─── Page-level skeleton ───────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        @keyframes vt-acct-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
      {/* ProfileCard skeleton */}
      <div style={{ height: 230, borderRadius: '24px', background: T.creamAlt, animation: 'vt-acct-pulse 1.4s ease-in-out infinite' }} />
      {/* AddressBook skeleton */}
      <div style={{ height: 180, borderRadius: '24px', background: T.creamAlt, animation: 'vt-acct-pulse 1.4s ease-in-out infinite', animationDelay: '0.12s' }} />
    </div>
  );
}

// ─── Error state ───────────────────────────────────────────────────────────────
function PageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        textAlign:     'center',
        padding:       '48px 24px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '16px',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '3rem', lineHeight: 1 }}>⚠️</span>
      <div>
        <h2 style={{ fontFamily: FONT.display, fontSize: '1.1rem', fontWeight: 700, color: T.darkText, margin: '0 0 6px' }}>
          தகவல் ஏற்ற தோல்வி
        </h2>
        <p style={{ fontFamily: FONT.body, fontSize: '0.88rem', color: T.secondaryText, margin: '0 0 20px', lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding:      '11px 28px',
          border:       'none',
          borderRadius: '100px',
          background:   `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
          color:        '#fff',
          fontFamily:   FONT.display,
          fontSize:     '0.9rem',
          fontWeight:   700,
          cursor:       'pointer',
          boxShadow:    '0 3px 12px rgba(26,58,42,0.22)',
        }}
      >
        மீண்டும் முயற்சி
      </button>
    </div>
  );
}

// ─── Toast notification ────────────────────────────────────────────────────────
interface Toast { id: number; msg: string; kind: 'success' | 'error' }

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
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
            display:        'flex',
            alignItems:     'center',
            gap:            '10px',
            padding:        '12px 16px',
            borderRadius:   '14px',
            background:     t.kind === 'success'
              ? `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`
              : T.terracotta,
            color:          '#fff',
            fontFamily:     FONT.display,
            fontSize:       '0.88rem',
            fontWeight:     600,
            boxShadow:      '0 4px 20px rgba(0,0,0,0.18)',
            pointerEvents:  'all',
          }}
        >
          <span aria-hidden="true">{t.kind === 'success' ? '✓' : '⚠'}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', padding: '2px', lineHeight: 1, flexShrink: 0 }}
            aria-label="மூடு"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const router = useRouter();

  // ── Auth / mount guard ────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!getToken()) {
      router.replace('/auth/login?next=/account');
    }
  }, [router]);

  // ── Data state ────────────────────────────────────────────────────────────
  const [user,           setUser]           = useState<UserProfile | null>(null);
  const [addresses,      setAddresses]      = useState<Address[]>([]);
  const [loading,        setLoading]        = useState(true);
  const addrLoading = false;
  const [pageError,      setPageError]      = useState('');

  // ── UI state ──────────────────────────────────────────────────────────────
  const [editOpen,       setEditOpen]       = useState(false);
  const [profileSaveErr, setProfileSaveErr] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

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

  // ── Handle 401 anywhere ───────────────────────────────────────────────────
  const handle401 = useCallback(() => {
    clearSession();
    router.replace('/auth/login?next=/account');
  }, [router]);

  // ── Load profile + addresses ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [profile, addrs] = await Promise.all([
        fetchProfile(),
        fetchAddresses(),
      ]);
      setUser(profile);
      setAddresses(addrs);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        handle401();
        return;
      }
      setPageError(
        err instanceof Error ? err.message : 'தகவல் ஏற்ற தோல்வி. மீண்டும் முயற்சிக்கவும்.'
      );
    } finally {
      setLoading(false);
    }
  }, [handle401]);

  useEffect(() => {
    if (mounted && getToken()) {
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // ── Profile save ──────────────────────────────────────────────────────────
  const handleProfileSave = useCallback(async (data: ProfileUpdate) => {
    setProfileSaveErr('');
    try {
      // 1. If a new photo was selected, upload it first
      if (data.photoFile instanceof File) {
        const photoUrl = await uploadPhoto(data.photoFile);
        setUser((prev) => prev ? { ...prev, photoUrl } : prev);
      } else if (data.photoFile === null) {
        // Photo removed — send null to API
        setUser((prev) => prev ? { ...prev, photoUrl: undefined } : prev);
      }

      // 2. Patch text fields
      const updated = await patchProfile(data);
      setUser(updated);
      setEditOpen(false);
      showToast('சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது! ✓', 'success');
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') { handle401(); return; }
      const msg = err instanceof Error ? err.message : 'சுயவிவரம் சேமிக்க தோல்வி.';
      setProfileSaveErr(msg);
    }
  }, [handle401, showToast]);

  // ── Photo quick-change from ProfileCard ───────────────────────────────────
  const filePickerRef = useRef<HTMLInputElement>(null);

  const handlePhotoChangeTrigger = useCallback(() => {
    filePickerRef.current?.click();
  }, []);

  const handleQuickPhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setPhotoUploading(true);
    try {
      const photoUrl = await uploadPhoto(file);
      setUser((prev) => prev ? { ...prev, photoUrl } : prev);
      showToast('புகைப்படம் புதுப்பிக்கப்பட்டது! ✓', 'success');
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') { handle401(); return; }
      showToast(err instanceof Error ? err.message : 'புகைப்படம் பதிவேற்ற தோல்வி.', 'error');
    } finally {
      setPhotoUploading(false);
    }
  }, [handle401, showToast]);

  // ── Address CRUD ──────────────────────────────────────────────────────────
  const handleAddAddress = useCallback(async (data: Omit<Address, 'id'>) => {
    const created = await createAddress(data);
    setAddresses((prev) => {
      // If new addr is default, strip default from others
      if (data.isDefault) {
        return [...prev.map((a) => ({ ...a, isDefault: false })), created];
      }
      return [...prev, created];
    });
    showToast('முகவரி வெற்றிகரமாக சேர்க்கப்பட்டது! ✓', 'success');
  }, [showToast]);

  const handleUpdateAddress = useCallback(async (id: string, data: Omit<Address, 'id'>) => {
    const updated = await updateAddress(id, data);
    setAddresses((prev) => {
      const next = prev.map((a) => a.id === id ? updated : a);
      if (data.isDefault) return next.map((a) => ({ ...a, isDefault: a.id === id }));
      return next;
    });
    showToast('முகவரி புதுப்பிக்கப்பட்டது! ✓', 'success');
  }, [showToast]);

  const handleDeleteAddress = useCallback(async (id: string) => {
    await deleteAddress(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    showToast('முகவரி நீக்கப்பட்டது.', 'success');
  }, [showToast]);

  const handleSetDefaultAddress = useCallback(async (id: string) => {
    const updated = await setDefaultAddress(id);
    // Server returns the full updated list with correct isDefault flags
    if (Array.isArray(updated) && updated.length > 0) {
      setAddresses(updated);
    } else {
      // Fallback: update locally
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    }
    showToast('இயல்புநிலை முகவரி அமைக்கப்பட்டது! ✓', 'success');
  }, [showToast]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    clearSession();
    router.replace('/');
  }, [router]);

  // ── Guard: not yet mounted ────────────────────────────────────────────────
  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight:     '100dvh',
        background:    T.creamBase,
        paddingBottom: '64px',
      }}
    >
      {/* ── Sticky forest header ─────────────────────────────────────────── */}
      <header
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
            padding:    '14px 18px',
            display:    'flex',
            alignItems: 'center',
            gap:        '12px',
          }}
        >
          {/* Back button */}
          <Link
            href="/"
            aria-label="முகப்பு திரும்பு"
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
            }}
          >
            <BackArrowIcon />
          </Link>

          {/* Brand */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link
              href="/"
              style={{
                display:        'block',
                fontFamily:     FONT.display,
                fontSize:       '1.1rem',
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
                color:      'rgba(240,201,110,0.58)',
                marginTop:  '1px',
              }}
            >
              என் கணக்கு
            </span>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '7px 14px',
              border:         '1px solid rgba(240,201,110,0.24)',
              borderRadius:   '100px',
              background:     'rgba(240,201,110,0.07)',
              cursor:         'pointer',
              fontFamily:     FONT.display,
              fontSize:       '0.76rem',
              fontWeight:     700,
              color:          T.goldPale,
              whiteSpace:     'nowrap',
              flexShrink:     0,
              transition:     'all 0.15s',
            }}
          >
            <LogoutIcon />
            வெளியேறு
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: '640px',
          margin:   '0 auto',
          padding:  'clamp(20px, 4vw, 36px) 16px 0',
        }}
      >
        {/* ── Page title ─────────────────────────────────────────────────── */}
        <h1
          style={{
            fontFamily:   FONT.display,
            fontSize:     'clamp(1.35rem, 4vw, 1.65rem)',
            fontWeight:   700,
            color:        T.darkText,
            margin:       '0 0 24px',
            lineHeight:   1.25,
            letterSpacing:'0.01em',
          }}
        >
          <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', marginRight: 6 }}>
            <FontAwesomeIcon icon={faCircleUser} style={{ width: 20, height: 20, color: '#1A3A2A' }} />
          </span>
          என் கணக்கு
        </h1>

        {/* Loading */}
        {loading && <PageSkeleton />}

        {/* Page-level error */}
        {!loading && pageError && (
          <div
            style={{
              background:   '#FFFFFF',
              border:       `1px solid ${T.border}`,
              borderRadius: '24px',
              overflow:     'hidden',
            }}
          >
            <PageError message={pageError} onRetry={loadData} />
          </div>
        )}

        {/* Loaded content */}
        {!loading && !pageError && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── 1. ProfileCard ───────────────────────────────────────── */}
            <ProfileCard
              user={user}
              onEdit={() => {
                setEditOpen((prev) => {
                  if (!prev) {
                    // Scroll to edit form after open
                    setTimeout(() => {
                      document.getElementById('vt-edit-profile-form')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                  }
                  return !prev;
                });
              }}
              onPhotoChange={handlePhotoChangeTrigger}
              uploading={photoUploading}
            />

            {/* Hidden file input for quick photo change */}
            <input
              ref={filePickerRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleQuickPhotoChange}
              style={{ display: 'none' }}
            />

            {/* ── 2. EditProfileForm (animated slide) ──────────────────── */}
            <div
              id="vt-edit-profile-form"
              style={{
                maxHeight:  editOpen ? '1200px' : '0',
                overflow:   'hidden',
                transition: 'max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              aria-hidden={!editOpen}
            >
              {/* Always render in DOM so animation is smooth; EditProfileForm is hidden visually */}
              <div style={{ paddingBottom: editOpen ? '0' : '0' }}>
                <EditProfileForm
                  user={user}
                  onSave={handleProfileSave}
                  onCancel={() => {
                    setEditOpen(false);
                    setProfileSaveErr('');
                  }}
                  serverError={profileSaveErr}
                  onClearServerError={() => setProfileSaveErr('')}
                  disabled={!editOpen}
                />
              </div>
            </div>

            {/* ── Divider ─────────────────────────────────────────────── */}
            <div
              aria-hidden="true"
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '12px',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: T.border }} />
              <span style={{ fontFamily: FONT.body, fontSize: '0.72rem', color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap' }}>
                டெலிவரி முகவரிகள்
              </span>
              <div style={{ flex: 1, height: '1px', background: T.border }} />
            </div>

            {/* ── 3. AddressBook ───────────────────────────────────────── */}
            <AddressBook
              addresses={addresses}
              loading={addrLoading}
              onAdd={handleAddAddress}
              onUpdate={handleUpdateAddress}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefaultAddress}
            />

            {/* ── Account links ────────────────────────────────────────── */}
            <nav
              aria-label="கணக்கு விருப்பங்கள்"
              style={{
                background:   '#FFFFFF',
                border:       `1px solid ${T.border}`,
                borderRadius: '20px',
                overflow:     'hidden',
                boxShadow:    '0 1px 8px rgba(26,58,42,0.06)',
              }}
            >
              {ACCOUNT_LINKS.map((link, i) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      display:     'flex',
                      alignItems:  'center',
                      gap:         '14px',
                      padding:     '15px 18px',
                      textDecoration: 'none',
                      transition:  'background 0.14s',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width:          '36px',
                        height:         '36px',
                        borderRadius:   '10px',
                        background:     link.bg,
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                      }}
                    >
                      <FontAwesomeIcon icon={link.icon} style={{ width: 17, height: 17, color: '#1A3A2A' }} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: FONT.display, fontSize: '0.9rem', fontWeight: 700, color: T.darkText, margin: '0 0 1px', lineHeight: 1.3 }}>
                        {link.labelTa}
                      </p>
                      <p style={{ fontFamily: FONT.body, fontSize: '0.74rem', color: T.muted, margin: 0, lineHeight: 1.4 }}>
                        {link.descTa}
                      </p>
                    </div>
                    <ChevronRightIcon />
                  </Link>
                  {i < ACCOUNT_LINKS.length - 1 && (
                    <div aria-hidden="true" style={{ height: '1px', background: T.border, margin: '0 18px' }} />
                  )}
                </div>
              ))}
            </nav>

            {/* ── Logout (mobile bottom) ───────────────────────────────── */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width:          '100%',
                padding:        '14px',
                border:         `1.5px solid rgba(139,58,47,0.22)`,
                borderRadius:   '16px',
                background:     'rgba(139,58,47,0.04)',
                cursor:         'pointer',
                fontFamily:     FONT.display,
                fontSize:       '0.92rem',
                fontWeight:     700,
                color:          T.terracotta,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
                transition:     'all 0.15s',
              }}
            >
              <LogoutIcon color={T.terracotta} />
              கணக்கிலிருந்து வெளியேறு
            </button>
          </div>
        )}
      </main>

      {/* ── Toast notifications ───────────────────────────────────────────── */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <style>{`
        @keyframes vt-acct-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

// ─── Account navigation links ─────────────────────────────────────────────────
const ACCOUNT_LINKS: {
  href: string; icon: IconDefinition; labelTa: string; descTa: string; bg: string;
}[] = [
  {
    href:    '/account/orders',
    icon:    faBox,
    labelTa: 'என் ஆர்டர்கள்',
    descTa:  'ஆர்டர் வரலாறு மற்றும் கண்காணிப்பு',
    bg:      'rgba(61,122,85,0.10)',
  },
  {
    href:    '/prescriptions',
    icon:    faPills,
    labelTa: 'என் பரிந்துரைகள்',
    descTa:  'மருந்து சீட்டு பதிவேற்றங்கள்',
    bg:      'rgba(201,146,42,0.10)',
  },
  {
    href:    '/help',
    icon:    faHeadphones,
    labelTa: 'உதவி மற்றும் ஆதரவு',
    descTa:  'கேள்விகள் மற்றும் புகார்கள்',
    bg:      'rgba(26,58,42,0.08)',
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 3L5 9l6 6" stroke={T.goldPale} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LogoutIcon({ color = T.goldPale }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6 3H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 12l4-3-4-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 9H7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke={T.muted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
