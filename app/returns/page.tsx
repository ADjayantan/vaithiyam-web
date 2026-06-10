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

export default function ReturnsPage() {
  const sections = [
    {
      title: 'தகுதி (7 நாட்கள்) (Eligibility - 7 Days Limit)',
      tamil: 'பொருட்களைப் பெற்றுக்கொண்ட 7 நாட்களுக்குள் மட்டுமே திரும்பப் பெற விண்ணப்பிக்க முடியும். பொருட்கள் சேதமடையாமல், அசல் பேக்கேஜிங்குடன் இருக்க வேண்டும்.',
      english: 'Returns are accepted within 7 days of delivery. The items must be unused, undamaged, and kept in their original packaging.',
    },
    {
      title: 'திரும்ப முடியாத பொருட்கள் (Non-Returnable Items)',
      tamil: 'தனிப்பயனாக்கப்பட்ட மூலிகை கலவைகள், சீல் பிரிக்கப்பட்ட திரவ மருந்துகள், தைலங்கள் மற்றும் சுகாதார காரணங்களால் பயன்படுத்தப்பட்ட பொருட்களை திரும்பப் பெற முடியாது.',
      english: 'Customized herbal formulations, opened liquid medicines, oils, and hygiene-sensitive items are strictly non-returnable.',
    },
    {
      title: 'செயல்முறை (Return Process)',
      tamil: 'திரும்பப் பெற விரும்பினால் support@vaithiyam.in என்ற மின்னஞ்சலுக்கு ஆர்டர் எண் மற்றும் காரணத்துடன் மின்னஞ்சல் அனுப்பவும். எங்கள் குழு 24-48 மணி நேரத்திற்குள் உங்களைத் தொடர்பு கொள்ளும்.',
      english: 'To initiate a return, email support@vaithiyam.in with your Order ID and reason. Our team will review and respond within 24-48 hours.',
    },
    {
      title: 'திரும்ப செலுத்தல் காலம் (Refund Processing Window)',
      tamil: 'திரும்பப் பெறப்பட்ட பொருட்கள் எங்கள் கிடங்கிற்கு வந்து சோதிக்கப்பட்ட பின், 5-7 வேலை நாட்களுக்குள் உங்கள் வங்கிக் கணக்கில் பணம் திரும்ப செலுத்தப்படும்.',
      english: 'Once returned products are received and inspected at our warehouse, refunds will be credited to your original payment method within 5-7 business days.',
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
            திரும்பப் பெறும் கொள்கை (Returns & Refunds)
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
