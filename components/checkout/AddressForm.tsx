'use client';
import { useState, useEffect } from 'react';

function getToken(): string | null {
  try { return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token'); } catch { return null; }
}
function authHeaders(): HeadersInit {
  const tok = getToken();
  return tok ? { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` } : { 'Content-Type': 'application/json' };
}

interface Address { id: string; label: string; line1: string; line2?: string; city: string; state: string; pincode: string; isDefault: boolean }

interface Props {
  mode:       'add' | 'edit';
  addressId?: string;
  onSave:     () => void;
  onCancel:   () => void;
}

export default function AddressForm({ mode, addressId, onSave, onCancel }: Props) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form, setForm] = useState({
    label: '', line1: '', line2: '', city: '', state: 'Tamil Nadu', pincode: '', isDefault: false,
  });

  useEffect(() => {
    if (mode === 'edit' && addressId) {
      fetch('/api/addresses', { headers: authHeaders() })
        .then(r => r.json())
        .then((addrs: Address[]) => {
          const a = addrs.find((x) => x.id === addressId);
          if (a) setForm({ label: a.label, line1: a.line1, line2: a.line2 ?? '', city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault ?? false });
        });
    }
  }, [mode, addressId]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSubmit = async () => {
    if (!form.label || !form.line1 || !form.city || !form.pincode) {
      setError('தேவையான தகவல்களை நிரப்பவும்.'); return;
    }
    setSaving(true); setError('');
    try {
      const url    = mode === 'edit' && addressId ? `/api/addresses/${addressId}` : '/api/addresses';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'சேமிக்க தோல்வி.');
    } finally { setSaving(false); }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label style={{ fontFamily: 'var(--vt-font-display)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--vt-ink-80)', display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );

  return (
    <div className="vt-card" style={{ padding: 20, boxShadow: 'var(--vt-shadow-sm)' }}>
      <h3 style={{ fontFamily: 'var(--vt-font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--vt-cream-50)', margin: '0 0 18px' }}>
        {mode === 'add' ? '➕ புதிய முகவரி' : '✏️ முகவரி திருத்து'}
      </h3>

      {error && (
        <p role="alert" style={{
          background: 'rgba(212,58,30,0.08)',
          border: '1px solid rgba(212,58,30,0.22)',
          borderRadius: 10,
          padding: '10px 14px',
          color: 'var(--vt-danger-text)',
          fontSize: '0.82rem',
          marginBottom: 14,
          margin: 0
        }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Label>லேபிள் (வீடு, அலுவலகம்…)</Label>
          <input className="vt-input" value={form.label} onChange={set('label')} placeholder="வீடு" style={{ height: 42 }} />
        </div>
        <div>
          <Label>முகவரி வரி 1 *</Label>
          <input className="vt-input" value={form.line1} onChange={set('line1')} placeholder="தெரு, கட்டிட எண்" style={{ height: 42 }} />
        </div>
        <div>
          <Label>முகவரி வரி 2</Label>
          <input className="vt-input" value={form.line2} onChange={set('line2')} placeholder="அடுக்குமாடி, அருகில்" style={{ height: 42 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <Label>நகரம் *</Label>
            <input className="vt-input" value={form.city} onChange={set('city')} placeholder="கோயம்புத்தூர்" style={{ height: 42 }} />
          </div>
          <div>
            <Label>அஞ்சல் குறியீடு *</Label>
            <input className="vt-input" value={form.pincode} onChange={set('pincode')} placeholder="641001" maxLength={6} style={{ height: 42 }} />
          </div>
        </div>
        <div>
          <Label>மாநிலம்</Label>
          <select className="vt-select" value={form.state} onChange={set('state')} style={{ height: 42 }}>
            {['Tamil Nadu','Karnataka','Kerala','Andhra Pradesh','Telangana','Maharashtra','Delhi','Goa','Gujarat','Rajasthan','Other'].map(s => <option key={s} style={{ background: '#0D2218', color: '#F5EDD6' }}>{s}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--vt-muted)', userSelect: 'none' }}>
          <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} />
          இதை இயல்புநிலை முகவரியாக அமை
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button onClick={onCancel} disabled={saving} className="vt-button vt-button-ghost" style={{ flex: 1 }}>
          ரத்து
        </button>
        <button onClick={handleSubmit} disabled={saving} className="vt-button vt-button-primary" style={{ flex: 2 }}>
          {saving ? 'சேமிக்கிறது…' : mode === 'add' ? 'முகவரி சேர்க்கவும்' : 'மாற்றங்களை சேமி'}
        </button>
      </div>
    </div>
  );
}
