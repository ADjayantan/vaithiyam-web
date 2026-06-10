'use client';

import React from 'react';
import { motion } from 'framer-motion';

const FONT = {
  display: 'var(--vt-font-display)',
  body: 'var(--vt-font-body)',
} as const;

export default function Loading() {
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
        gap: '20px',
        position: 'relative',
        zIndex: 9999,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Animated Kolam/Leaf Circle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: 'linear',
          }}
          style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="80" height="80" viewBox="0 0 100 100">
            {/* Outer rotating circle with stroke animations */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              animate={{
                stroke: ['#3D8A5C', '#E8A820', '#3D8A5C'],
                strokeDasharray: ['10 120', '80 120', '10 120'],
                strokeDashoffset: [0, -240],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Inner decorative leaf */}
            <motion.path
              d="M50 25 C35 42 38 65 50 72 C62 65 65 42 50 25 Z M50 25 V72"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              animate={{
                stroke: ['#E8A820', '#3D8A5C', '#E8A820'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </svg>
        </motion.div>

        {/* Pulsing Vaithiyam text */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            fontFamily: FONT.display,
            fontSize: '1.6rem',
            color: '#F5EDD6',
            letterSpacing: '0.05em',
            marginTop: '8px',
          }}
        >
          வைத்தியம்
        </motion.div>
      </div>
    </div>
  );
}
