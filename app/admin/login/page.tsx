'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLeaf, faLock } from '@fortawesome/free-solid-svg-icons';

const T = {
  bgDark:        '#030C07',        // dark luxury green-black background
  panelDark:     '#0D1A10',        // slightly lighter green panel
  gold:          '#c9a84c',        // gold accent/button
  borderGold:    'rgba(201, 168, 76, 0.25)',
  textCream:     '#f5f0e8',        // cream text
  textMuted:     'rgba(245, 240, 232, 0.45)',
  errorRed:      '#dc5050',
};

const FONT = {
  display: 'var(--vt-font-display)',
  body:    'var(--vt-font-body)',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      setError('தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (fieldName: string) => ({
    width: '100%',
    padding: '12px 14px 12px 36px',
    border: 'none',
    borderBottom: `1.5px solid ${focusedField === fieldName ? T.gold : T.borderGold}`,
    background: 'transparent',
    outline: 'none',
    fontFamily: FONT.body,
    fontSize: '0.96rem',
    color: T.textCream,
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
        background: T.bgDark,
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
              color: T.gold,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            இயற்கை நல மருத்துவமனை
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.textCream, marginTop: 12 }}>
            <span style={{ color: T.gold, display: 'inline-flex' }}>
              <FontAwesomeIcon icon={faLeaf} style={{ width: 32, height: 32 }} />
            </span>
            <span
              style={{
                fontFamily: FONT.display,
                fontSize: '2rem',
                fontWeight: 700,
                color: T.textCream,
              }}
            >
              நிர்வாகி உள்நுழைவு
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontFamily: FONT.body, fontSize: '0.86rem', color: T.textMuted }}>
            இயற்கை நல மருத்துவமனை Admin Dashboard Portal
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={submit}
          style={{
            display: 'grid',
            gap: 18,
            marginTop: 10,
            backgroundColor: T.panelDark,
            padding: 32,
            borderRadius: 20,
            border: '1px solid rgba(201, 168, 76, 0.15)',
          }}
        >
          {error && (
            <div
              style={{
                background: 'rgba(220,80,80,0.08)',
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
            <label htmlFor="login-email" style={labelStyle}>மின்னஞ்சல் முகவரி / Email Address</label>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faEnvelope}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 15,
                  width: 16,
                  height: 16,
                  color: focusedField === 'email' ? T.gold : T.textMuted,
                  transition: 'color 0.2s',
                }}
              />
              <input
                id="login-email"
                type="email"
                placeholder="admin@iyarkainalam.com"
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
            <label htmlFor="login-pass" style={labelStyle}>கடவுச்சொல் / Password</label>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 15,
                  width: 16,
                  height: 16,
                  color: focusedField === 'password' ? T.gold : T.textMuted,
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
              background: T.gold,
              color: '#030C07',
              border: 'none',
              borderRadius: 8,
              padding: '14px 24px',
              fontFamily: FONT.body,
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(201,168,76,0.25)',
              transition: 'background 0.2s, transform 0.1s',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? 'உள்நுழைகிறது...' : 'உள்நுழை'}
          </button>
        </form>
      </div>
    </div>
  );
}
