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

export default function TermsPage() {
  const sections = [
    {
      id: 'acceptance',
      title: 'ஒப்புதல் (Acceptance of Terms)',
      tamil: 'எங்கள் இணையதளத்தைப் பயன்படுத்துவதன் மூலம், இந்த விதிமுறைகள் மற்றும் நிபந்தனைகளை நீங்கள் முழுமையாக ஏற்றுக்கொள்கிறீர்கள்.',
      english: 'By accessing and using Iyarkai Nala Maruthuvamanai, you fully accept and agree to comply with these terms of service.',
    },
    {
      id: 'orders',
      title: 'ஆர்டர் & கட்டணம் (Orders & Payment)',
      tamil: 'இயற்கை நல மருத்துவமனை இணையதளத்தில் செய்யப்படும் அனைத்து ஆர்டர்களும் எங்கள் கையிருப்பு மற்றும் கட்டண சரிபார்ப்புக்கு உட்பட்டவை. தவறான விவரங்கள் இருந்தால் ஆர்டரை ரத்து செய்ய எங்களுக்கு உரிமை உண்டு.',
      english: 'All orders placed are subject to stock availability and payment verification. We reserve the right to cancel orders with incorrect information.',
    },
    {
      id: 'delivery',
      title: 'டெலிவரி (Delivery & Shipping)',
      tamil: 'அனுப்பப்படும் அனைத்து பார்சல்களும் பதிவு செய்யப்பட்ட கூரியர் சேவைகள் மூலம் 3-7 வேலை நாட்களுக்குள் டெலிவரி செய்யப்படும். எதிர்பாராத இயற்கை பேரிடர்களால் தாமதம் ஏற்படலாம்.',
      english: 'Shipments are handled via registered couriers and delivered within 3-7 business days. Delivery delays may occur due to unforeseen external events.',
    },
    {
      id: 'returns',
      title: 'திரும்பல் (Returns & Refunds)',
      tamil: 'வாடிக்கையாளர் திருப்தியை மேம்படுத்த 7 நாட்கள் திரும்பப் பெறும் கொள்கை எங்களிடம் உள்ளது. தகுதியான தயாரிப்புகளை மட்டுமே திரும்பப் பெற முடியும்.',
      english: 'We provide a 7-day return window for eligible products. Return procedures must align with our designated Returns Policy.',
    },
    {
      id: 'medical-disclaimer',
      title: 'மருத்துவ அறிவிப்பு (Medical Disclaimer)',
      tamil: 'எங்கள் தயாரிப்புகள் மற்றும் தகவல்கள் கல்வி நோக்கத்திற்காக மட்டுமே. இவை மருத்துவ ஆலோசனை அல்லது தகுதியான மருத்துவரின் சிகிச்சைக்கு மாற்றாகாது.',
      english: 'All product information is educational and should not replace professional medical advice, diagnosis, or physician-prescribed treatment.',
    },
    {
      id: 'ai-assistant',
      title: 'அகஸ்தியன் AI விதிமுறைகள் (AI Assistant Terms)',
      tamil: 'அகஸ்தியன் AI கடை பட்டியல் மற்றும் கல்வித் தகவல்களுக்கு மட்டும். அதன் பதில்கள் மருத்துவ ஆலோசனை, நோயறிதல், மருந்தளவு, சிகிச்சை தேர்வு அல்லது மருந்து மாற்றம் அல்ல; அவற்றை அப்படிப் பயன்படுத்தக்கூடாது. தயாரிப்பு விவரங்களை லேபிளுடன் சரிபார்த்து, தனிப்பட்ட உடல்நல கேள்விகளுக்கு தகுதியான மருத்துவர் அல்லது மருந்தாளரை அணுகவும். அவசரநிலையில் உள்ளூர் அவசர சேவையை உடனே தொடர்புகொள்ளவும்.',
      english: 'Agasthiyan AI is limited to store-catalogue and educational information. Its replies are not medical advice, diagnosis, dosage, treatment selection, or medication-change instructions and must not be relied on as such. Verify product details against the label and ask a qualified doctor or pharmacist about personal health questions. In an emergency, contact local emergency services immediately.',
    },
    {
      id: 'changes',
      title: 'மாற்றங்கள் (Amendments & Changes)',
      tamil: 'இந்த சேவை விதிமுறைகளை முன்னறிவிப்பின்றி எப்போது வேண்டுமானாலும் மாற்றுவதற்கு இயற்கை நல மருத்துவமனை நிர்வாகத்திற்கு முழு உரிமை உண்டு.',
      english: 'We reserve the right to update or modify these terms and conditions at any time without prior notification.',
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
            விதிமுறைகள் மற்றும் நிபந்தனைகள் (Terms of Service)
          </h1>
          <p style={{ margin: '-24px 0 32px', color: T.muted, fontSize: '0.85rem' }}>
            கடைசியாக புதுப்பிக்கப்பட்டது / Last updated: 23 July 2026
          </p>

          {/* Stack of Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sections.map((sec, idx) => (
              <motion.div
                key={idx}
                id={sec.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
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
