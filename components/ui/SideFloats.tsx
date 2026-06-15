'use client';

import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faLanguage, faGrip, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useLanguageStore } from '@/stores/languageStore';
import { useEffect, useState } from 'react';

export default function SideFloats() {
  const router = useRouter();
  const { language, setLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('vt_language') as 'en' | 'ta';
    if (saved) {
      setLanguage(saved);
    }
  }, [setLanguage]);

  if (!mounted) return null;

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ta' : 'en';
    setLanguage(nextLang);
    localStorage.setItem('vt_language', nextLang);
  };

  const triggerBot = () => {
    window.dispatchEvent(new CustomEvent('open-agasthiyan'));
  };

  const navigateProducts = () => {
    router.push('/products');
  };

  return (
    <div className="vt-side-floats">
      {language === 'en' ? (
        /* English mode: single settings sliders button */
        <button
          onClick={toggleLanguage}
          title="Switch to Tamil"
          aria-label="Switch to Tamil"
          className="vt-float-btn"
        >
          <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18 }} />
        </button>
      ) : (
        /* Tamil mode: three stacked buttons */
        <>
          <button
            onClick={toggleLanguage}
            title="Switch to English"
            aria-label="Switch to English"
            className="vt-float-btn"
          >
            <FontAwesomeIcon icon={faLanguage} style={{ width: 20, height: 20 }} />
          </button>
          <button
            onClick={navigateProducts}
            title="உலாவுக"
            aria-label="உலாவுக"
            className="vt-float-btn"
          >
            <FontAwesomeIcon icon={faGrip} style={{ width: 18, height: 18 }} />
          </button>
          <button
            onClick={triggerBot}
            title="அகஸ்தியன் AI"
            aria-label="அகஸ்தியன் AI"
            style={{
              background: 'linear-gradient(135deg, #4A154B, #6B1D70)',
              color: '#fff',
              border: '1px solid rgba(107, 29, 112, 0.4)',
            }}
            className="vt-float-btn"
          >
            <FontAwesomeIcon icon={faRobot} style={{ width: 18, height: 18 }} />
          </button>
        </>
      )}
    </div>
  );
}
