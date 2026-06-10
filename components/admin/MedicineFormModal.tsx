'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';
import { MEDICINE_CATEGORIES } from '@/lib/medicineData';

interface MedicineFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function MedicineFormModal({ onClose, onSuccess }: MedicineFormModalProps) {
  const [nameTa, setNameTa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categorySlug, setCategorySlug] = useState('digestive-care');
  const [tradition, setTradition] = useState<'siddha' | 'ayurveda' | 'natural'>('siddha');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [inStock, setInStock] = useState(true);
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [overview, setOverview] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [generalUses, setGeneralUses] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');

  // UI States
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WEBP files are allowed');
      return;
    }

    setError('');
    setUploading(true);

    const token = localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
    const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod_${Date.now()}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);

    try {
      const res = await fetch('/api/admin/medicines/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Image upload failed');
      }

      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nameTa || !nameEn || !price || !mrp || !stockCount) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setSaving(true);

    const token = localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');

    try {
      const res = await fetch('/api/admin/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameTa,
          nameEn,
          categorySlug,
          tradition,
          price: Number(price),
          mrp: Number(mrp),
          stockCount: Number(stockCount),
          inStock,
          prescriptionRequired,
          imageUrl,
          overview,
          ingredients,
          generalUses,
          safetyNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save product');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="vt-admin-card" style={{
        background: 'rgba(10,20,15,0.96)',
        border: '1px solid rgba(61,138,92,0.22)',
        borderRadius: 16,
        width: 'min(640px, 95vw)',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-cream-50)' }}>
            Add New Medicine
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(236,255,248,0.5)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: 4,
            }}
          >
            <FontAwesomeIcon icon={faTimes} style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(212,60,40,0.15)',
            border: '1px solid rgba(212,60,40,0.3)',
            color: '#FF8878',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
          {/* Row 1: Names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
                Tamil Name (தமிழ் பெயர்) <span style={{ color: '#FF8878' }}>*</span>
              </label>
              <input
                className="vt-input"
                type="text"
                value={nameTa}
                onChange={(e) => setNameTa(e.target.value)}
                placeholder="எ.கா. திரிபலா சூரணம்"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
                English Name <span style={{ color: '#FF8878' }}>*</span>
              </label>
              <input
                className="vt-input"
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Triphala Churnam"
                required
              />
            </div>
          </div>

          {/* Row 2: Category & Tradition */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
                Category <span style={{ color: '#FF8878' }}>*</span>
              </label>
              <select
                className="vt-select"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
              >
                {MEDICINE_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.nameEn} ({cat.nameTa})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
                Tradition <span style={{ color: '#FF8878' }}>*</span>
              </label>
              <select
                className="vt-select"
                value={tradition}
                onChange={(e) => setTradition(e.target.value as 'siddha' | 'ayurveda' | 'natural')}
              >
                <option value="siddha">Siddha (சித்தம்)</option>
                <option value="ayurveda">Ayurveda (ஆயுர்வேதம்)</option>
                <option value="natural">Natural (இயற்கை நலம்)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Price, MRP, Stock Count */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
                Price (₹) <span style={{ color: '#FF8878' }}>*</span>
              </label>
              <input
                className="vt-input"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="180"
                min="0"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
                MRP (₹) <span style={{ color: '#FF8878' }}>*</span>
              </label>
              <input
                className="vt-input"
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="220"
                min="0"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
                Stock Count <span style={{ color: '#FF8878' }}>*</span>
              </label>
              <input
                className="vt-input"
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                placeholder="50"
                min="0"
                required
              />
            </div>
          </div>

          {/* Row 4: Photo upload with cropped preview */}
          <div style={{ border: '1px dashed rgba(61,138,92,0.3)', borderRadius: 10, padding: 16, background: 'rgba(255,255,255,0.02)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--vt-gold-300)', marginBottom: 10, fontWeight: 600 }}>
              Product Photo Upload
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {/* Cropped 1:1 image preview container matching the card design */}
              <div style={{
                width: 120,
                height: 120,
                aspectRatio: '1/1',
                overflow: 'hidden',
                borderRadius: 12,
                border: '1px solid rgba(61,138,92,0.22)',
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}>
                {imageUrl ? (
                  <img src={imageUrl} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'rgba(236,255,248,0.3)', textAlign: 'center', padding: 8 }}>
                    No image
                  </span>
                )}
              </div>

              {/* Upload Input & button */}
              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--vt-cream-50)',
                  border: '1px solid rgba(61,138,92,0.22)',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}>
                  <FontAwesomeIcon icon={faUpload} style={{ width: 14, height: 14 }} />
                  {uploading ? 'Uploading...' : 'Choose Photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ fontSize: '0.72rem', color: 'rgba(236,255,248,0.4)' }}>
                  JPEG, PNG, or WEBP. Max size 2MB.
                </span>
                {imageUrl && (
                  <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>
                    ✓ Uploaded successfully!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 5: Switches / Toggles */}
          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--vt-emerald-600)' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'rgba(236,255,248,0.8)', fontWeight: 600 }}>In Stock (விற்பனைக்கு உள்ளது)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={prescriptionRequired}
                onChange={(e) => setPrescriptionRequired(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--vt-emerald-600)' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'rgba(236,255,248,0.8)', fontWeight: 600 }}>Prescription Required (Rx)</span>
            </label>
          </div>

          {/* Row 6: Overview & Ingredients */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
              Overview
            </label>
            <textarea
              className="vt-input"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Provide a general product overview..."
              style={{ height: 90, padding: '10px 14px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
              Ingredients
            </label>
            <textarea
              className="vt-input"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g. Pure Amla root powder..."
              style={{ height: 80, padding: '10px 14px', resize: 'vertical' }}
            />
          </div>

          {/* Row 7: Uses & Safety Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
              General Uses
            </label>
            <textarea
              className="vt-input"
              value={generalUses}
              onChange={(e) => setGeneralUses(e.target.value)}
              placeholder="Daily wellness use cases..."
              style={{ height: 80, padding: '10px 14px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
              Safety Notes
            </label>
            <textarea
              className="vt-input"
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              placeholder="e.g. Consult doctor before use..."
              style={{ height: 80, padding: '10px 14px', resize: 'vertical' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18 }}>
            <button
              className="vt-button"
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--vt-cream-50)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '10px 24px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              className="vt-button vt-button-gold"
              type="submit"
              disabled={saving || uploading}
              style={{
                borderRadius: 10,
                padding: '10px 28px',
                fontWeight: 700,
                cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
                opacity: (saving || uploading) ? 0.65 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
