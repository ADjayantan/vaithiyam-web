'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCircleCheck, faKey, faLeaf,
  faMobileScreen, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

type Step = 'request' | 'otp' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep]           = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  /* OTP box refs for auto-advance */
  const handleOtpChange = (i: number, val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = cleaned;
    setOtp(next);
    if (cleaned && i < 5) {
      (document.getElementById(`otp-${i + 1}`) as HTMLInputElement | null)?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      (document.getElementById(`otp-${i - 1}`) as HTMLInputElement | null)?.focus();
    }
  };

  const startCooldown = () => {
    setResendCooldown(30);
    const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  /* Step 1: request OTP */
  const requestOtp = useCallback(async () => {
    if (!identifier.trim()) { setError('Enter your mobile number or email.'); return; }
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'request', identifier }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep('otp');
        startCooldown();
      } else {
        setError(data.message || 'Failed to request OTP.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [identifier]);

  /* Step 2: verify OTP */
  const verifyOtp = useCallback(async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the 6-digit OTP.'); return; }
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'verify', identifier, otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep('reset');
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [otp, identifier]);

  /* Step 3: set new password */
  const setNewPassword = useCallback(async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError(''); setBusy(true);
    try {
      const code = otp.join('');
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'reset', identifier, otp: code, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep('done');
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [password, confirm, identifier, otp]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--vt-void)', display: 'grid', gridTemplateRows: 'auto 1fr' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        style={{
          position:   'sticky',
          top:        0,
          zIndex:     200,
          background: 'rgba(3, 12, 7, 0.75)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(61,138,92,0.14)',
          boxShadow:  '0 2px 16px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            href="/auth/login"
            style={{ display: 'grid', width: 36, height: 36, placeItems: 'center', borderRadius: 10, border: '1px solid rgba(240,201,110,0.28)', color: 'var(--vt-gold-300)', flexShrink: 0 }}
            aria-label="Back to login"
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ width: 14 }} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'grid', width: 36, height: 36, placeItems: 'center', borderRadius: '50%', background: 'rgba(240,201,110,0.10)', border: '1px solid rgba(240,201,110,0.20)', color: '#3D8A5C', flexShrink: 0 }}>
              <FontAwesomeIcon icon={faLeaf} style={{ width: 18 }} />
            </span>
            <div>
              <span style={{ display: 'block', fontFamily: 'var(--vt-font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--vt-gold-300)', lineHeight: 1, letterSpacing: 0 }}>வைத்தியம்</span>
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'rgba(240,201,110,0.55)', letterSpacing: '.06em' }}>SINCE 2024</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--vt-gold-300)', letterSpacing: 0 }}>கடவுச்சொல் மீட்பு</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(240,201,110,0.60)', fontWeight: 600, letterSpacing: '.04em' }}>Password Recovery</p>
          </div>
        </div>
      </header>

      {/* ── Stepper ─────────────────────────────────────────────── */}
      <div style={{ background: 'var(--vt-card)', borderBottom: '1px solid var(--vt-border)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {(['request','otp','reset'] as Step[]).map((s, i) => {
              const labels = ['Identify', 'Verify OTP', 'New Password'];
              const done = ['request','otp','reset','done'].indexOf(step) > i;
              const active = step === s;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'grid', width: 26, height: 26, placeItems: 'center', borderRadius: 999, flexShrink: 0,
                      background: done || active ? 'var(--vt-emerald-600)' : 'var(--vt-border)',
                      color: done || active ? '#fff' : 'var(--vt-muted)',
                      fontSize: '0.72rem', fontWeight: 800,
                    }}>
                      {done ? <FontAwesomeIcon icon={faCircleCheck} style={{ width: 13 }} /> : i + 1}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: active ? 'var(--vt-emerald-600)' : done ? 'var(--vt-forest-700)' : 'var(--vt-muted)', whiteSpace: 'nowrap' }}>
                      {labels[i]}
                    </span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, margin: '0 8px', background: done ? 'var(--vt-emerald-600)' : 'var(--vt-border)', borderRadius: 999 }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main card ───────────────────────────────────────────── */}
      <main style={{ display: 'grid', placeItems: 'start center', padding: '28px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440, background: 'var(--vt-card)', borderRadius: 'var(--vt-radius-lg)', border: '1px solid var(--vt-border)', padding: '28px 24px', display: 'grid', gap: 20 }}>

          {/* ── Step 1: Identify ─────────────────────────────── */}
          {step === 'request' && (
            <>
              <div>
                <div style={{ display: 'grid', width: 52, height: 52, placeItems: 'center', borderRadius: 16, background: 'var(--vt-emerald-100)', color: 'var(--vt-emerald-600)', marginBottom: 14 }}>
                  <FontAwesomeIcon icon={faMobileScreen} style={{ width: 22 }} />
                </div>
                <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--vt-font-display)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--vt-ink)', letterSpacing: 0 }}>உங்கள் கணக்கை உறுதிப்படுத்துங்கள்</h2>
                <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-muted)', lineHeight: 1.6 }}>Enter your registered mobile number or email. We will send a 6-digit OTP.</p>
              </div>
              <label style={{ display: 'grid', gap: 7, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)' }}>
                Mobile number or email
                <input
                  className="vt-input"
                  type="text"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && requestOtp()}
                  placeholder="9876543210 or you@email.com"
                  autoFocus
                  style={{ height: 48 }}
                />
              </label>
              {error && <p role="alert" style={{ margin: 0, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-danger-text)', fontWeight: 600 }}>{error}</p>}
              <button onClick={requestOtp} disabled={busy} className="vt-button"
                style={{ background: 'linear-gradient(135deg,var(--vt-forest-800),var(--vt-forest-700))', color: '#fff', border: 'none', opacity: busy ? 0.65 : 1 }}>
                {busy ? 'Sending OTP…' : 'Send OTP →'}
              </button>
              <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--vt-text-sm)', color: 'var(--vt-muted)' }}>
                Remembered it? <Link href="/auth/login" style={{ color: 'var(--vt-emerald-600)', fontWeight: 700 }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ── Step 2: Verify OTP ───────────────────────────── */}
          {step === 'otp' && (
            <>
              <div>
                <div style={{ display: 'grid', width: 52, height: 52, placeItems: 'center', borderRadius: 16, background: 'var(--vt-gold-100)', color: 'var(--vt-gold-700)', marginBottom: 14 }}>
                  <FontAwesomeIcon icon={faShieldHalved} style={{ width: 22 }} />
                </div>
                <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--vt-font-display)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--vt-ink)', letterSpacing: 0 }}>OTP சரிபார்ப்பு</h2>
                <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-muted)', lineHeight: 1.6 }}>
                  A 6-digit code was sent to <strong style={{ color: 'var(--vt-ink)' }}>{identifier}</strong>.
                </p>
              </div>

              {/* OTP boxes */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 800,
                      border: `2px solid ${d ? 'var(--vt-emerald-600)' : 'var(--vt-border)'}`,
                      borderRadius: 12, outline: 'none', fontFamily: 'var(--vt-font-body)',
                      color: 'var(--vt-ink)', background: d ? 'rgba(13,34,24,0.80)' : 'rgba(13,34,24,0.35)',
                      transition: 'border-color 120ms, background 120ms',
                    }}
                  />
                ))}
              </div>

              {error && <p role="alert" style={{ margin: 0, textAlign: 'center', fontSize: 'var(--vt-text-sm)', color: 'var(--vt-danger-text)', fontWeight: 600 }}>{error}</p>}

              <button onClick={verifyOtp} disabled={busy || otp.join('').length < 6} className="vt-button"
                style={{ background: 'linear-gradient(135deg,var(--vt-forest-800),var(--vt-forest-700))', color: '#fff', border: 'none', opacity: (busy || otp.join('').length < 6) ? 0.65 : 1 }}>
                {busy ? 'Verifying…' : 'Verify OTP →'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--vt-text-sm)' }}>
                <button
                  onClick={() => { setOtp(['','','','','','']); setStep('request'); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vt-muted)', fontFamily: 'var(--vt-font-body)', fontWeight: 600 }}
                >
                  ← Change number
                </button>
                {resendCooldown > 0 ? (
                  <span style={{ color: 'var(--vt-muted)' }}>Resend in {resendCooldown}s</span>
                ) : (
                  <button onClick={() => { requestOtp(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vt-emerald-600)', fontFamily: 'var(--vt-font-body)', fontWeight: 700 }}>
                    Resend OTP
                  </button>
                )}
              </div>

              <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)' }}>
                Demo: any 6-digit code will work.
              </p>
            </>
          )}

          {/* ── Step 3: New password ─────────────────────────── */}
          {step === 'reset' && (
            <>
              <div>
                <div style={{ display: 'grid', width: 52, height: 52, placeItems: 'center', borderRadius: 16, background: 'var(--vt-teal-100)', color: 'var(--vt-teal-600)', marginBottom: 14 }}>
                  <FontAwesomeIcon icon={faKey} style={{ width: 22 }} />
                </div>
                <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--vt-font-display)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--vt-ink)', letterSpacing: 0 }}>புதிய கடவுச்சொல்</h2>
                <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-muted)', lineHeight: 1.6 }}>Choose a strong password. Minimum 8 characters.</p>
              </div>
              {[
                { id: 'pw',  label: 'New password',     val: password, set: setPassword },
                { id: 'cpw', label: 'Confirm password', val: confirm,  set: setConfirm  },
              ].map(({ id, label, val, set }) => (
                <label key={id} style={{ display: 'grid', gap: 7, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)' }}>
                  {label}
                  <input
                    id={id}
                    className="vt-input"
                    type="password"
                    value={val}
                    onChange={e => { set(e.target.value); setError(''); }}
                    placeholder="Min. 8 characters"
                    style={{ height: 48 }}
                  />
                </label>
              ))}
              {error && <p role="alert" style={{ margin: 0, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-danger-text)', fontWeight: 600 }}>{error}</p>}
              <button onClick={setNewPassword} disabled={busy} className="vt-button"
                style={{ background: 'linear-gradient(135deg,var(--vt-emerald-600),var(--vt-teal-500))', color: '#fff', border: 'none', opacity: busy ? 0.65 : 1 }}>
                {busy ? 'Saving…' : 'Set new password →'}
              </button>
            </>
          )}

          {/* ── Step 4: Done ─────────────────────────────────── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', display: 'grid', gap: 14, padding: '10px 0' }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ width: 52, height: 52, color: 'var(--vt-emerald-600)', margin: '0 auto' }} />
              <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--vt-ink)', letterSpacing: 0 }}>
                கடவுச்சொல் மாற்றப்பட்டது!
              </h2>
              <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-muted)', lineHeight: 1.6 }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link href="/auth/login" className="vt-button"
                style={{ background: 'linear-gradient(135deg,var(--vt-forest-800),var(--vt-forest-700))', color: '#fff', border: 'none', textDecoration: 'none', justifyContent: 'center' }}>
                Sign in now →
              </Link>
            </div>
          )}

        </div>

        {/* safety note */}
        <p style={{ marginTop: 18, maxWidth: 440, textAlign: 'center', fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)', lineHeight: 1.55 }}>
          <FontAwesomeIcon icon={faShieldHalved} style={{ width: 11, marginRight: 4 }} />
          Vaithiyam will never ask for your password via phone or WhatsApp.
        </p>
      </main>
    </div>
  );
}
