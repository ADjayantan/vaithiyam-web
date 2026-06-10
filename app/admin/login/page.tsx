'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLeaf, faLock } from '@fortawesome/free-solid-svg-icons';

// ─── Design Tokens (matches register palette) ──────────────────────────────
const T = {
  creamBg:      '#F4EDE4',        // light warm cream sand background
  forestDark:    '#1E472E',        // deep forest green primary
  leafGreen:     '#3D8A5C',        // standard botanical leaf green
  borderGreen:   '#A4BAAD',        // soft light border green
  textDark:      '#102A1A',        // dark forest ink text
  textMuted:     '#6B7A70',        // muted gray-green
  errorRed:      '#C43E2C',        // warm terracotta red
};

const FONT = {
  display: 'var(--vt-font-display)',
  body:    'var(--vt-font-body)',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@vaithiyam.local');
  const [password, setPassword] = useState('admin1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Focus States
  const [focusedField, setFocusedField] = useState('');

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
      if (data.user?.role !== 'admin') throw new Error('உங்களுக்கு இந்த பக்கத்தை அணுக அனுமதி இல்லை.');
      
      localStorage.setItem('vt_token', data.token ?? '');
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'உள்நுழைவு தோல்வி.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (fieldName: string) => ({
    width: '100%',
    padding: '12px 14px 12px 36px', // left padding leaves space for icon
    border: 'none',
    borderBottom: `1.5px solid ${focusedField === fieldName ? T.forestDark : T.borderGreen}`,
    background: 'transparent',
    outline: 'none',
    fontFamily: FONT.body,
    fontSize: '0.96rem',
    color: T.textDark,
    transition: 'border-color 0.2s',
  });

  const labelStyle = {
    fontFamily: FONT.body,
    fontSize: '0.8rem',
    fontWeight: 600,
    color: T.textMuted,
    textAlign: 'left' as const,
    display: 'block',
    marginTop: 8,
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: T.creamBg,
        display: 'grid',
        placeItems: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: 'min(420px, 100%)', textAlign: 'center' }}>
        {/* Logo & Header */}
        <div style={{ display: 'grid', gap: 6, placeItems: 'center', marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: FONT.display,
              fontSize: '2.5rem',
              fontWeight: 700,
              color: T.forestDark,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Vaithiyam
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.textDark, marginTop: 12 }}>
            <span style={{ color: T.leafGreen, display: 'inline-flex' }}>
              <FontAwesomeIcon icon={faLeaf} style={{ width: 32, height: 32 }} />
            </span>
            <span
              style={{
                fontFamily: FONT.display,
                fontSize: '2rem',
                fontWeight: 700,
                color: T.textDark,
              }}
            >
              Admin Portal
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontFamily: FONT.body, fontSize: '0.86rem', color: T.textMuted }}>
            நிர்வாகி உள்நுழைவு பக்கம்
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={submit}
          style={{
            display: 'grid',
            gap: 18,
            marginTop: 10,
          }}
        >
          {error && (
            <div
              style={{
                background: 'rgba(196,62,44,0.08)',
                border: `1px solid ${T.errorRed}40`,
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: '0.85rem',
                color: T.errorRed,
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="login-email" style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faEnvelope}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 15,
                  width: 16,
                  height: 16,
                  color: focusedField === 'email' ? T.forestDark : T.textMuted,
                  transition: 'color 0.2s',
                }}
              />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                style={inputStyle('email')}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-pass" style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 15,
                  width: 16,
                  height: 16,
                  color: focusedField === 'password' ? T.forestDark : T.textMuted,
                  transition: 'color 0.2s',
                }}
              />
              <input
                id="login-pass"
                type="password"
                placeholder="••••••••"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                style={inputStyle('password')}
                required
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 12,
              background: T.forestDark,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '14px 24px',
              fontFamily: FONT.display,
              fontSize: '1.15rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(30,71,46,0.25)',
              transition: 'background 0.2s, transform 0.1s',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Register Link */}
          <div style={{ marginTop: 14 }}>
            <Link
              href="/admin/register"
              style={{
                fontFamily: FONT.body,
                fontSize: '0.88rem',
                color: T.textDark,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Don't have an account? <span style={{ textDecoration: 'underline', color: T.leafGreen }}>Create one</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
