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

/* ─── Design tokens (Antigravity Dark theme overrides) ─────── */
const S = {
  bg:          'var(--vt-void)',
  cardBg:      'var(--vt-card)',
  cardBorder:  'var(--vt-border)',
  teal:        'var(--vt-forest-800)',
  tealLight:   'var(--vt-forest-600)',
  gold:        'var(--vt-gold-500)',
  ink:         'var(--vt-ink)',
  muted:       'var(--vt-muted)',
  mutedLight:  'var(--vt-muted)',
  border:      'var(--vt-border)',
  statBg:      'rgba(255, 255, 255, 0.04)',
  statBorder:  'var(--vt-border)',
  uploadBg:    'rgba(255, 255, 255, 0.02)',
  uploadBorder:'var(--vt-border)',
  shieldBg:    'var(--vt-success-bg)',
  shieldBorder:'var(--vt-border-strong)',
  shieldText:  'var(--vt-success-text)',
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
      // 1. Upload file binary
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadRes.json().catch(() => ({})) as { fileUrl?: string; message?: string };
      if (!uploadRes.ok) {
        throw new Error(uploadData.message ?? 'கோப்பை பதிவேற்ற முடியவில்லை.');
      }

      if (!uploadData.fileUrl) {
        throw new Error('கோப்பு பதிவேற்ற முகவரி கிடைக்கவில்லை.');
      }

      // 2. Create prescription metadata with fileUrl
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'unknown',
          fileUrl: uploadData.fileUrl,
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
    <div style={{ minHeight: '100dvh', background: S.bg, display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>
      <CustomerHeader />

      <style>{`
        .rx-main {
          flex: 1; max-width: 1100px; width: 100%; margin: 0 auto;
          padding: 36px 24px 60px;
        }
        .rx-page-title {
          font-family: var(--vt-font-display); font-size: clamp(1.6rem, 3.5vw, 2.2rem);
          font-weight: 700; color: ${S.ink}; margin: 0 0 28px; line-height: 1.2;
        }
        .rx-grid {
          display: grid; gap: 20px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .rx-card {
          background: ${S.cardBg}; border: 1px solid ${S.cardBorder};
          border-radius: 16px; padding: 24px;
          box-shadow: var(--vt-shadow-sm);
        }
        .rx-card-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px;
        }
        .rx-card-header-icon { color: var(--vt-forest-600); font-size: 1.1rem; }
        .rx-card-title {
          font-family: var(--vt-font-display); font-size: 1.05rem;
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
          border-color: var(--vt-forest-600); background: rgba(61,122,85,0.04);
        }
        .rx-upload-hourglass { color: var(--vt-gold-500); margin-bottom: 4px; }
        .rx-upload-title {
          font-family: var(--vt-font-display); font-weight: 700;
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
          font-family: var(--vt-font-body); font-size: 0.88rem;
          color: ${S.ink}; resize: vertical; min-height: 80px;
          outline: none; transition: border-color 0.15s;
        }
        .rx-notes:focus { border-color: var(--vt-forest-600); }
        .rx-notes::placeholder { color: ${S.muted}; }

        /* Submit button */
        .rx-submit-btn {
          width: 100%; padding: 14px 20px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, var(--vt-forest-700) 0%, var(--vt-forest-600) 100%);
          color: white; font-family: var(--vt-font-display);
          font-size: 0.95rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .rx-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--vt-shadow-soft); }
        .rx-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Status stat cards */
        .rx-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .rx-stat-card {
          background: ${S.statBg}; border: 1px solid ${S.statBorder};
          border-radius: 10px; padding: 14px 12px;
          display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
        }
        .rx-stat-icon { font-size: 1rem; color: var(--vt-forest-600); }
        .rx-stat-num {
          font-family: var(--vt-font-display); font-size: 1.6rem;
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
        .rx-status-pending  { background: var(--vt-warn-bg); color: var(--vt-warn-text); border: 1px solid var(--vt-border-strong); }
        .rx-status-approved { background: var(--vt-success-bg);  color: var(--vt-success-text); border: 1px solid var(--vt-border-strong); }
        .rx-status-rejected { background: var(--vt-danger-bg);  color: var(--vt-danger-text); border: 1px solid var(--vt-border-strong); }

        .rx-empty-text { font-size: 0.84rem; color: ${S.muted}; margin: 0; }
        .rx-status-msg { font-size: 0.82rem; color: var(--vt-success-text); margin: 0; }

        @media (max-width: 680px) {
          .rx-main { padding: 24px 16px 80px; }
        }
      `}</style>

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

      <CustomerFooter />
      <MobileBottomNav />
    </div>
  );
}
