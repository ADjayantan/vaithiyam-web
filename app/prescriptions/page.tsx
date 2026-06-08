'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileCircleCheck,
  faFileCircleXmark,
  faHourglassHalf,
  faShieldHalved,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';

interface Prescription {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
}

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

/* ─── Design tokens (light cream theme matching screenshot) ─────── */
const S = {
  bg:          '#F5EFE0',
  cardBg:      '#FFFFFF',
  cardBorder:  '#E8DFC8',
  teal:        '#1A3A2A',
  tealLight:   '#2E6845',
  gold:        '#C9922A',
  ink:         '#1C2E22',
  muted:       '#7A8C7E',
  mutedLight:  '#A0B0A4',
  border:      '#DDD8CC',
  statBg:      '#F0EBD8',
  statBorder:  '#DDD0B8',
  uploadBg:    '#FAFAF7',
  uploadBorder:'#DDD0B8',
  shieldBg:    '#F0F7F2',
  shieldBorder:'#C8DDD0',
  shieldText:  '#2E6845',
} as const;

export default function PrescriptionsPage() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/prescriptions', { headers: authHeaders(), cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { prescriptions?: Prescription[] } | null) =>
        setItems(data?.prescriptions ?? [])
      )
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = useCallback(async () => {
    if (!file) { setStatusMsg('முதலில் ஒரு படம் அல்லது PDF தேர்வு செய்யவும்.'); return; }
    const token = getToken();
    if (!token) { setStatusMsg('பதிவேற்றுவதற்கு முன் உள்நுழையவும்.'); return; }
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'unknown',
          notes: notes.trim() || 'Uploaded from prescriptions page.',
        }),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'மேட்டாடேட்டா சேமிக்க இயலவில்லை.');
      setStatusMsg('மருந்துச் சீட்டு நிலுவையில் உள்ளது என சேமிக்கப்பட்டது.');
      setFile(null);
      setNotes('');
      load();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'பதிவேற்றம் தோல்வியடைந்தது.');
    } finally {
      setLoading(false);
    }
  }, [file, load, notes]);

  const counts = useMemo(() => ({
    pending:  items.filter((i) => i.status === 'pending_review').length,
    approved: items.filter((i) => i.status === 'approved').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
  }), [items]);

  return (
    <div style={{ minHeight: '100dvh', background: S.bg, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Mukta+Malar:wght@400;600;700&family=Hind+Madurai:wght@400;500;600&display=swap');

        .rx-page-header {
          position: sticky; top: 0; z-index: 100;
          background: #1A3A2A;
          box-shadow: 0 2px 12px rgba(0,0,0,0.18);
        }
        .rx-header-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px; height: 60px;
          display: flex; align-items: center; gap: 16px;
        }
        .rx-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .rx-brand-mark {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #3D7A55, #C9922A);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 1.1rem; font-weight: 700;
        }
        .rx-brand-text { display: grid; gap: 1px; }
        .rx-brand-title {
          font-family: 'Mukta Malar', sans-serif; font-size: 1.1rem; font-weight: 700;
          color: #F0C96E; line-height: 1; letter-spacing: 0.02em;
        }
        .rx-brand-sub {
          font-size: 0.58rem; color: rgba(240,201,110,0.55);
          text-transform: uppercase; letter-spacing: 0.12em; font-weight: 500;
        }
        .rx-header-search {
          flex: 1; max-width: 480px; margin: 0 auto; position: relative;
        }
        .rx-header-search-icon {
          position: absolute; top: 50%; left: 14px; transform: translateY(-50%);
          color: rgba(245,237,214,0.4); pointer-events: none;
          display: flex; align-items: center;
        }
        .rx-header-search input {
          width: 100%; height: 40px; padding: 0 18px 0 42px;
          border: 1px solid rgba(61,138,92,0.30); border-radius: 999px;
          outline: none; background: rgba(255,255,255,0.07);
          color: rgba(245,237,214,0.9); font-family: 'Hind Madurai', sans-serif;
          font-size: 0.84rem;
        }
        .rx-header-search input::placeholder { color: rgba(245,237,214,0.35); }
        .rx-header-search input:focus { border-color: rgba(61,138,92,0.6); background: rgba(255,255,255,0.10); }
        .rx-nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .rx-icon-btn {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(61,138,92,0.22);
          color: rgba(245,237,214,0.7); text-decoration: none; font-size: 1rem;
          transition: all 0.2s; cursor: pointer;
        }
        .rx-icon-btn:hover { background: rgba(61,138,92,0.18); color: white; }

        .rx-main {
          flex: 1; max-width: 1100px; width: 100%; margin: 0 auto;
          padding: 36px 24px 60px;
        }
        .rx-page-title {
          font-family: 'Mukta Malar', sans-serif; font-size: clamp(1.6rem, 3.5vw, 2.2rem);
          font-weight: 700; color: ${S.ink}; margin: 0 0 28px; line-height: 1.2;
        }
        .rx-grid {
          display: grid; gap: 20px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .rx-card {
          background: ${S.cardBg}; border: 1px solid ${S.cardBorder};
          border-radius: 16px; padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .rx-card-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px;
        }
        .rx-card-header-icon { color: #3D7A55; font-size: 1.1rem; }
        .rx-card-title {
          font-family: 'Mukta Malar', sans-serif; font-size: 1.05rem;
          font-weight: 700; color: ${S.ink}; margin: 0;
        }

        /* Upload drop zone */
        .rx-upload-zone {
          border: 2px dashed ${S.uploadBorder}; border-radius: 12px;
          background: ${S.uploadBg}; padding: 36px 20px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; text-align: center; cursor: pointer;
          transition: all 0.2s; min-height: 180px;
        }
        .rx-upload-zone.drag-over, .rx-upload-zone:hover {
          border-color: #3D7A55; background: rgba(61,122,85,0.04);
        }
        .rx-upload-hourglass { color: #C9922A; margin-bottom: 4px; }
        .rx-upload-title {
          font-family: 'Mukta Malar', sans-serif; font-weight: 700;
          color: ${S.ink}; font-size: 0.95rem; margin: 0;
        }
        .rx-upload-sub {
          font-size: 0.80rem; color: ${S.muted}; line-height: 1.55; max-width: 280px; margin: 0;
        }

        /* Notes textarea */
        .rx-notes {
          width: 100%; box-sizing: border-box;
          border: 1.5px solid ${S.border}; border-radius: 10px;
          padding: 12px 14px; background: ${S.uploadBg};
          font-family: 'Hind Madurai', sans-serif; font-size: 0.88rem;
          color: ${S.ink}; resize: vertical; min-height: 80px;
          outline: none; transition: border-color 0.15s;
        }
        .rx-notes:focus { border-color: #3D7A55; }
        .rx-notes::placeholder { color: ${S.mutedLight}; }

        /* Submit button */
        .rx-submit-btn {
          width: 100%; padding: 14px 20px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, #1A3A2A 0%, #2E6845 100%);
          color: white; font-family: 'Mukta Malar', sans-serif;
          font-size: 0.95rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .rx-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,58,42,0.28); }
        .rx-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Status stat cards */
        .rx-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .rx-stat-card {
          background: ${S.statBg}; border: 1px solid ${S.statBorder};
          border-radius: 10px; padding: 14px 12px;
          display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
        }
        .rx-stat-icon { font-size: 1rem; color: #3D7A55; }
        .rx-stat-num {
          font-family: 'Mukta Malar', sans-serif; font-size: 1.6rem;
          font-weight: 700; color: ${S.ink}; line-height: 1;
        }
        .rx-stat-label { font-size: 0.75rem; color: ${S.muted}; font-weight: 500; line-height: 1.3; }

        /* Shield safety note */
        .rx-shield-note {
          background: ${S.shieldBg}; border: 1px solid ${S.shieldBorder};
          border-radius: 10px; padding: 14px 16px;
          display: flex; gap: 10px; align-items: flex-start;
          margin-bottom: 16px;
        }
        .rx-shield-note svg { color: ${S.shieldText}; flex-shrink: 0; margin-top: 2px; }
        .rx-shield-note p { margin: 0; font-size: 0.80rem; color: ${S.shieldText}; line-height: 1.55; font-weight: 500; }

        /* Prescription list */
        .rx-prescription-item {
          background: ${S.statBg}; border: 1px solid ${S.statBorder};
          border-radius: 10px; padding: 14px;
          display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
        }
        .rx-prescription-name { font-weight: 700; font-size: 0.88rem; color: ${S.ink}; }
        .rx-prescription-date { font-size: 0.72rem; color: ${S.muted}; margin-top: 3px; }
        .rx-status-badge {
          flex-shrink: 0; font-size: 0.68rem; font-weight: 700;
          padding: 3px 10px; border-radius: 20px; text-transform: capitalize; letter-spacing: 0.04em;
        }
        .rx-status-pending  { background: rgba(201,146,42,0.14); color: #A07020; border: 1px solid rgba(201,146,42,0.25); }
        .rx-status-approved { background: rgba(61,122,85,0.14);  color: #2E6845; border: 1px solid rgba(61,122,85,0.25); }
        .rx-status-rejected { background: rgba(160,50,30,0.12);  color: #9B3A2A; border: 1px solid rgba(160,50,30,0.20); }

        .rx-empty-text { font-size: 0.84rem; color: ${S.muted}; margin: 0; }
        .rx-status-msg { font-size: 0.82rem; color: #2E6845; margin: 0; }

        @media (max-width: 680px) {
          .rx-header-search { display: none; }
          .rx-main { padding: 24px 16px 80px; }
        }
      `}</style>

      {/* ── Custom Header matching screenshot ─────────────────────── */}
      <header className="rx-page-header">
        <div className="rx-header-inner">
          <a href="/" className="rx-brand">
            <div className="rx-brand-mark">🌿</div>
            <div className="rx-brand-text">
              <span className="rx-brand-title">வைத்தியம்</span>
              <span className="rx-brand-sub">Siddha · Ayurveda · Natural</span>
            </div>
          </a>

          <div className="rx-header-search">
            <span className="rx-header-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input type="search" placeholder="மருந்து பெயரைத் தேடுங்கள்..." aria-label="Search medicines" />
          </div>

          <nav className="rx-nav-actions" aria-label="Header actions">
            <a href="/prescriptions" className="rx-icon-btn" aria-label="Upload prescription" title="Upload">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </a>
            <a href="/scanner" className="rx-icon-btn" aria-label="Scanner">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="5" height="5"/><rect x="2" y="15" width="5" height="5"/><rect x="17" y="4" width="5" height="5"/><line x1="8" y1="6.5" x2="16" y2="6.5"/><line x1="8" y1="17.5" x2="16" y2="17.5"/><line x1="17" y1="8" x2="17" y2="16"/><line x1="6.5" y1="10" x2="6.5" y2="15"/></svg>
            </a>
            <a href="/account/wishlist" className="rx-icon-btn" aria-label="Wishlist">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </a>
            <a href="/account" className="rx-icon-btn" aria-label="Account">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </a>
            <a href="/cart" className="rx-icon-btn" aria-label="Cart">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </a>
          </nav>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="rx-main">
        <h1 className="rx-page-title">மருந்துச் சீட்டு மேசை</h1>

        <div className="rx-grid">
          {/* ── Upload Card ─────────────────────────────────────── */}
          <div className="rx-card">
            <div className="rx-card-header">
              <span className="rx-card-header-icon">
                <FontAwesomeIcon icon={faUpload} style={{ width: 18, height: 18 }} />
              </span>
              <h2 className="rx-card-title">மருந்துச் சீட்டை பதிவேற்றவும்</h2>
            </div>

            <label
              className={`rx-upload-zone${dragOver ? ' drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped) setFile(dropped);
              }}
            >
              <span className="rx-upload-hourglass">
                <FontAwesomeIcon icon={faHourglassHalf} style={{ width: 42, height: 42 }} />
              </span>
              <p className="rx-upload-title">
                {file ? file.name : 'மருந்துச் சீட்டு அல்லது PDF ஐ தேர்வு செய்யவும்.'}
              </p>
              <p className="rx-upload-sub">
                படங்கள் மற்றும் PDF கள் இந்த டெமோவில் உள்ளூர் மேட்டாடேட்டாவால் குறிக்கப்படுகின்றன.
                மதிப்பாய்வு நிலுவையில் உள்ளது.
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: 'none' }}
              />
            </label>

            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Prescription preview"
                style={{
                  width: '100%', maxHeight: 220, objectFit: 'contain',
                  borderRadius: 10, border: `1px solid ${S.cardBorder}`,
                  background: '#fff', marginTop: 12,
                }}
              />
            )}

            <textarea
              className="rx-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="சரிபார்ப்புக் குழுவிற்கான விருப்ப குறிப்புகள்"
              style={{ marginTop: 12 }}
            />

            <button
              type="button"
              className="rx-submit-btn"
              disabled={loading}
              onClick={() => void submit()}
              style={{ marginTop: 14 }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  சேமிக்கிறோம்...
                </>
              ) : 'நிலுவையிலுள்ள மதிப்பாய்வை சேமிக்கவும்'}
            </button>

            {statusMsg && (
              <p className="rx-status-msg" style={{ marginTop: 10 }}>{statusMsg}</p>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* ── Status Overview Card ─────────────────────────────── */}
          <div className="rx-card">
            <h2 className="rx-card-title" style={{ marginBottom: 20 }}>நிலை கண்ணோட்டம்</h2>

            <div className="rx-stat-grid">
              <div className="rx-stat-card">
                <span className="rx-stat-icon">
                  <FontAwesomeIcon icon={faHourglassHalf} style={{ width: 18, height: 18 }} />
                </span>
                <span className="rx-stat-num">{counts.pending}</span>
                <span className="rx-stat-label">நிலுவையில் உள்ளது</span>
              </div>
              <div className="rx-stat-card">
                <span className="rx-stat-icon">
                  <FontAwesomeIcon icon={faFileCircleCheck} style={{ width: 18, height: 18 }} />
                </span>
                <span className="rx-stat-num">{counts.approved}</span>
                <span className="rx-stat-label">அங்கீகரிக்கப்பட்டது</span>
              </div>
              <div className="rx-stat-card">
                <span className="rx-stat-icon">
                  <FontAwesomeIcon icon={faFileCircleXmark} style={{ width: 18, height: 18 }} />
                </span>
                <span className="rx-stat-num">{counts.rejected}</span>
                <span className="rx-stat-label">நிராகரிக்கப்பட்டது</span>
              </div>
            </div>

            <div className="rx-shield-note">
              <FontAwesomeIcon icon={faShieldHalved} style={{ width: 18, height: 18 }} />
              <p>
                🛡️ மருந்துச் சீட்டு மதிப்பாய்வு ஒரு பாதுகாப்பு பணியாளராய் ஆகும். எந்த
                மருந்தையும் பயன்படுத்துவதற்கு முன் எப்போதும் தகுதியான மருத்துவர் அல்லது மருந்தூர அனுமவம்.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {items.length === 0 ? (
                <p className="rx-empty-text">இதுவரை மருந்துச் சீட்டு பதிவேற்றங்கள் இல்லை.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="rx-prescription-item">
                    <div>
                      <p className="rx-prescription-name">{item.fileName}</p>
                      <p className="rx-prescription-date">
                        {new Date(item.createdAt).toLocaleString('ta-IN')}
                      </p>
                    </div>
                    <span
                      className={`rx-status-badge ${
                        item.status === 'rejected' ? 'rx-status-rejected'
                        : item.status === 'approved' ? 'rx-status-approved'
                        : 'rx-status-pending'
                      }`}
                    >
                      {item.status === 'pending_review' ? 'நிலுவை'
                       : item.status === 'approved' ? 'அங்கீகரிக்கப்பட்டது'
                       : 'நிராகரிக்கப்பட்டது'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{
        background: '#F0EAD6', borderTop: `1px solid ${S.cardBorder}`,
        padding: '36px 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 40, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, overflow: 'hidden',
                background: 'linear-gradient(135deg, #3D7A55, #C9922A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '1.2rem',
              }}>🌿</div>
              <div>
                <p style={{ margin: 0, fontFamily: "'Mukta Malar', sans-serif", fontWeight: 700, color: '#1C2E22', fontSize: '1rem' }}>வைத்தியம்</p>
                <p style={{ margin: 0, fontSize: '0.62rem', color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>PREMIUM MEDICAL-COMMERCE DEMO</p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: S.muted, lineHeight: 1.6, maxWidth: 280 }}>
              Product information is educational only. Vaithiyam does not provide
              diagnosis, dosage advice, or self-medication recommendations.
            </p>
          </div>
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.88rem', fontWeight: 700, color: S.ink }}>Care</h3>
            <div style={{ display: 'grid', gap: 9 }}>
              {['Prescriptions', 'Scanner', 'Help center'].map(l => (
                <a key={l} href="#" style={{ fontSize: '0.82rem', color: S.muted, textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.88rem', fontWeight: 700, color: S.ink }}>Legal</h3>
            <div style={{ display: 'grid', gap: 9 }}>
              {['Privacy', 'Terms', 'Returns'].map(l => (
                <a key={l} href="#" style={{ fontSize: '0.82rem', color: S.muted, textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
}
