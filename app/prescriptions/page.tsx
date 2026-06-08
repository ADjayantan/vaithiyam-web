'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCircleCheck, faFileCircleXmark, faHourglassHalf, faShieldHalved, faUpload } from '@fortawesome/free-solid-svg-icons';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';
import { Button } from '@/components/ui/Button';

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
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

export default function PrescriptionsPage() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/prescriptions', { headers: authHeaders(), cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((data: { prescriptions?: Prescription[] } | null) => setItems(data?.prescriptions ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    if (!file) {
      setStatus('Choose an image or PDF first.');
      return;
    }
    const token = getToken();
    if (!token) {
      setStatus('Please login before uploading prescriptions.');
      return;
    }
    setLoading(true);
    setStatus('');
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
      if (!res.ok) throw new Error(data.message ?? 'Upload metadata could not be saved.');
      setStatus('Prescription saved as pending review.');
      setFile(null);
      setNotes('');
      load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload metadata could not be saved.');
    } finally {
      setLoading(false);
    }
  }, [file, load, notes]);

  const counts = useMemo(() => ({
    pending: items.filter((item) => item.status === 'pending_review').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
  }), [items]);

  return (
    <div className="vt-page-shell">
      <CustomerHeader />
      <main className="vt-container" style={{ padding: '34px 0 0' }}>
        <section className="vt-hero" style={{ borderRadius: 'var(--vt-radius-lg)', padding: 28 }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1>Prescription desk</h1>
            <p className="vt-hero-copy">Upload prescription metadata for pharmacist/admin review. This demo does not diagnose, approve medicine use automatically, or provide dosage advice.</p>
          </div>
        </section>

        <section className="vt-section" style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="vt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
              <FontAwesomeIcon icon={faUpload} style={{width: 20, height: 20, color: "var(--vt-emerald-600)"}} />
              <div>
                <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)' }}>Upload prescription</h2>
                <p className="vt-muted" style={{ margin: '4px 0 0' }}>Images and PDFs are represented by local metadata in this demo.</p>
              </div>
            </div>
            <label className="vt-card vt-card-solid" style={{ display: 'grid', placeItems: 'center', gap: 10, padding: 26, cursor: 'pointer', textAlign: 'center' }}>
              <FontAwesomeIcon icon={faHourglassHalf} style={{width: 34, height: 34, color: "var(--vt-gold-500)"}} />
              <strong>{file?.name ?? 'Choose image or PDF'}</strong>
              <span className="vt-muted">Status starts as pending review.</span>
              <input type="file" accept="image/*,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} style={{ display: 'none' }} />
            </label>
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Prescription preview" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 18, border: '1px solid var(--vt-border)', background: '#fff' }} />
            )}
            <textarea className="vt-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes for verification team" />
            <Button type="button" disabled={loading} onClick={() => void submit()}>
              {loading ? 'Saving...' : 'Save pending review'}
            </Button>
            {status && <p className="vt-muted" style={{ margin: 0 }}>{status}</p>}
          </div>

          <div className="vt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)' }}>Status overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <StatusCard icon={<FontAwesomeIcon icon={faHourglassHalf} style={{width: 20, height: 20}} />} label="Pending" value={counts.pending} />
              <StatusCard icon={<FontAwesomeIcon icon={faFileCircleCheck} style={{width: 20, height: 20}} />} label="Approved" value={counts.approved} />
              <StatusCard icon={<FontAwesomeIcon icon={faFileCircleXmark} style={{width: 20, height: 20}} />} label="Rejected" value={counts.rejected} />
            </div>
            <div className="vt-safe-note">
              <FontAwesomeIcon icon={faShieldHalved} style={{width: 20, height: 20}} />
              <span>Prescription review is a safety workflow. Always consult a qualified doctor or pharmacist before using any medicine.</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {items.length === 0 ? (
                <p className="vt-muted">No prescription uploads yet.</p>
              ) : items.map((item) => (
                <article key={item.id} className="vt-card vt-card-solid" style={{ padding: 14, boxShadow: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong>{item.fileName}</strong>
                    <span className={`vt-badge ${item.status === 'rejected' ? 'vt-badge-danger' : item.status === 'approved' ? 'vt-badge-cyan' : 'vt-badge-gold'}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="vt-muted" style={{ margin: '6px 0 0' }}>{new Date(item.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <CustomerFooter />
      <MobileBottomNav />
    </div>
  );
}

function StatusCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="vt-card vt-card-solid" style={{ padding: 14, boxShadow: 'none' }}>
      <span style={{ color: 'var(--vt-emerald-600)' }}>{icon}</span>
      <strong style={{ display: 'block', marginTop: 8, fontSize: '1.45rem' }}>{value}</strong>
      <span className="vt-muted">{label}</span>
    </div>
  );
}
