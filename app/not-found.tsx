'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

export default function NotFound() {
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
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      {/* 404 Watermark */}
      <div
        style={{
          position: 'absolute',
          fontFamily: FONT.display,
          fontSize: '12rem',
          fontWeight: 700,
          color: 'rgba(61, 138, 92, 0.07)',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 1,
          lineHeight: 1,
        }}
      >
        404
      </div>

      {/* Content wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          maxWidth: '500px',
        }}
      >
        {/* Floating leaf SVG */}
        <motion.div
          animate={{
            y: [0, -14, 0],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.leaf}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 1.5 3.5.9 9.2a7 7 0 0 1-8.9 8.8Z" />
            <path d="M19 2c-2.2 4.9-6 9.1-10 14" />
          </svg>
        </motion.div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: FONT.display,
            fontSize: '2.4rem',
            fontWeight: 400,
            color: '#F5EDD6',
            margin: '12px 0 0 0',
          }}
        >
          பக்கம் கிடைக்கவில்லை
        </h1>

        {/* Subtext */}
        <p
          style={{
            color: T.muted,
            fontSize: '1rem',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          மன்னிக்கவும், நீங்கள் தேடும் பக்கம் இந்த மூலிகைத் தோட்டத்தில் இல்லை. மீண்டும் முயற்சிக்கவும் அல்லது முகப்பு பக்கத்திற்கு செல்லவும்.
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              background: 'linear-gradient(135deg, #C9922A, #E8A820)',
              color: '#0A1A10',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: 'none',
              transition: 'transform 0.2s ease, opacity 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 4px 14px rgba(212, 137, 10, 0.2)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            முகப்புக்கு திரும்பு
          </Link>
          <Link
            href="/products"
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
            தயாரிப்புகளை காண
          </Link>
        </div>
      </div>
    </div>
  );
}
