'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';

// ─── Design Tokens (matches Strich design palette) ─────────────────────────
const T = {
  creamBg:      '#F4EDE4',        // light warm cream sand background
  forestDark:    '#1E472E',        // deep forest green primary
  leafGreen:     '#3D8A5C',        // standard botanical leaf green
  borderGreen:   '#A4BAAD',        // soft light border green
  textDark:      '#102A1A',        // dark forest ink text
  textMuted:     '#6B7A70',        // muted gray-green
  errorRed:      '#C43E2C',        // warm terracotta red
  successGreen:  '#2C7A4F',        // success dark green
};

const FONT = {
  display: 'var(--vt-font-display)',
  body:    'var(--vt-font-body)',
};

export default function AdminRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Focus States
  const [focusedField, setFocusedField] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('அனைத்து தகவல்களும் தேவை.');
      return;
    }

    if (password !== confirmPassword) {
      setError('கடவுச்சொற்கள் பொருந்தவில்லை.');
      return;
    }

    if (password.length < 6) {
      setError('கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json().catch(() => ({})) as { message?: string };

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccess('கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! உள்நுழையவும்...');
      setTimeout(() => {
        router.push('/admin/login');
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'பதிவு தோல்வியடைந்தது.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (fieldName: string) => ({
    width: '100%',
    padding: '12px 14px',
    border: 'none',
    borderBottom: `1.5px solid ${focusedField === fieldName ? T.forestDark : T.borderGreen}`,
    background: 'transparent',
    outline: 'none',
    fontFamily: FONT.body,
    fontSize: '0.96rem',
    color: T.textDark,
    transition: 'border-color 0.2s, box-shadow 0.2s',
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
            இயற்கை நல மருத்துவமனை
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
              Join Us
            </span>
          </div>
        </div>

        {/* Form Container */}
        <form
          onSubmit={submit}
          style={{
            display: 'grid',
            gap: 16,
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

          {success && (
            <div
              style={{
                background: 'rgba(44,122,79,0.08)',
                border: `1px solid ${T.successGreen}40`,
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: '0.85rem',
                color: T.successGreen,
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              ✓ {success}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" style={labelStyle}>Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="Full Name"
              value={fullName}
              disabled={loading}
              onChange={(e) => setFullName(e.target.value)}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField('')}
              style={inputStyle('fullName')}
              required
            />
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="reg-email" style={labelStyle}>Email Address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="Email Address"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              style={inputStyle('email')}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-pass" style={labelStyle}>Password</label>
            <input
              id="reg-pass"
              type="password"
              placeholder="Password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              style={inputStyle('password')}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm" style={labelStyle}>Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              disabled={loading}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField('')}
              style={inputStyle('confirm')}
              required
            />
          </div>

          {/* Create Account Button */}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Login Link */}
          <div style={{ marginTop: 14 }}>
            <Link
              href="/admin/login"
              style={{
                fontFamily: FONT.body,
                fontSize: '0.88rem',
                color: T.textDark,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Already have an account? <span style={{ textDecoration: 'underline', color: T.leafGreen }}>Log In</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
