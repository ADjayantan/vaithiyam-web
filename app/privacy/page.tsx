'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CustomerHeader, CustomerFooter, MobileBottomNav } from '@/components/layout/CustomerShell';

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

export default function PrivacyPage() {
  const sections = [
    {
      title: 'தரவு சேகரிப்பு (Data Collection)',
      tamil: 'எங்கள் தளம் மற்றும் மொபைல் செயலி மூலம் உங்கள் பெயர், மின்னஞ்சல், தொலைபேசி எண் மற்றும் முகவரி போன்ற தகவல்களை ஆர்டர் மற்றும் சேவை நோக்கத்திற்காக மட்டுமே சேகரிக்கிறோம்.',
      english: 'We collect personal data such as name, email, phone number, and address strictly for completing orders and enhancing customer service.',
    },
    {
      title: 'பயன்பாடு (Data Usage)',
      tamil: 'சேகரிக்கப்படும் உங்கள் விவரங்கள் ஆர்டர்களை அனுப்பவும், மருத்துவ ஆலோசனைகளை ஒருங்கிணைக்கவும் மற்றும் தங்களுக்குரிய சலுகைகளைத் தெரிவிக்கவும் மட்டுமே பயன்படுத்தப்படும்.',
      english: 'Your information is used only to process transactions, coordinate health consultations, and deliver relevant promotions.',
    },
    {
      title: 'பாதுகாப்பு (Data Security)',
      tamil: 'உங்கள் தரவுகள் அனைத்தும் அதிநவீன Supabase பாதுகாப்பான சேவையகங்கள் மூலம் குறியாக்கம் (Encryption) செய்யப்பட்டு பாதுகாப்பாக வைக்கப்படுகின்றன. அனுமதியின்றி எவரும் அணுக முடியாது.',
      english: 'We utilize advanced encryption protocols on Supabase servers to ensure your personal and payment data is kept confidential and secure.',
    },
    {
      title: 'உங்கள் உரிமைகள் (Your Rights)',
      tamil: 'உங்களது தனிப்பட்ட விவரங்களை எப்போது வேண்டுமானாலும் பார்க்கவோ, மாற்றவோ அல்லது நீக்கவோ தங்களுக்கு முழு உரிமை உண்டு. எங்களை தொடர்பு கொண்டு இதைச் செய்யலாம்.',
      english: 'You reserve the right to access, rectify, or request the deletion of your personal information in our records at any time.',
    },
    {
      title: 'தொடர்பு (Contact Support)',
      tamil: 'தனியுரிமை கொள்கை குறித்து ஏதேனும் கேள்விகள் இருந்தால், support@vaithiyam.in என்ற மின்னஞ்சல் முகவரியில் எங்களைத் தொடர்பு கொள்ளவும்.',
      english: 'If you have questions regarding this privacy policy, please reach out to support@vaithiyam.in.',
    },
  ];

  return (
    <div style={{ backgroundColor: '#030C07', minHeight: '100dvh', color: '#F5EDD6', fontFamily: FONT.body }}>
      <CustomerHeader />

      <main style={{ paddingBottom: '90px', paddingTop: '32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          {/* Back Button */}
          <Link
            href="/"
            style={{
              color: T.leaf,
              fontFamily: FONT.body,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '24px',
              transition: 'color 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = T.gold)}
            onMouseOut={(e) => (e.currentTarget.style.color = T.leaf)}
          >
            ← திரும்பு
          </Link>

          {/* Heading */}
          <h1
            style={{
              fontFamily: FONT.display,
              fontSize: '2.5rem',
              fontWeight: 600,
              color: '#F5EDD6',
              marginBottom: '36px',
            }}
          >
            தனியுரிமை கொள்கை (Privacy Policy)
          </h1>

          {/* Stack of Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sections.map((sec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                style={{
                  background: 'rgba(13,34,24,0.60)',
                  border: `1px solid ${T.border}`,
                  borderLeft: '3px solid #3D8A5C',
                  borderRadius: '12px',
                  padding: '24px',
                }}
              >
                <h2
                  style={{
                    fontFamily: FONT.display,
                    fontSize: '1.35rem',
                    fontWeight: 600,
                    color: T.gold,
                    margin: '0 0 12px 0',
                  }}
                >
                  {sec.title}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '0.98rem', color: '#F5EDD6', lineHeight: 1.65 }}>
                    {sec.tamil}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: T.muted, lineHeight: 1.6 }}>
                    {sec.english}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />
      <CustomerFooter />
    </div>
  );
}
