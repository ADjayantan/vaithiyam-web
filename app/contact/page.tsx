'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faClock, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
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

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form slightly
    if (!formData.name || !formData.email || !formData.message) return;
    
    setShowToast(true);
    setFormData({ name: '', email: '', phone: '', message: '' });
    
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  return (
    <div style={{ backgroundColor: '#030C07', minHeight: '100dvh', color: '#F5EDD6', fontFamily: FONT.body }}>
      <CustomerHeader />

      <main style={{ paddingBottom: '90px', paddingTop: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          {/* Header Title */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1
              style={{
                fontFamily: FONT.display,
                fontSize: '2.8rem',
                fontWeight: 600,
                color: '#F5EDD6',
                margin: '0 0 12px 0',
              }}
            >
              தொடர்பு கொள்ள
            </h1>
            <p style={{ color: T.muted, fontSize: '1.05rem', margin: 0 }}>
              உங்களின் ஆரோக்கியப் பயணத்தில் உதவ நாங்கள் எப்போதும் தயாராக இருக்கிறோம்.
            </p>
          </div>

          {/* Two-Column Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              alignItems: 'start',
            }}
          >
            {/* LEFT COLUMN — Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'rgba(13,34,24,0.60)',
                border: `1px solid ${T.border}`,
                borderRadius: '20px',
                padding: '36px 28px',
              }}
            >
              <h2
                style={{
                  fontFamily: FONT.display,
                  fontSize: '1.8rem',
                  fontWeight: 600,
                  color: '#F5EDD6',
                  margin: '0 0 24px 0',
                }}
              >
                எங்களை தொடர்பு கொள்ளுங்கள்
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="name" style={{ fontSize: '0.88rem', color: T.muted }}>பெயர் (Name) *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      background: 'rgba(13,34,24,0.60)',
                      border: '1px solid rgba(61,138,92,0.22)',
                      color: '#F5EDD6',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = T.gold)}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(61,138,92,0.22)')}
                  />
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="email" style={{ fontSize: '0.88rem', color: T.muted }}>மின்னஞ்சல் (Email) *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      background: 'rgba(13,34,24,0.60)',
                      border: '1px solid rgba(61,138,92,0.22)',
                      color: '#F5EDD6',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = T.gold)}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(61,138,92,0.22)')}
                  />
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="phone" style={{ fontSize: '0.88rem', color: T.muted }}>தொலைபேசி எண் (Phone)</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      background: 'rgba(13,34,24,0.60)',
                      border: '1px solid rgba(61,138,92,0.22)',
                      color: '#F5EDD6',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = T.gold)}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(61,138,92,0.22)')}
                  />
                </div>

                {/* Message */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="message" style={{ fontSize: '0.88rem', color: T.muted }}>செய்தி (Message) *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    style={{
                      background: 'rgba(13,34,24,0.60)',
                      border: '1px solid rgba(61,138,92,0.22)',
                      color: '#F5EDD6',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = T.gold)}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(61,138,92,0.22)')}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #C9922A, #E8A820)',
                    color: '#0A1A10',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, opacity 0.2s ease',
                    boxShadow: '0 4px 14px rgba(212, 137, 10, 0.2)',
                    marginTop: '8px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  செய்தி அனுப்பு
                </button>
              </form>
            </motion.div>

            {/* RIGHT COLUMN — Contact Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* WhatsApp Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: 'rgba(13,34,24,0.60)',
                  border: `1px solid ${T.border}`,
                  borderRadius: '18px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 137, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold }}>
                    <FontAwesomeIcon icon={faWhatsapp} style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: T.muted }}>வாட்ஸ்அப் (WhatsApp)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F5EDD6' }}>+91 98765 43210</div>
                  </div>
                </div>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.gold}`,
                    color: T.gold,
                    padding: '10px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    transition: 'background 0.2s ease, color 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = T.gold;
                    e.currentTarget.style.color = '#0A1A10';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = T.gold;
                  }}
                >
                  WhatsApp-ல் பேசுங்கள்
                </a>
              </motion.div>

              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  background: 'rgba(13,34,24,0.60)',
                  border: `1px solid ${T.border}`,
                  borderRadius: '18px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 137, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold }}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: T.muted }}>மின்னஞ்சல் (Email)</div>
                  <a href="mailto:support@vaithiyam.in" style={{ fontSize: '1.15rem', fontWeight: 600, color: '#F5EDD6', textDecoration: 'underline' }}>
                    support@vaithiyam.in
                  </a>
                </div>
              </motion.div>

              {/* Hours Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  background: 'rgba(13,34,24,0.60)',
                  border: `1px solid ${T.border}`,
                  borderRadius: '18px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 137, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold }}>
                  <FontAwesomeIcon icon={faClock} style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: T.muted }}>வேலை நேரம் (Support Hours)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F5EDD6' }}>
                    திங்கள்–சனி: 9AM–7PM IST
                  </div>
                </div>
              </motion.div>

              {/* Address Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  background: 'rgba(13,34,24,0.60)',
                  border: `1px solid ${T.border}`,
                  borderRadius: '18px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 137, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold }}>
                  <FontAwesomeIcon icon={faLocationDot} style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: T.muted }}>முகவரி (Address)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F5EDD6' }}>
                    Coimbatore, Tamil Nadu, India
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '24px',
              background: '#0D2218',
              border: '1px solid #7EC89A',
              color: '#7EC89A',
              borderRadius: '10px',
              padding: '16px 24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 150,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span style={{ fontWeight: 600 }}>உங்கள் செய்தி அனுப்பப்பட்டது!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileBottomNav />
      <CustomerFooter />
    </div>
  );
}
