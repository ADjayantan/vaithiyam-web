'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLeaf, faLock, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@vaithiyam.local');
  const [password, setPassword] = useState('admin1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'email', identifier: email, password }),
      });
      const data = await res.json().catch(() => ({})) as { token?: string; user?: { role?: string }; message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Login failed.');
      if (data.user?.role !== 'admin') throw new Error('This account is not an admin.');
      localStorage.setItem('vt_token', data.token ?? '');
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vt-admin-shell" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <form onSubmit={submit} className="vt-admin-card" style={{ width: 'min(460px, 100%)', padding: 26, display: 'grid', gap: 16 }}>
        <div className="vt-brand">
          <span className="vt-brand-mark"><FontAwesomeIcon icon={faLeaf} style={{width: 22, height: 22}} /></span>
          <span>
            <span className="vt-brand-title">Vaithiyam Admin</span>
            <span className="vt-brand-subtitle">Protected portal</span>
          </span>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', width: 68, height: 68, borderRadius: 22, background: 'rgba(244,213,129,0.16)', color: 'var(--vt-gold-300)' }}>
          <FontAwesomeIcon icon={faShieldHalved} style={{width: 34, height: 34}} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '2rem' }}>Admin login</h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(236,255,248,0.62)' }}>Use demo admin credentials or configure Supabase role-based auth.</p>
        </div>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ color: 'rgba(236,255,248,0.74)', fontWeight: 800 }}>Email</span>
          <span style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faEnvelope} style={{width: 17, height: 17, ...{ position: 'absolute', left: 13, top: 15, color: 'rgba(236,255,248,0.46)' }}} />
            <input className="vt-input" value={email} onChange={(event) => setEmail(event.target.value)} style={{ paddingLeft: 40, background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.12)' }} />
          </span>
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ color: 'rgba(236,255,248,0.74)', fontWeight: 800 }}>Password</span>
          <span style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faLock} style={{width: 17, height: 17, ...{ position: 'absolute', left: 13, top: 15, color: 'rgba(236,255,248,0.46)' }}} />
            <input className="vt-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ paddingLeft: 40, background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.12)' }} />
          </span>
        </label>
        {error && <p style={{ color: 'var(--vt-coral-600)', margin: 0 }}>{error}</p>}
        <Button type="submit" variant="gold" disabled={loading}>{loading ? 'Signing in...' : 'Enter admin portal'}</Button>
      </form>
    </div>
  );
}
