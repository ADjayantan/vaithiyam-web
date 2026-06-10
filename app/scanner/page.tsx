'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBarcode, faCamera, faCircleCheck, faCircleXmark,
  faMagnifyingGlass, faShieldHalved, faSpinner, faTriangleExclamation, faUpload, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { SeedMedicine } from '@/lib/medicineData';
import { CustomerFooter, CustomerHeader, MobileBottomNav } from '@/components/layout/CustomerShell';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/Button';

/* ── Tesseract type shim (loaded via CDN script) ──────────────────────────── */
declare global {
  interface Window {
    Tesseract?: {
      recognize(
        image: File | HTMLImageElement | string,
        lang: string,
        options?: { logger?: (m: { status: string; progress: number }) => void }
      ): Promise<{ data: { text: string } }>;
    };
  }
}

type OcrStatus = 'idle' | 'loading' | 'running' | 'done' | 'error';

function getToken(): string | null {
  try { return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token'); }
  catch { return null; }
}

export default function ScannerPage() {
  const [scriptReady, setScriptReady]   = useState(false);
  const [file, setFile]                 = useState<File | null>(null);
  const [preview, setPreview]           = useState('');
  const [ocrStatus, setOcrStatus]       = useState<OcrStatus>('idle');
  const [ocrProgress, setOcrProgress]   = useState(0);
  const [ocrText, setOcrText]           = useState('');
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState<SeedMedicine[]>([]);
  const [searched, setSearched]         = useState(false);
  const [searching, setSearching]       = useState(false);
  const [toast, setToast]               = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg); window.setTimeout(() => setToast(''), 2800);
  }, []);

  /* ── File selection → preview ────────────────────────────────── */
  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setOcrStatus('idle');
    setOcrText('');
    setResults([]);
    setSearched(false);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreview('');
    setOcrStatus('idle');
    setOcrText('');
    setQuery('');
    setResults([]);
    setSearched(false);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  /* ── Run OCR ────────────────────────────────────────────────── */
  const runOcr = useCallback(async () => {
    if (!file || !window.Tesseract) return;
    setOcrStatus('loading');
    setOcrProgress(0);
    setOcrText('');
    try {
      setOcrStatus('running');
      const result = await window.Tesseract.recognize(file, 'tam+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100));
        },
      });
      const text = result.data.text.trim();
      setOcrText(text);
      setOcrStatus('done');
      // Auto-extract first meaningful line as search query
      const firstLine = text.split('\n').find(l => l.trim().length > 3) ?? '';
      setQuery(firstLine.trim().slice(0, 80));
    } catch {
      setOcrStatus('error');
    }
  }, [file]);

  /* ── Product search ─────────────────────────────────────────── */
  const search = useCallback(async (q?: string) => {
    const term = (q ?? query).trim();
    if (term.length < 2) return;
    setSearching(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(term)}&limit=6`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({})) as { products?: SeedMedicine[] };
      setResults(data.products ?? []);
    } catch { setResults([]); }
    setSearched(true);
    setSearching(false);
  }, [query]);

  const addToCart = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) { showToast('Please login to add to cart.'); return; }
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, qty: 1 }),
      });
      if (!res.ok) throw new Error();
      showToast(`${product.nameTa} added to cart.`);
    } catch { showToast('Could not add to cart.'); }
  }, [showToast]);

  const addToWishlist = useCallback(async (product: SeedMedicine) => {
    const token = getToken();
    if (!token) {
      showToast('Please login to save wishlist items.');
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Could not add to wishlist.');
      showToast(data.message ?? 'Added to wishlist.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not add to wishlist.');
    }
  }, [showToast]);

  const canOcr  = file && scriptReady;
  const canSearch = query.trim().length >= 2;

  return (
    <>
      {/* Tesseract.js from CDN — loaded once, signals readiness */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js"
        onLoad={() => setScriptReady(true)}
        strategy="lazyOnload"
      />

      <div className="vt-page-shell">
        <CustomerHeader />

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="vt-hero" style={{ padding: '52px 0 40px' }}>
          <div className="vt-container" style={{ maxWidth: 720 }}>
            <p className="vt-hero-eyebrow">
              <FontAwesomeIcon icon={faBarcode} style={{ width: 14 }} aria-hidden />
              MEDICINE LABEL SCANNER
            </p>
            <h1 className="vt-hero-h1" style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)' }}>
              மருந்து லேபிள் <span className="vt-hero-h1-accent">ஸ்கேனர்</span>
            </h1>
            <p className="vt-hero-copy">
              Upload a photo of any medicine label. Tesseract.js reads the text directly in your browser — nothing is sent to a server — and searches our catalogue automatically.
            </p>
          </div>
        </section>

        <main>
          <section className="vt-section" style={{ background: 'var(--vt-card)' }}>
            <div className="vt-container" style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

              {/* ── Upload panel ──────────────────────────────── */}
              <div className="vt-card" style={{ padding: 22, display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ display: 'grid', width: 44, height: 44, placeItems: 'center', borderRadius: 14, background: 'var(--vt-gold-100)', color: 'var(--vt-gold-700)', flexShrink: 0 }}>
                    <FontAwesomeIcon icon={faCamera} style={{ width: 20 }} />
                  </span>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1.12rem', fontWeight: 800 }}>Upload label image</h2>
                    <p className="vt-muted" style={{ margin: '2px 0 0', fontSize: 'var(--vt-text-xs)' }}>JPG, PNG or HEIC · Processed locally in your browser</p>
                  </div>
                </div>

                {/* Drop zone / preview */}
                {preview ? (
                  <div style={{ position: 'relative', borderRadius: 'var(--vt-radius-md)', overflow: 'hidden', border: '1px solid var(--vt-border)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Label preview" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block', background: '#f5f5f5' }} />
                    <button
                      onClick={clearFile}
                      style={{ position: 'absolute', top: 8, right: 8, display: 'grid', width: 28, height: 28, placeItems: 'center', borderRadius: 999, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', color: '#fff' }}
                      aria-label="Remove image"
                    >
                      <FontAwesomeIcon icon={faXmark} style={{ width: 13 }} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{ display: 'grid', placeItems: 'center', gap: 10, padding: 28, cursor: 'pointer', textAlign: 'center', border: '2px dashed var(--vt-border)', borderRadius: 'var(--vt-radius-md)', background: 'var(--vt-cream-100)', transition: 'border-color 160ms' }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
                  >
                    <FontAwesomeIcon icon={faUpload} style={{ width: 36, height: 36, color: 'var(--vt-gold-500)' }} />
                    <strong style={{ fontFamily: 'var(--vt-font-body)', fontWeight: 700 }}>Choose or drag an image here</strong>
                    <span className="vt-muted" style={{ fontSize: 'var(--vt-text-xs)' }}>Camera photos work best. Hold phone flat above label.</span>
                    <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={e => handleFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                  </label>
                )}

                {/* OCR button + status */}
                <div style={{ display: 'grid', gap: 10 }}>
                  <Button
                    variant="gold"
                    onClick={runOcr}
                    disabled={!canOcr || ocrStatus === 'running' || ocrStatus === 'loading'}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {ocrStatus === 'running' || ocrStatus === 'loading' ? (
                      <><FontAwesomeIcon icon={faSpinner} style={{ width: 15, animation: 'spin 1s linear infinite' }} /> Reading label… {ocrProgress > 0 ? `${ocrProgress}%` : ''}</>
                    ) : (
                      <><FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 15 }} /> Read label with OCR</>
                    )}
                  </Button>
                  {!scriptReady && (
                    <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', color: 'var(--vt-muted)', textAlign: 'center' }}>
                      <FontAwesomeIcon icon={faSpinner} style={{ width: 11, animation: 'spin 1s linear infinite', marginRight: 5 }} />
                      Loading OCR engine…
                    </p>
                  )}
                </div>

                {/* OCR result */}
                {ocrStatus === 'done' && ocrText && (
                  <div style={{ padding: 12, borderRadius: 12, background: 'var(--vt-emerald-100)', border: '1px solid rgba(27,138,88,.22)' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 'var(--vt-text-xs)', fontWeight: 700, color: 'var(--vt-emerald-600)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                      <FontAwesomeIcon icon={faCircleCheck} style={{ width: 11, marginRight: 5 }} />
                      Text extracted
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', color: 'var(--vt-ink-80)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto' }}>
                      {ocrText}
                    </p>
                  </div>
                )}
                {ocrStatus === 'error' && (
                  <div style={{ padding: 12, borderRadius: 12, background: 'var(--vt-danger-bg)', border: '1px solid rgba(179,58,40,.2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <FontAwesomeIcon icon={faCircleXmark} style={{ width: 15, color: 'var(--vt-danger-text)', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', color: 'var(--vt-danger-text)', lineHeight: 1.5 }}>
                      Could not read the label. Try a clearer photo with better lighting, or type the medicine name below.
                    </p>
                  </div>
                )}

                {/* Safety note */}
                <div className="vt-safe-note">
                  <FontAwesomeIcon icon={faShieldHalved} style={{ width: 16, flexShrink: 0, color: 'var(--vt-emerald-600)' }} />
                  <span>Scanner results are not medical advice. All processing happens in your browser — no image is uploaded to our servers.</span>
                </div>
              </div>

              {/* ── Search panel ──────────────────────────────── */}
              <div className="vt-card" style={{ padding: 22, display: 'grid', gap: 16, alignContent: 'start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ display: 'grid', width: 44, height: 44, placeItems: 'center', borderRadius: 14, background: 'var(--vt-emerald-100)', color: 'var(--vt-emerald-600)', flexShrink: 0 }}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 20 }} />
                  </span>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1.12rem', fontWeight: 800 }}>Search catalogue</h2>
                    <p className="vt-muted" style={{ margin: '2px 0 0', fontSize: 'var(--vt-text-xs)' }}>Auto-filled from OCR — or type manually</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, color: 'var(--vt-muted)' }} aria-hidden />
                    <input
                      className="vt-input"
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && search()}
                      placeholder="Medicine name in Tamil or English"
                      style={{ height: 48, paddingLeft: 42 }}
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => search()}
                    disabled={!canSearch || searching}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {searching ? (
                      <><FontAwesomeIcon icon={faSpinner} style={{ width: 15, animation: 'spin 1s linear infinite' }} /> Searching…</>
                    ) : (
                      <><FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 15 }} /> Search medicines</>
                    )}
                  </Button>
                </div>

                {/* Tips */}
                {!searched && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 'var(--vt-text-xs)', fontWeight: 700, color: 'var(--vt-muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Tips for best OCR results</p>
                    {[
                      'Use good lighting — natural light works best',
                      'Hold camera flat above the label, avoid angles',
                      'Printed labels scan better than handwritten',
                      'If OCR fails, type the name manually above',
                    ].map(tip => (
                      <div key={tip} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 'var(--vt-text-sm)', color: 'var(--vt-ink-80)' }}>
                        <FontAwesomeIcon icon={faCircleCheck} style={{ width: 12, color: 'var(--vt-emerald-600)', flexShrink: 0, marginTop: 3 }} />
                        {tip}
                      </div>
                    ))}
                  </div>
                )}

                {/* Results */}
                {searched && !searching && (
                  results.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', display: 'grid', gap: 8 }}>
                      <FontAwesomeIcon icon={faTriangleExclamation} style={{ width: 32, height: 32, color: 'var(--vt-gold-500)', margin: '0 auto' }} />
                      <p style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontWeight: 700, color: 'var(--vt-forest-900)' }}>No products found</p>
                      <p className="vt-muted" style={{ margin: 0, fontSize: 'var(--vt-text-sm)' }}>Try a different spelling or the English name.</p>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 'var(--vt-text-sm)', fontWeight: 700, color: 'var(--vt-emerald-600)' }}>
                      <FontAwesomeIcon icon={faCircleCheck} style={{ width: 13, marginRight: 5 }} />
                      {results.length} product{results.length !== 1 ? 's' : ''} found
                    </p>
                  )
                )}
              </div>
            </div>
          </section>

          {/* ── Results grid ─────────────────────────────────── */}
          {results.length > 0 && (
            <section className="vt-section" style={{ paddingTop: 8 }}>
              <div className="vt-container">
                <h2 style={{ fontFamily: 'var(--vt-font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--vt-forest-900)', margin: '0 0 16px', letterSpacing: 0 }}>
                  Search results for &ldquo;{query}&rdquo;
                </h2>
                <div className="vt-grid">
                  {results.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} onWishlist={addToWishlist} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        <CustomerFooter />
        <MobileBottomNav />

        {toast && (
          <div role="status" className="vt-toast vt-toast-success" style={{ position: 'fixed', left: '50%', bottom: 94, zIndex: 150, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            {toast}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
