'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronUp,
  faEnvelope,
  faPhone,
  faShieldHalved,
  faTruck,
  faRotate,
  faClipboardList,
  faCircleCheck,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
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

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: 'How do I order a prescription medicine?',
    a: 'Go to the product page and tap "Add to cart". During checkout you will be prompted to upload a prescription. Our licensed pharmacist reviews it within 2–4 hours before dispatch.',
  },
  {
    q: 'Are the medicines authentic and genuine?',
    a: 'Yes. Every product is sourced from AYUSH-licensed manufacturers, FSSAI-registered, and verified by our medical quality assurance team.',
  },
  {
    q: 'What delivery options are available?',
    a: 'Standard delivery (3–5 business days) is free on orders over ₹499. Express delivery in Coimbatore is available within 4 hours.',
  },
  {
    q: 'Can I return a medicine I ordered?',
    a: 'Medicines can be returned within 7 days if they are unopened and sealed. Prescription medications are non-returnable once pharmacists approve them.',
  },
];

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', mobile: '', subject: 'Order Issue', message: '' });
  const [showToast, setShowToast] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.message) return;

    setShowToast(true);
    setFormData({ name: '', mobile: '', subject: 'Order Issue', message: '' });

    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  return (
    <div style={{ backgroundColor: '#030C07', minHeight: '100dvh', color: '#F5EDD6', fontFamily: FONT.body }}>
      <CustomerHeader />

      <main style={{ paddingBottom: '90px' }}>
        {/* HERO SECTION */}
        <section
          style={{
            padding: '60px 24px 48px 24px',
            textAlign: 'center',
            background: 'radial-gradient(circle at center, rgba(13,34,24,0.3) 0%, #030C07 100%)',
            borderBottom: '1px solid rgba(61,138,92,0.1)',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <span
              style={{
                fontFamily: FONT.body,
                fontSize: '0.78rem',
                fontWeight: 700,
                color: T.gold,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              SUPPORT CENTER
            </span>
            <h1
              style={{
                fontFamily: FONT.display,
                fontSize: '2.8rem',
                fontWeight: 600,
                color: T.leaf,
                margin: '0 0 4px 0',
              }}
            >
              உதவி மற்றும் ஆதரவு
            </h1>
            <h2
              style={{
                fontFamily: FONT.display,
                fontSize: '1.9rem',
                fontWeight: 400,
                color: '#F5EDD6',
                margin: '0 0 16px 0',
              }}
            >
              Help & Support
            </h2>
            <p style={{ color: T.muted, fontSize: '0.95rem', margin: '0 0 32px 0', lineHeight: 1.5 }}>
              Available every day 9 AM – 9 PM. WhatsApp is the fastest channel for order issues.
            </p>

            {/* Search Bar */}
            <div
              style={{
                position: 'relative',
                maxWidth: '480px',
                margin: '0 auto',
              }}
            >
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: T.muted,
                  width: '16px',
                  height: '16px',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search for help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(13,34,24,0.60)',
                  border: '1px solid rgba(61,138,92,0.22)',
                  color: '#F5EDD6',
                  borderRadius: '10px',
                  padding: '12px 16px 12px 48px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = T.gold)}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(61,138,92,0.22)')}
              />
            </div>
          </div>
        </section>

        {/* CONTACT CHANNELS */}
        <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Phone Card */}
            <div
              style={{
                background: 'rgba(13,34,24,0.60)',
                border: `1px solid ${T.border}`,
                borderRadius: '18px',
                padding: '32px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 137, 10, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold }}>
                <FontAwesomeIcon icon={faPhone} style={{ width: 18, height: 18 }} />
              </div>
              <h3 style={{ margin: 0, fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600 }}>Phone</h3>
              <div>
                <div style={{ color: T.gold, fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>+91 88000 00000</div>
                <div style={{ color: T.muted, fontSize: '0.8rem' }}>Mon–Sat 9 AM – 9 PM</div>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div
              style={{
                background: 'rgba(13,34,24,0.60)',
                border: `1px solid ${T.border}`,
                borderRadius: '18px',
                padding: '32px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 137, 10, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold }}>
                <FontAwesomeIcon icon={faWhatsapp} style={{ width: 20, height: 20 }} />
              </div>
              <h3 style={{ margin: 0, fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600 }}>WhatsApp</h3>
              <div style={{ color: T.muted, fontSize: '0.85rem' }}>Fastest response time</div>
              <a
                href="https://wa.me/918800000000"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #C9922A, #E8A820)',
                  color: '#0A1A10',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  width: '100%',
                  maxWidth: '200px',
                  boxShadow: '0 4px 14px rgba(212, 137, 10, 0.2)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                CHAT NOW
              </a>
            </div>

            {/* Email Card */}
            <div
              style={{
                background: 'rgba(13,34,24,0.60)',
                border: `1px solid ${T.border}`,
                borderRadius: '18px',
                padding: '32px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 137, 10, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold }}>
                <FontAwesomeIcon icon={faEnvelope} style={{ width: 18, height: 18 }} />
              </div>
              <h3 style={{ margin: 0, fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600 }}>Email</h3>
              <div>
                <a href="mailto:support@vaithiyam.in" style={{ color: T.gold, fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px', textDecoration: 'underline' }}>
                  support@vaithiyam.in
                </a>
                <div style={{ color: T.muted, fontSize: '0.8rem' }}>Reply within 24 hours</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px' }}>
            {/* Left FAQ Description */}
            <div style={{ flex: '1 1 300px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: T.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                FAQ
              </span>
              <h2
                style={{
                  fontFamily: FONT.display,
                  fontSize: '2.2rem',
                  fontWeight: 600,
                  color: '#F5EDD6',
                  margin: '12px 0 16px 0',
                }}
              >
                அடிக்கடி கேட்கப்படும் கேள்விகள்
              </h2>
              <p style={{ color: T.muted, fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                Find quick answers to common questions about our products and services.
              </p>
            </div>

            {/* Right FAQ Accordions */}
            <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FAQS.map((faq, idx) => {
                const isOpen = openIdx === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(13,34,24,0.60)',
                      border: `1px solid ${isOpen ? T.gold : T.border}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '20px 24px',
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: '#F5EDD6',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.98rem', paddingRight: '16px' }}>{faq.q}</span>
                      <FontAwesomeIcon
                        icon={isOpen ? faChevronUp : faChevronDown}
                        style={{ width: 14, height: 14, color: T.muted, flexShrink: 0 }}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            style={{
                              padding: '0 24px 20px 24px',
                              color: T.muted,
                              fontSize: '0.9rem',
                              lineHeight: 1.6,
                              borderTop: '1px solid rgba(61,138,92,0.1)',
                              paddingTop: '12px',
                            }}
                          >
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* POLICIES SECTION */}
        <section style={{ padding: '60px 24px', background: 'rgba(13,34,24,0.20)', borderTop: '1px solid rgba(61,138,92,0.08)', borderBottom: '1px solid rgba(61,138,92,0.08)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: T.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              POLICIES
            </span>
            <h2
              style={{
                fontFamily: FONT.display,
                fontSize: '2.4rem',
                fontWeight: 600,
                color: '#F5EDD6',
                margin: '12px 0 40px 0',
              }}
            >
              Shipping & Returns at a glance
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', textAlign: 'left' }}>
              {/* Shipping */}
              <div style={{ background: 'rgba(13,34,24,0.60)', border: `1px solid ${T.border}`, borderRadius: '14px', padding: '24px' }}>
                <div style={{ color: '#3D8A5C', fontSize: '1.5rem', marginBottom: '16px' }}>
                  <FontAwesomeIcon icon={faTruck} style={{ width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Shipping</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: T.muted }}>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Free delivery on orders ₹499+</li>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Standard: 3–5 business days</li>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Express: 4 hours (Coimbatore)</li>
                </ul>
              </div>

              {/* Returns */}
              <div style={{ background: 'rgba(13,34,24,0.60)', border: `1px solid ${T.border}`, borderRadius: '14px', padding: '24px' }}>
                <div style={{ color: '#3D8A5C', fontSize: '1.5rem', marginBottom: '16px' }}>
                  <FontAwesomeIcon icon={faRotate} style={{ width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Returns</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: T.muted }}>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> 7-day window for unopened</li>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Refund in 5–7 working days</li>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Contact with Order ID</li>
                </ul>
              </div>

              {/* Prescriptions */}
              <div style={{ background: 'rgba(13,34,24,0.60)', border: `1px solid ${T.border}`, borderRadius: '14px', padding: '24px' }}>
                <div style={{ color: '#3D8A5C', fontSize: '1.5rem', marginBottom: '16px' }}>
                  <FontAwesomeIcon icon={faShieldHalved} style={{ width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Prescriptions</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: T.muted }}>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Pharmacist review (2 hours)</li>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Secure data handling</li>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Invalid Rx puts order on hold</li>
                </ul>
              </div>

              {/* Guidelines */}
              <div style={{ background: 'rgba(13,34,24,0.60)', border: `1px solid ${T.border}`, borderRadius: '14px', padding: '24px' }}>
                <div style={{ color: '#3D8A5C', fontSize: '1.5rem', marginBottom: '16px' }}>
                  <FontAwesomeIcon icon={faClipboardList} style={{ width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Guidelines</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: T.muted }}>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> JPG, PNG, PDF up to 5MB</li>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Legible &amp; within 6 months</li>
                  <li style={{ display: 'flex', gap: '8px' }}><FontAwesomeIcon icon={faCircleCheck} style={{ color: '#3D8A5C', width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} /> Must show Doctor Reg.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SEND MESSAGE FORM */}
        <section style={{ padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' }}>
          <div
            style={{
              background: 'rgba(13,34,24,0.60)',
              border: `1px solid ${T.border}`,
              borderRadius: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              overflow: 'hidden',
            }}
          >
            {/* Left side detail panel */}
            <div
              style={{
                background: 'rgba(10,26,16,0.95)',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '20px',
                borderRight: '1px solid rgba(61,138,92,0.15)',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: T.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                CONTACT US
              </span>
              <h3
                style={{
                  fontFamily: FONT.display,
                  fontSize: '2.2rem',
                  fontWeight: 600,
                  color: '#F5EDD6',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Send us a message
              </h3>
              <p style={{ color: T.muted, fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                We reply via WhatsApp or email within 24 hours. For urgent issues, WhatsApp is faster.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', color: '#7EC89A', fontSize: '0.85rem' }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ width: 16, height: 16 }} />
                <span>Your data is encrypted and secure</span>
              </div>
            </div>

            {/* Right side form input panel */}
            <form onSubmit={handleFormSubmit} style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                {/* Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="name" style={{ fontSize: '0.82rem', color: T.muted }}>NAME *</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    style={{
                      background: 'rgba(13,34,24,0.60)',
                      border: '1px solid rgba(61,138,92,0.22)',
                      color: '#F5EDD6',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Mobile */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="mobile" style={{ fontSize: '0.82rem', color: T.muted }}>MOBILE *</label>
                  <input
                    type="tel"
                    id="mobile"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value }))}
                    style={{
                      background: 'rgba(13,34,24,0.60)',
                      border: '1px solid rgba(61,138,92,0.22)',
                      color: '#F5EDD6',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="subject" style={{ fontSize: '0.82rem', color: T.muted }}>SUBJECT</label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                  style={{
                    background: 'rgba(13,34,24,0.80)',
                    border: '1px solid rgba(61,138,92,0.22)',
                    color: '#F5EDD6',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="Order Issue">Order Issue</option>
                  <option value="Prescription Help">Prescription Help</option>
                  <option value="Consultation Question">Consultation Question</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="message" style={{ fontSize: '0.82rem', color: T.muted }}>MESSAGE *</label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  style={{
                    background: 'rgba(13,34,24,0.60)',
                    border: '1px solid rgba(61,138,92,0.22)',
                    color: '#F5EDD6',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: T.muted }}>
                  Do not include any sensitive medical or financial information here.
                </span>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #C9922A, #E8A820)',
                  color: '#0A1A10',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 14px rgba(212, 137, 10, 0.2)',
                  marginTop: '8px',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                SEND MESSAGE
              </button>
            </form>
          </div>
        </section>
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
            <FontAwesomeIcon icon={faCircleCheck} style={{ color: '#7EC89A', width: 18, height: 18 }} />
            <span style={{ fontWeight: 600 }}>உங்கள் செய்தி வெற்றிகரமாக அனுப்பப்பட்டது!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileBottomNav />
      <CustomerFooter />
    </div>
  );
}
