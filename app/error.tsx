'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

const T = {
  forestPrimary: 'var(--vt-forest-800)',
  gold: 'var(--vt-gold-500)',
  leaf: 'var(--vt-forest-600)',
  darkText: 'var(--vt-ink)',
  muted: 'var(--vt-muted)',
  border: 'var(--vt-border)',
} as const;

const FONT = {
  display: 'var(--vt-font-display)',
  body: 'var(--vt-font-body)',
} as const;

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  const rawMsg = error?.message || 'ஏதோ தவறு நடந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.';
  const truncatedMsg = rawMsg.length > 120 ? rawMsg.substring(0, 117) + '...' : rawMsg;

  return (
    <div
      style={{
        backgroundColor: '#030C07',
        minHeight: '100dvh',
        width: '100%',
        color: '#F5EDD6',
        fontFamily: FONT.body,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        {/* Coral leaf icon */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f95c38"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 1.5 3.5.9 9.2a7 7 0 0 1-8.9 8.8Z" />
            <path d="M19 2c-2.2 4.9-6 9.1-10 14" />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: FONT.display,
            fontSize: '2.2rem',
            fontWeight: 400,
            color: '#F5EDD6',
            margin: '0',
          }}
        >
          ஏதோ தவறு நடந்தது
        </h1>

        {/* Muted instruction */}
        <p
          style={{
            color: T.muted,
            fontSize: '0.95rem',
            margin: '0 0 8px 0',
          }}
        >
          கணினிப் பிழை ஏற்பட்டுள்ளது. பிழை விவரம் பின்வருமாறு:
        </p>

        {/* Error code block */}
        <div
          style={{
            backgroundColor: 'rgba(249, 92, 56, 0.08)',
            border: '1px solid rgba(249, 92, 56, 0.20)',
            borderRadius: '12px',
            padding: '14px 18px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: '#FF7878',
            textAlign: 'left',
            width: '100%',
            wordBreak: 'break-all',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          {truncatedMsg}
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '12px',
            width: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              background: 'linear-gradient(135deg, #C9922A, #E8A820)',
              color: '#0A1A10',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, opacity 0.2s ease',
              boxShadow: '0 4px 14px rgba(212, 137, 10, 0.2)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            மீண்டும் முயற்சி
          </button>
          <Link
            href="/"
            style={{
              background: 'transparent',
              color: '#F5EDD6',
              border: `1px solid ${T.gold}`,
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: 'none',
              transition: 'transform 0.2s ease, background 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.backgroundColor = 'rgba(212, 137, 10, 0.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            முகப்புக்கு திரும்பு
          </Link>
        </div>
      </div>
    </div>
  );
}
