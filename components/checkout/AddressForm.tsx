'use client';
import { useState, useEffect } from 'react';

const T = {
  forestPrimary: '#1A3A2A', leaf: '#3D7A55', gold: '#C9922A',
  creamBase: '#F5EFE0', creamAlt: '#EDE3CE', darkText: '#1C1410',
  secondaryText: '#5C4A30', muted: '#9C8060', border: '#DDD0B8',
  saffron: '#E07B39', terracotta: '#8B3A2F',
} as const;
const FONT = { display: "'Mukta Malar', sans-serif", body: "'Hind Madurai', sans-serif" } as const;

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

const INPUT_STYLE = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  border: `1.5px solid ${T.border}`, fontFamily: FONT.body, fontSize: '0.88rem',
  color: T.darkText, background: '#fff', outline: 'none',
};

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
    <label style={{ fontFamily: FONT.display, fontSize: '0.8rem', fontWeight: 600, color: T.secondaryText, display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(26,58,42,0.07)' }}>
      <h3 style={{ fontFamily: FONT.display, fontSize: '1rem', fontWeight: 700, color: T.darkText, margin: '0 0 18px' }}>
        {mode === 'add' ? '➕ புதிய முகவரி' : '✏️ முகவரி திருத்து'}
      </h3>

      {error && <p style={{ background: 'rgba(139,58,47,0.06)', border: `1px solid rgba(139,58,47,0.2)`, borderRadius: 10, padding: '10px 14px', color: T.terracotta, fontFamily: FONT.body, fontSize: '0.82rem', marginBottom: 14 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div><Label>லேபிள் (வீடு, அலுவலகம்…)</Label><input value={form.label} onChange={set('label')} placeholder="வீடு" style={INPUT_STYLE} /></div>
        <div><Label>முகவரி வரி 1 *</Label><input value={form.line1} onChange={set('line1')} placeholder="தெரு, கட்டிட எண்" style={INPUT_STYLE} /></div>
        <div><Label>முகவரி வரி 2</Label><input value={form.line2} onChange={set('line2')} placeholder="அடுக்குமாடி, அருகில்" style={INPUT_STYLE} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><Label>நகரம் *</Label><input value={form.city} onChange={set('city')} placeholder="கோயம்புத்தூர்" style={INPUT_STYLE} /></div>
          <div><Label>அஞ்சல் குறியீடு *</Label><input value={form.pincode} onChange={set('pincode')} placeholder="641001" maxLength={6} style={INPUT_STYLE} /></div>
        </div>
        <div>
          <Label>மாநிலம்</Label>
          <select value={form.state} onChange={set('state')} style={{ ...INPUT_STYLE }}>
            {['Tamil Nadu','Karnataka','Kerala','Andhra Pradesh','Telangana','Maharashtra','Delhi','Goa','Gujarat','Rajasthan','Other'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: FONT.body, fontSize: '0.85rem', color: T.secondaryText }}>
          <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} />
          இதை இயல்புநிலை முகவரியாக அமை
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button onClick={onCancel} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 100, border: `1.5px solid ${T.border}`, background: '#fff', cursor: 'pointer', fontFamily: FONT.display, fontSize: '0.88rem', fontWeight: 600, color: T.muted }}>
          ரத்து
        </button>
        <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 100, border: 'none', background: `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT.display, fontSize: '0.88rem', fontWeight: 700, color: '#fff', boxShadow: '0 3px 12px rgba(26,58,42,0.25)' }}>
          {saving ? 'சேமிக்கிறது…' : mode === 'add' ? 'முகவரி சேர்க்கவும்' : 'மாற்றங்களை சேமி'}
        </button>
      </div>
    </div>
  );
}
