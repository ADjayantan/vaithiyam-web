'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faShieldHalved, faStar } from '@fortawesome/free-solid-svg-icons';
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

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#030C07', minHeight: '100dvh', color: '#F5EDD6', fontFamily: FONT.body }}>
      <CustomerHeader />

      <main style={{ paddingBottom: '90px' }}>
        {/* HERO SECTION */}
        <section
          style={{
            position: 'relative',
            height: '420px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '24px',
            borderBottom: `1px solid rgba(61,138,92,0.12)`,
            background: 'radial-gradient(circle at center, rgba(13,34,24,0.4) 0%, #030C07 80%)',
          }}
        >
          {/* Subtle Kolam SVG overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.04,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <svg width="400" height="400" viewBox="0 0 100 100" stroke="#F5EDD6" strokeWidth="1" fill="none">
              <path d="M 50 5 L 95 50 L 50 95 L 5 50 Z" />
              <path d="M 50 5 Q 50 50 5 50 Q 50 50 50 95 Q 50 50 95 50 Q 50 50 50 5" />
              <path d="M 25 25 L 75 75 M 25 75 L 75 25" />
              <circle cx="50" cy="50" r="4" fill="#F5EDD6" />
              <circle cx="50" cy="20" r="3" fill="#F5EDD6" />
              <circle cx="50" cy="80" r="3" fill="#F5EDD6" />
              <circle cx="20" cy="50" r="3" fill="#F5EDD6" />
              <circle cx="80" cy="50" r="3" fill="#F5EDD6" />
              <circle cx="35" cy="35" r="2" fill="#F5EDD6" />
              <circle cx="65" cy="35" r="2" fill="#F5EDD6" />
              <circle cx="35" cy="65" r="2" fill="#F5EDD6" />
              <circle cx="65" cy="65" r="2" fill="#F5EDD6" />
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px' }}
          >
            <h1
              style={{
                fontFamily: FONT.display,
                fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                fontWeight: 600,
                color: '#F5EDD6',
                margin: '0 0 16px 0',
                letterSpacing: '-0.02em',
              }}
            >
              வைத்தியம் பற்றி
            </h1>
            <p
              style={{
                fontFamily: FONT.body,
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                color: T.muted,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              சித்த மற்றும் ஆயுர்வேத மரபின் நவீன தளம்
            </p>
          </motion.div>
        </section>

        {/* MISSION CARDS */}
        <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                background: 'rgba(13,34,24,0.60)',
                border: `1px solid ${T.border}`,
                borderRadius: '18px',
                padding: '32px 24px',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(61,138,92,0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <div style={{ color: T.gold, fontSize: '2rem', marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faLeaf} style={{ width: 32, height: 32 }} />
              </div>
              <h3
                style={{
                  fontFamily: FONT.display,
                  fontSize: '1.45rem',
                  fontWeight: 600,
                  margin: '0 0 12px 0',
                  color: '#F5EDD6',
                }}
              >
                எங்கள் பாரம்பரியம்
              </h3>
              <p style={{ fontSize: '0.92rem', color: T.muted, lineHeight: 1.7, margin: 0 }}>
                5000 ஆண்டுகள் பழமையான சித்த மருத்துவ மரபைக் காத்து, அதன் உன்னத மூலிகைகளை தற்காலத்திற்கு ஏற்ப தூய்மையான முறையில் வழங்குகிறோம்.
              </p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                background: 'rgba(13,34,24,0.60)',
                border: `1px solid ${T.border}`,
                borderRadius: '18px',
                padding: '32px 24px',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(61,138,92,0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <div style={{ color: T.gold, fontSize: '2rem', marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ width: 32, height: 32 }} />
              </div>
              <h3
                style={{
                  fontFamily: FONT.display,
                  fontSize: '1.45rem',
                  fontWeight: 600,
                  margin: '0 0 12px 0',
                  color: '#F5EDD6',
                }}
              >
                எங்கள் உறுதிமொழி
              </h3>
              <p style={{ fontSize: '0.92rem', color: T.muted, lineHeight: 1.7, margin: 0 }}>
                100% அசல் மற்றும் நவீன ஆய்வகங்களில் அறிவியல் பூர்வமாக பரிசோதிக்கப்பட்ட தூய்மையான மூலிகை தயாரிப்புகளை மட்டுமே வழங்குவதாக உறுதியளிக்கிறோம்.
              </p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                background: 'rgba(13,34,24,0.60)',
                border: `1px solid ${T.border}`,
                borderRadius: '18px',
                padding: '32px 24px',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(61,138,92,0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <div style={{ color: T.gold, fontSize: '2rem', marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faStar} style={{ width: 32, height: 32 }} />
              </div>
              <h3
                style={{
                  fontFamily: FONT.display,
                  fontSize: '1.45rem',
                  fontWeight: 600,
                  margin: '0 0 12px 0',
                  color: '#F5EDD6',
                }}
              >
                எங்கள் தயாரிப்புகள்
              </h3>
              <p style={{ fontSize: '0.92rem', color: T.muted, lineHeight: 1.7, margin: 0 }}>
                சித்த, ஆயுர்வேத மற்றும் இயற்கை முறையிலான தரம் வாய்ந்த மருந்துகள், பொடிகள், தைலங்கள் மற்றும் ஆரோக்கியப் பொருட்களை உங்களுக்கு வழங்குகிறோம்.
              </p>
            </div>
          </motion.div>
        </section>

        {/* STATS ROW */}
        <section style={{ padding: '40px 24px', background: 'rgba(13,34,24,0.30)', borderTop: `1px solid rgba(61,138,92,0.08)`, borderBottom: `1px solid rgba(61,138,92,0.08)` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
              }}
            >
              {[
                { val: '500+', lab: 'தயாரிப்புகள்' },
                { val: '3', lab: 'மரபுகள்' },
                { val: '100%', lab: 'அசல்' },
                { val: '2024 முதல்', lab: 'சேவை' },
              ].map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(13,34,24,0.60)',
                    border: `1px solid ${T.border}`,
                    borderRadius: '18px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontFamily: FONT.display, fontSize: '2.2rem', fontWeight: 700, color: T.gold, marginBottom: '6px' }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: T.muted }}>{s.lab}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* STORY SECTION */}
        <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 500px' }}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{
                  borderLeft: `4px solid ${T.leaf}`,
                  paddingLeft: '24px',
                }}
              >
                <h2
                  style={{
                    fontFamily: FONT.display,
                    fontSize: '2.2rem',
                    fontWeight: 600,
                    margin: '0 0 20px 0',
                    color: '#F5EDD6',
                  }}
                >
                  எங்கள் கதை
                </h2>
                <p style={{ fontSize: '1rem', color: '#F5EDD6', lineHeight: 1.8, margin: 0 }}>
                  வைத்தியம் பாரம்பரிய மருத்துவத்தின் தொன்மையையும் நவீன தொழில்நுட்பத்தின் எளிமையையும் இணைக்கும் ஒரு பாலமாகும்.
                  தூய்மையான காடுகளில் இருந்து நேரடியாக சேகரிக்கப்படும் மூலிகைகளைக் கொண்டு, பழங்கால ஓலைச்சுவடிகளில் விவரிக்கப்பட்டுள்ள
                  முறைகளின்படி தயாரிக்கப்படும் மருந்துகளை எளிய வழியில் மக்களிடம் சேர்ப்பதே எங்கள் நோக்கம்.
                  சித்தர்கள் அருளிய இந்த இயற்கை மருத்துவ ஞானத்தை அடுத்த தலைமுறைக்கு பாதுகாப்பாகக் கொண்டு சேர்க்க நாங்கள் பாடுபடுகிறோம்.
                </p>
              </motion.div>
            </div>
            <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  aspectRatio: '1',
                  background: 'rgba(13,34,24,0.40)',
                  border: `1px solid ${T.border}`,
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                }}
              >
                {/* Decorative Pot/Mortar SVG */}
                <svg width="200" height="200" viewBox="0 0 100 100" fill="none" stroke={T.gold} strokeWidth="1.5">
                  <path d="M30 45 C30 70, 70 70, 70 45 Z" strokeWidth="2" />
                  <path d="M25 45 L75 45" strokeWidth="2.5" />
                  <path d="M40 45 L60 45 L50 20 Z" fill="rgba(61,138,92,0.2)" stroke={T.leaf} />
                  <path d="M45 75 L55 75 M50 75 L50 63" />
                  {/* Floating leaves */}
                  <path d="M20 25 Q30 20 35 30 Q25 35 20 25 Z" fill="rgba(61,138,92,0.15)" stroke={T.leaf} />
                  <path d="M80 25 Q70 20 65 30 Q75 35 80 25 Z" fill="rgba(61,138,92,0.15)" stroke={T.leaf} />
                </svg>
              </motion.div>
            </div>
          </div>
        </section>

        {/* WHY SIDDHA SECTION */}
        <section style={{ padding: '60px 24px', background: 'rgba(13,34,24,0.15)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: FONT.display,
                fontSize: '2.2rem',
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: '48px',
                color: '#F5EDD6',
              }}
            >
              ஏன் சித்த மருத்துவம்?
            </h2>

            {/* Alternating Row 1 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center', marginBottom: '60px' }}>
              <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  style={{
                    width: '100%',
                    maxWidth: '360px',
                    aspectRatio: '1.2',
                    background: 'rgba(13,34,24,0.50)',
                    border: `1px solid ${T.border}`,
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Decorative Leaf SVG */}
                  <svg width="180" height="180" viewBox="0 0 100 100" fill="none" stroke={T.leaf} strokeWidth="1.5">
                    <path d="M50 85 C15 55, 30 20, 50 15 C70 20, 85 55, 50 85 Z" fill="rgba(61,138,92,0.1)" strokeWidth="2" />
                    <path d="M50 15 V85" />
                    <path d="M50 35 C60 38, 70 35, 75 30" />
                    <path d="M50 45 C65 48, 75 42, 80 38" />
                    <path d="M50 55 C60 58, 70 55, 75 50" />
                    <path d="M50 35 C40 38, 30 35, 25 30" />
                    <path d="M50 45 C35 48, 25 42, 20 38" />
                    <path d="M50 55 C40 58, 30 55, 25 50" />
                  </svg>
                </motion.div>
              </div>
              <div style={{ flex: '1 1 500px' }}>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h3
                    style={{
                      fontFamily: FONT.display,
                      fontSize: '1.6rem',
                      fontWeight: 600,
                      color: T.gold,
                      marginBottom: '16px',
                    }}
                  >
                    முழுமையான குணம் (Holistic Healing)
                  </h3>
                  <p style={{ fontSize: '0.98rem', color: T.muted, lineHeight: 1.8, margin: 0 }}>
                    சித்த மருத்துவம் என்பது நோயின் அறிகுறிகளை மட்டும் தற்காலிகமாக குணப்படுத்துவதல்ல, மாறாக உடலையும் மனதையும் ஒருசேர குணப்படுத்தி,
                    நோய்க்கான மூல காரணத்தைக் கண்டறிந்து அகற்றுவதாகும். இது உடலின் வாத, பித்த, கப சமநிலையை மீட்டெடுக்கிறது.
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Alternating Row 2 */}
            <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: '48px', alignItems: 'center' }}>
              <div style={{ flex: '1 1 500px' }}>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h3
                    style={{
                      fontFamily: FONT.display,
                      fontSize: '1.6rem',
                      fontWeight: 600,
                      color: T.gold,
                      marginBottom: '16px',
                    }}
                  >
                    நிரூபிக்கப்பட்ட மூலிகைகள் (Proven Ingredients)
                  </h3>
                  <p style={{ fontSize: '0.98rem', color: T.muted, lineHeight: 1.8, margin: 0 }}>
                    இயற்கை அன்னை நமக்கு வழங்கிய நெல்லிக்காய், கடுக்காய், தான்றிக்காய், அதிமதுரம் போன்ற பாரம்பரிய மூலிகைகள் ஒவ்வொன்றும் அறிவியல் பூர்வமாக
                    பல நன்மைகள் நிரூபிக்கப்பட்டவை. இவை எந்தவித பக்கவிளைவுகளும் இன்றி உடலைத் தூய்மைப்படுத்தி நோய் எதிர்ப்புச் சக்தியை அதிகரிக்கின்றன.
                  </p>
                </motion.div>
              </div>
              <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  style={{
                    width: '100%',
                    maxWidth: '360px',
                    aspectRatio: '1.2',
                    background: 'rgba(13,34,24,0.50)',
                    border: `1px solid ${T.border}`,
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Decorative Sparkles/Sun SVG */}
                  <svg width="180" height="180" viewBox="0 0 100 100" fill="none" stroke={T.gold} strokeWidth="1.5">
                    <circle cx="50" cy="50" r="20" stroke={T.leaf} strokeWidth="2.5" fill="rgba(61,138,92,0.15)" />
                    {/* Sun rays / sparkles */}
                    <path d="M50 15 V25 M50 75 V85 M15 50 H25 M75 50 H85" strokeWidth="2" />
                    <path d="M25 25 L32 32 M68 68 L75 75 M25 75 L32 68 M68 32 L75 25" strokeWidth="2" />
                    {/* Sparkle details */}
                    <path d="M46 50 Q50 50 50 46 Q50 50 54 50 Q50 50 50 54 Q50 50 46 50 Z" fill={T.gold} />
                  </svg>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MobileBottomNav />
      <CustomerFooter />
    </div>
  );
}
