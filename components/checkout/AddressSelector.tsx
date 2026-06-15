'use client';
import { useState, useEffect }  from 'react';
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome';
import { faLocationDot }        from '@fortawesome/free-solid-svg-icons';

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
    <div className="vt-card" style={{ padding: 24, display: 'grid', gap: 14 }}>
      <div style={{ height: 80, borderRadius: 'var(--vt-radius-sm)', background: 'rgba(61,138,92,0.1)', animation: 'vt-as-pulse 1.4s ease-in-out infinite' }} />
      <style>{`@keyframes vt-as-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  );

  return (
    <div className="vt-card" style={{ padding: 20, boxShadow: 'var(--vt-shadow-sm)', display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--vt-font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--vt-cream-50)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faLocationDot} style={{ width: 16, height: 16, color: 'var(--vt-gold-400)' }} /> டெலிவரி முகவரி
        </h2>
        <button onClick={onAddNew} disabled={disabled} className="vt-button vt-button-ghost" style={{
          padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
        }}>
          + புதிய முகவரி
        </button>
      </div>

      {error && <p style={{ color: 'var(--vt-danger-text)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      {addresses.length === 0 && !error && (
        <p style={{ fontSize: '0.88rem', color: 'var(--vt-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
          முகவரி எதுவும் சேர்க்கப்படவில்லை
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {addresses.map(addr => {
          const sel = addr.id === selectedAddressId;
          return (
            <div key={addr.id} onClick={() => !disabled && onSelect(addr.id)} style={{
              borderRadius: 'var(--vt-radius-sm)',
              border: `2px solid ${sel ? 'var(--vt-emerald-600)' : 'var(--vt-border)'}`,
              padding: '12px 14px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: sel ? 'rgba(61,138,92,0.08)' : 'rgba(13,34,24,0.30)',
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${sel ? 'var(--vt-emerald-600)' : 'var(--vt-border)'}`,
                  background: sel ? 'var(--vt-emerald-600)' : 'transparent',
                  flexShrink: 0,
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--vt-font-display)', fontSize: '0.92rem', fontWeight: 700, color: 'var(--vt-cream-50)', margin: '0 0 4px', lineHeight: 1.2 }}>
                    {addr.label} {addr.isDefault && <span style={{ fontSize: '0.75rem', color: 'var(--vt-emerald-500)', fontWeight: 500 }}>(இயல்பு)</span>}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--vt-muted)', margin: 0, lineHeight: 1.45 }}>
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city} — {addr.pincode}
                  </p>
                </div>
                <button onClick={e => { e.stopPropagation(); onEdit(addr.id); }} disabled={disabled} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vt-gold-400)',
                  fontFamily: 'var(--vt-font-display)', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
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
