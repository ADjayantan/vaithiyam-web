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
      id: 'data-collection',
      title: 'தரவு சேகரிப்பு (Data Collection)',
      tamil: 'எங்கள் இணையதளம் மூலம் உங்கள் பெயர், மின்னஞ்சல், தொலைபேசி எண் மற்றும் முகவரி போன்ற தகவல்களை ஆர்டர் மற்றும் சேவை நோக்கங்களுக்காக சேகரிக்கிறோம்.',
      english: 'Through this website, we collect information such as name, email, phone number, and address for order fulfilment and customer service.',
    },
    {
      id: 'data-usage',
      title: 'பயன்பாடு (Data Usage)',
      tamil: 'சேகரிக்கப்படும் விவரங்கள் ஆர்டர்களை செயல்படுத்தவும், ஆதரவு கோரிக்கைகளுக்கு பதிலளிக்கவும், தேவையான சேவை தகவல்களை வழங்கவும் பயன்படுத்தப்படும்.',
      english: 'Collected information is used to process orders, answer support requests, and provide essential service communications.',
    },
    {
      id: 'ai-assistant',
      title: 'அகஸ்தியன் AI உதவியாளர் (AI Assistant)',
      tamil: 'அகஸ்தியன் AI-ஐ பயன்படுத்தும்போது, உங்கள் செய்தியும் சமீபத்திய உரையாடல் சூழலும் பதிலை உருவாக்க Groq API-க்கு அனுப்பப்படும். அரட்டை எங்கள் தரவுத்தளத்தில் சேமிக்கப்படாது; தற்போதைய browser session-இல் மட்டும் இருக்கும். பெயர், தொடர்பு விவரங்கள், மருந்துச்சீட்டு, நோயறிதல் அல்லது பிற தனிப்பட்ட/மருத்துவ தகவல்களை பகிர வேண்டாம். Groq-ன் தற்போதைய data controls படி inference input/output இயல்பாக சேமிக்கப்படாது; service reliability அல்லது abuse investigation தேவைப்பட்டால் 30 நாட்கள் வரை தற்காலிகமாக பதிவு செய்யப்படலாம். Groq Console-ல் Zero Data Retention அமைப்பை இயக்கலாம்; சேமிக்கப்படும் Groq customer data அமெரிக்காவில் செயலாக்கப்படலாம்.',
      english: 'When you use Agasthiyan AI, your message and a limited amount of recent chat context are sent to the Groq API to generate a reply. Chats are not saved in our database and remain only in the current browser session. Do not share names, contact details, prescriptions, diagnoses, or other personal or medical information. Under Groq’s current data controls, inference inputs and outputs are not retained by default, but they may be logged temporarily for service reliability or abuse investigations for up to 30 days. Zero Data Retention can be enabled in the Groq Console, and retained Groq customer data may be processed in the United States.',
    },
    {
      id: 'data-security',
      title: 'பாதுகாப்பு (Data Security)',
      tamil: 'Supabase அமைக்கப்பட்ட சேவைகளில் அணுகல் கட்டுப்பாடுகள் மற்றும் சேவை வழங்குநரின் பாதுகாப்பு வசதிகளைப் பயன்படுத்துகிறோம். இணைய வழி பரிமாற்றம் அல்லது சேமிப்பு முறைகள் முழுமையாக அபாயமற்றவை அல்ல.',
      english: 'Where Supabase-backed services are configured, we use access controls and the provider’s security features. No internet transmission or storage method is completely risk-free.',
    },
    {
      id: 'your-rights',
      title: 'உங்கள் உரிமைகள் (Your Rights)',
      tamil: 'உங்களது தனிப்பட்ட விவரங்களை எப்போது வேண்டுமானாலும் பார்க்கவோ, மாற்றவோ அல்லது நீக்கவோ தங்களுக்கு முழு உரிமை உண்டு. எங்களை தொடர்பு கொண்டு இதைச் செய்யலாம்.',
      english: 'You reserve the right to access, rectify, or request the deletion of your personal information in our records at any time.',
    },
    {
      id: 'contact',
      title: 'தொடர்பு (Contact Support)',
      tamil: 'தனியுரிமை கொள்கை குறித்து ஏதேனும் கேள்விகள் இருந்தால், support@iyarkainalam.in என்ற மின்னஞ்சல் முகவரியில் எங்களைத் தொடர்பு கொள்ளவும்.',
      english: 'If you have questions regarding this privacy policy, please reach out to support@iyarkainalam.in.',
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
