'use client';
import { useState, useEffect }  from 'react';
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome';
import { faLocationDot }        from '@fortawesome/free-solid-svg-icons';

const T = {
  forestPrimary: '#1A3A2A', leaf: '#3D7A55', gold: '#C9922A', goldPale: '#F0C96E',
  creamBase: '#F5EFE0', creamAlt: '#EDE3CE', darkText: '#1C1410',
  secondaryText: '#5C4A30', muted: '#9C8060', border: '#DDD0B8', saffron: '#E07B39',
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
  selectedAddressId: string | null;
  onSelect:  (id: string) => void;
  onAddNew:  () => void;
  onEdit:    (id: string) => void;
  disabled?: boolean;
}

export default function AddressSelector({ selectedAddressId, onSelect, onAddNew, onEdit, disabled }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/addresses', { headers: authHeaders() })
      .then(r => r.json())
      .then((data: Address[]) => { setAddresses(data); setLoading(false); })
      .catch(() => { setError('முகவரிகள் ஏற்ற தோல்வி.'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: `1px solid ${T.border}` }}>
      <div style={{ height: 80, borderRadius: 12, background: T.creamAlt, animation: 'vt-as-pulse 1.4s ease-in-out infinite' }} />
      <style>{`@keyframes vt-as-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(26,58,42,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: FONT.display, fontSize: '1rem', fontWeight: 700, color: T.darkText, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
          <FontAwesomeIcon icon={faLocationDot} style={{ width: 15, height: 15, color: T.saffron }} /> டெலிவரி முகவரி
        </h2>
        <button onClick={onAddNew} disabled={disabled} style={{
          padding: '6px 14px', borderRadius: 100, border: `1px solid ${T.leaf}`,
          background: 'rgba(61,122,85,0.06)', color: T.leaf, cursor: 'pointer',
          fontFamily: FONT.display, fontSize: '0.78rem', fontWeight: 700,
        }}>
          + புதிய முகவரி
        </button>
      </div>

      {error && <p style={{ color: T.saffron, fontFamily: FONT.body, fontSize: '0.85rem' }}>{error}</p>}

      {addresses.length === 0 && !error && (
        <p style={{ fontFamily: FONT.body, fontSize: '0.88rem', color: T.muted, textAlign: 'center', padding: '20px 0' }}>
          முகவரி எதுவும் சேர்க்கப்படவில்லை
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {addresses.map(addr => {
          const sel = addr.id === selectedAddressId;
          return (
            <div key={addr.id} onClick={() => !disabled && onSelect(addr.id)} style={{
              borderRadius: 14, border: `2px solid ${sel ? T.forestPrimary : T.border}`,
              padding: '12px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
              background: sel ? 'rgba(26,58,42,0.04)' : '#fff', transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sel ? T.forestPrimary : T.border}`,
                  background: sel ? T.forestPrimary : '#fff', flexShrink: 0, marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT.display, fontSize: '0.88rem', fontWeight: 700, color: T.darkText, margin: '0 0 2px' }}>
                    {addr.label} {addr.isDefault && <span style={{ fontSize: '0.7rem', color: T.leaf }}>(இயல்பு)</span>}
                  </p>
                  <p style={{ fontFamily: FONT.body, fontSize: '0.8rem', color: T.secondaryText, margin: 0, lineHeight: 1.4 }}>
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city} — {addr.pincode}
                  </p>
                </div>
                <button onClick={e => { e.stopPropagation(); onEdit(addr.id); }} disabled={disabled} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: T.gold,
                  fontFamily: FONT.display, fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                }}>
                  திருத்து
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
