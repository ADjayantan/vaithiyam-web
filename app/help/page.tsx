'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown, faChevronUp, faEnvelope, faHeadphones,
  faPhone, faShieldHalved, faTruck, faRotate,
  faFileArrowUp, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';

const FAQS = [
  { q: 'How do I order a prescription medicine?', a: 'Go to the product page and tap "Add to cart". During checkout you will be prompted to upload a prescription. Our licensed pharmacist reviews it within 2–4 hours before dispatch.' },
  { q: 'What delivery options are available?', a: 'Standard delivery (3–5 days) is free for orders above ₹499. Express delivery in Coimbatore city is available within 4 hours for ₹49. Pan-India delivery is available.' },
  { q: 'Can I return a medicine I ordered?', a: 'Medicines can be returned within 7 days if they are unopened, sealed, and not temperature-sensitive. Prescription medicines cannot be returned once approved. Contact support with your order ID.' },
  { q: 'How do I track my order?', a: 'Go to "My Orders" in your account, or use "Track Order" in the header. You will also receive SMS updates at each delivery stage.' },
  { q: 'Is the product information on Vaithiyam medical advice?', a: 'No. All product information is educational only. It describes traditional uses and should not be used for self-diagnosis or self-medication. Always consult a qualified doctor or pharmacist.' },
  { q: 'Are the medicines authentic and genuine?', a: 'Yes. Every product is sourced from licensed manufacturers and verified by our team. We stock only AYUSH-compliant and FSSAI-registered products.' },
  { q: 'I forgot my password. How do I reset it?', a: 'Click "Forgot password" on the login page, enter your registered mobile number, and verify the OTP you receive. You can then set a new password.' },
  { q: 'My payment failed but money was deducted. What do I do?', a: 'Failed payment refunds are processed automatically within 5–7 working days. If not received after 7 days, contact support with your order ID and payment screenshot.' },
  { q: 'Can I cancel or change my order?', a: 'Orders can be cancelled within 30 minutes of placing them, before pharmacist review begins. Go to "My Orders" → select order → "Cancel order". After that, cancellation may not be possible.' },
  { q: 'How do I upload a prescription?', a: 'Upload at checkout or via the Prescriptions page. Accepted formats: JPG, PNG, PDF up to 5MB. The prescription must be legible, recent (within 6 months), and include the doctor\'s name and registration number.' },
];

