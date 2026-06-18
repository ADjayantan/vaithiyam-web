'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faLanguage, faGrip, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useLanguageStore } from '@/stores/languageStore';
import { useEffect, useState } from 'react';

export default function SideFloats() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('vt_language') as 'en' | 'ta';
    if (saved) {
      setLanguage(saved);
    }
  }, [setLanguage]);

  // Customer-facing language toggle / "Browse Products" / AI assistant
  // shortcuts don't belong in the admin portal.
  if (!mounted || pathname?.startsWith('/admin')) return null;

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
      <button
        onClick={toggleLanguage}
        title={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
        aria-label={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
        className="vt-float-btn"
      >
        <FontAwesomeIcon icon={faLanguage} style={{ width: 20, height: 20 }} />
      </button>
      <button
        onClick={navigateProducts}
        title={language === 'en' ? 'Browse Products' : 'உலாவுக'}
        aria-label={language === 'en' ? 'Browse Products' : 'உலாவுக'}
        className="vt-float-btn"
      >
        <FontAwesomeIcon icon={faGrip} style={{ width: 18, height: 18 }} />
      </button>
      <button
        onClick={triggerBot}
        title={language === 'en' ? 'Agasthiyan AI' : 'அகஸ்தியன் AI'}
        aria-label={language === 'en' ? 'Agasthiyan AI' : 'அகஸ்தியன் AI'}
        style={{
          background: 'linear-gradient(135deg, #4A154B, #6B1D70)',
          color: '#fff',
          border: '1px solid rgba(107, 29, 112, 0.4)',
        }}
        className="vt-float-btn"
      >
        <FontAwesomeIcon icon={faRobot} style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}
