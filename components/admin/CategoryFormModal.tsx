'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import type { MedicineCategory } from '@/lib/medicineData';

interface CategoryFormModalProps {
  initialData?: MedicineCategory;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryFormModal({ initialData, onClose, onSuccess }: CategoryFormModalProps) {
  const [nameTa, setNameTa] = useState(initialData?.nameTa || '');
  const [nameEn, setNameEn] = useState(initialData?.nameEn || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [icon, setIcon] = useState(initialData?.icon || 'Leaf');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nameTa || !nameEn || !slug) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setSaving(true);

    const token = localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
    const isEdit = !!initialData;
    const url = '/api/admin/categories';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: initialData?.id,
          nameTa,
          nameEn,
          slug,
          icon,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save category');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving category');
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
        width: 'min(480px, 95vw)',
        padding: 28,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--vt-font-display)', color: 'var(--vt-cream-50)' }}>
            {initialData ? 'Edit Category' : 'Add New Category'}
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
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
              Tamil Name (தமிழ் பெயர்) <span style={{ color: '#FF8878' }}>*</span>
            </label>
            <input
              className="vt-input"
              type="text"
              value={nameTa}
              onChange={(e) => setNameTa(e.target.value)}
              placeholder="எ.கா. செரிமான பராமரிப்பு"
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
              placeholder="e.g. Digestive Care"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
              Slug Identifier <span style={{ color: '#FF8878' }}>*</span>
            </label>
            <input
              className="vt-input"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
              placeholder="e.g. digestive-care"
              required
              disabled={!!initialData}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(236,255,248,0.6)', marginBottom: 6, fontWeight: 600 }}>
              Symbol / Emoji <span style={{ color: '#FF8878' }}>*</span>
            </label>
            <input
              className="vt-input"
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g. 🍃, 🍏, 🦷"
              required
            />
          </div>

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
              disabled={saving}
              style={{
                borderRadius: 10,
                padding: '10px 28px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.65 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