const POLICIES = [
  {
    icon: faTruck, title: 'Shipping',
    points: ['Free delivery on orders ₹499+', 'Standard: 3–5 business days pan-India', 'Express (Coimbatore): 4 hours, ₹49', 'Orders before 2 PM dispatched same day'],
  },
  {
    icon: faRotate, title: 'Returns',
    points: ['7-day return window for unopened items', 'Prescription medicines non-returnable after approval', 'Refund processed in 5–7 working days', 'Contact support with order ID to initiate'],
  },
  {
    icon: faShieldHalved, title: 'Prescriptions',
    points: ['Rx items require valid prescription', 'Pharmacist review within 2–4 hours', 'Invalid prescription = order on hold', 'Prescriptions stored securely, never shared'],
  },
  {
    icon: faFileArrowUp, title: 'Upload Guidelines',
    points: ['Accepted: JPG, PNG, PDF up to 5MB', 'Must be legible and within 6 months', 'Must include doctor name & registration', 'Patient name must match your account'],
  },
];

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', mobile: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim() || !form.mobile.trim() || !form.message.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitted(true);
    setSubmitting(false);
  }, [form]);

  return (
    <div className="vt-page-shell">
      <CustomerHeader />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="vt-hero" style={{ padding: '56px 0 44px' }}>
        <div className="vt-container" style={{ maxWidth: 720 }}>
          <p className="vt-hero-eyebrow">
            <FontAwesomeIcon icon={faHeadphones} style={{ width: 14 }} aria-hidden />
            HELP &amp; SUPPORT
          </p>
          <h1 className="vt-hero-h1" style={{ fontSize: 'clamp(1.9rem,5vw,3.2rem)' }}>
            உதவி மற்றும் ஆதரவு
          </h1>
          <p className="vt-hero-copy" style={{ marginBottom: 22 }}>
            Available every day 9 AM – 9 PM. WhatsApp is the fastest channel for order issues.
          </p>
          <a
            href="https://wa.me/918800000000?text=Hello%20Vaithiyam%2C%20I%20need%20help."
            target="_blank" rel="noopener noreferrer"
            className="vt-button"
            style={{ width: 'fit-content', background: '#25D366', color: '#fff', border: 'none', fontFamily: 'var(--vt-font-body)', fontWeight: 700, fontSize: '1rem', gap: 10 }}
          >
            <FontAwesomeIcon icon={faWhatsapp} style={{ width: 20, height: 20 }} />
            Chat on WhatsApp
          </a>
        </div>
      </section>

      {/* ── Quick contact bar ─────────────────────────────────────── */}
      <div style={{ background: 'var(--vt-cream-100)', borderBottom: '1px solid var(--vt-border)' }}>
        <div className="vt-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          {[
            { icon: faPhone,    label: 'Phone',    value: '+91 88000 00000',        sub: 'Mon–Sun 9 AM – 9 PM' },
            { icon: faEnvelope, label: 'Email',    value: 'support@vaithiyam.in',   sub: 'Reply within 24 hours' },
            { icon: faWhatsapp, label: 'WhatsApp', value: '+91 88000 00000',         sub: 'Fastest response' },
          ].map(({ icon, label, value, sub }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderRight: '1px solid var(--vt-border)' }}>
              <span style={{ display: 'grid', width: 38, height: 38, placeItems: 'center', borderRadius: 10, background: 'var(--vt-emerald-100)', color: 'var(--vt-emerald-600)', flexShrink: 0 }}>
                <FontAwesomeIcon icon={icon} style={{ width: 16 }} />
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', fontWeight: 700, color: 'var(--vt-muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink)' }}>{value}</p>
                <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main>
        {/* ── FAQ Accordion ─────────────────────────────────────── */}
        <section className="vt-section" style={{ background: 'var(--vt-card)' }}>
          <div className="vt-container" style={{ maxWidth: 760 }}>
            <p className="vt-eyebrow-label">FAQ</p>
            <h2 style={{ fontFamily: 'var(--vt-font-display)', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, margin: '0 0 24px', color: 'var(--vt-forest-900)', letterSpacing: 0 }}>
              அடிக்கடி கேட்கப்படும் கேள்விகள்
            </h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {FAQS.map((item, i) => {
                const open = openIdx === i;
                return (
                  <div key={i} style={{ border: `1px solid ${open ? 'var(--vt-emerald-600)' : 'var(--vt-border)'}`, borderRadius: 'var(--vt-radius-md)', background: open ? 'var(--vt-cream-100)' : 'var(--vt-card)', overflow: 'hidden', transition: 'border-color 160ms' }}>
                    <button
                      onClick={() => setOpenIdx(open ? null : i)}
                      aria-expanded={open}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '15px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontFamily: 'var(--vt-font-body)', fontSize: 'var(--vt-text-base)', fontWeight: 700, color: open ? 'var(--vt-emerald-600)' : 'var(--vt-forest-900)', lineHeight: 1.4 }}>{item.q}</span>
                      <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} style={{ width: 13, color: 'var(--vt-muted)', flexShrink: 0 }} />
                    </button>
                    {open && <p style={{ margin: '0 18px 16px', fontSize: 'var(--vt-text-sm)', color: 'var(--vt-ink-80)', lineHeight: 1.7 }}>{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Policies ─────────────────────────────────────────── */}
        <section className="vt-section" style={{ background: 'var(--vt-cream-100)' }}>
          <div className="vt-container">
            <p className="vt-eyebrow-label">POLICIES</p>
            <h2 style={{ fontFamily: 'var(--vt-font-display)', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, margin: '0 0 24px', color: 'var(--vt-forest-900)', letterSpacing: 0 }}>
              Shipping &amp; Returns at a glance
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {POLICIES.map(({ icon, title, points }) => (
                <div key={title} className="vt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'grid', width: 40, height: 40, placeItems: 'center', borderRadius: 12, background: 'var(--vt-emerald-100)', color: 'var(--vt-emerald-600)' }}>
                      <FontAwesomeIcon icon={icon} style={{ width: 17 }} />
                    </span>
                    <h3 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: 'var(--vt-text-lg)', color: 'var(--vt-forest-900)' }}>{title}</h3>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
                    {points.map(pt => (
                      <li key={pt} style={{ display: 'flex', gap: 8, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-ink-80)', lineHeight: 1.5 }}>
                        <FontAwesomeIcon icon={faCircleCheck} style={{ width: 12, color: 'var(--vt-emerald-600)', marginTop: 3, flexShrink: 0 }} />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/returns" className="vt-see-all">Full Returns Policy →</Link>
              <Link href="/privacy"  className="vt-see-all">Privacy Policy →</Link>
              <Link href="/terms"    className="vt-see-all">Terms of Use →</Link>
            </div>
          </div>
        </section>

        {/* ── Contact form ─────────────────────────────────────── */}
        <section className="vt-section" style={{ background: 'var(--vt-card)' }}>
          <div className="vt-container" style={{ maxWidth: 580 }}>
            <p className="vt-eyebrow-label">CONTACT US</p>
            <h2 style={{ fontFamily: 'var(--vt-font-display)', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, margin: '0 0 6px', color: 'var(--vt-forest-900)', letterSpacing: 0 }}>
              Send us a message
            </h2>
            <p style={{ margin: '0 0 22px', color: 'var(--vt-muted)', fontSize: 'var(--vt-text-sm)' }}>
              We reply via WhatsApp or email within 24 hours. For urgent issues WhatsApp is faster.
            </p>

            {submitted ? (
              <div style={{ padding: 28, borderRadius: 'var(--vt-radius-lg)', border: '2px solid var(--vt-emerald-600)', background: 'var(--vt-cream-100)', textAlign: 'center', display: 'grid', gap: 10 }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ width: 40, height: 40, color: 'var(--vt-emerald-600)', margin: '0 auto' }} />
                <h3 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', color: 'var(--vt-forest-900)' }}>Message sent!</h3>
                <p style={{ margin: 0, color: 'var(--vt-muted)', fontSize: 'var(--vt-text-sm)' }}>We will get back to you within 24 hours. For faster help, WhatsApp us.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {([['name','Name *','Your full name','text'],['mobile','Mobile *','10-digit number','tel']] as const).map(([f,label,ph,type]) => (
                    <label key={f} style={{ display: 'grid', gap: 6, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)' }}>
                      {label}
                      <input type={type} className="vt-input" placeholder={ph} value={form[f as keyof typeof form]} onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))} style={{ height: 44 }} />
                    </label>
                  ))}
                </div>
                <label style={{ display: 'grid', gap: 6, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)' }}>
                  Subject
                  <select className="vt-select" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                    <option value="">Select a topic</option>
                    {['Order issue','Prescription query','Payment or refund','Product information','Delivery status','Returns','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-ink-80)' }}>
                  Message *
                  <textarea
                    className="vt-input"
                    placeholder="Describe your issue. Include your Order ID if relevant."
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    style={{ resize: 'vertical', padding: '10px 14px', fontFamily: 'var(--vt-font-body)', fontSize: 'var(--vt-text-sm)', borderRadius: 'var(--vt-radius-sm)', border: '1px solid var(--vt-border)', outline: 'none', lineHeight: 1.6 }}
                  />
                </label>
                {formError && <p role="alert" style={{ margin: 0, color: 'var(--vt-danger-text)', fontSize: 'var(--vt-text-sm)' }}>{formError}</p>}
                <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)' }}>Do not include sensitive medical information or prescription details in this form.</p>
                <button onClick={handleSubmit} disabled={submitting} className="vt-button"
                  style={{ background: 'linear-gradient(135deg,var(--vt-emerald-600),var(--vt-teal-500))', color: '#fff', border: 'none', width: 'fit-content', opacity: submitting ? 0.65 : 1 }}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ width: 15 }} />
                  {submitting ? 'Sending…' : 'Send message'}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <CustomerFooter />
      <MobileBottomNav />
    </div>
  );
}
