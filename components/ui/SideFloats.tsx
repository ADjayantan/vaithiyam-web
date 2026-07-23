'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage, faGrip } from '@fortawesome/free-solid-svg-icons';
import { useLanguageStore } from '@/stores/languageStore';
import { useEffect, useState } from 'react';

export default function SideFloats() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('vt_language') as 'en' | 'ta';
    if (saved) {
      setLanguage(saved);
    }
  }, [setLanguage]);

  useEffect(() => {
    const handleBotState = (event: Event) => {
      const detail = (event as CustomEvent<{ isOpen?: unknown }>).detail;
      setIsBotOpen(detail?.isOpen === true);
    };
    window.addEventListener('agasthiyan-state', handleBotState);
    return () => window.removeEventListener('agasthiyan-state', handleBotState);
  }, []);

  // Customer-facing language toggle / "Browse Products" / AI assistant
  // shortcuts don't belong in the admin portal.
  if (!mounted || pathname?.startsWith('/admin')) return null;

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ta' : 'en';
    setLanguage(nextLang);
    localStorage.setItem('vt_language', nextLang);
  };

  const triggerBot = () => {
    window.dispatchEvent(new CustomEvent('toggle-agasthiyan'));
  };

  const navigateProducts = () => {
    router.push('/products');
  };

  return (
    <div
      className="vt-side-floats"
      aria-hidden={isBotOpen}
      style={{
        opacity: isBotOpen ? 0 : 1,
        visibility: isBotOpen ? 'hidden' : 'visible',
        pointerEvents: isBotOpen ? 'none' : 'auto',
        transition: 'opacity 0.15s ease',
      }}
    >
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
        id="agasthiyan-trigger"
        onClick={triggerBot}
        title={language === 'en' ? 'Agasthiyan AI' : 'அகஸ்தியன் AI'}
        aria-label={language === 'en' ? 'Agasthiyan AI' : 'அகஸ்தியன் AI'}
        aria-controls="agasthiyan-dialog"
        aria-expanded={isBotOpen}
        className="vt-float-btn"
      >
        {/* Custom Leaf + Sparkle SVG */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5EDD6" strokeWidth="2">
          <path d="M12 20c-4.4 0-8-3.6-8-8c0-5.4 7-10 8-10s8 4.6 8 10c0 4.4-3.6 8-8 8Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2c0 8-4 12-8 16" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 5.5l1.5.5.5 1.5.5-1.5 1.5-.5-1.5-.5-.5-1.5-.5 1.5z" fill="#E8A820" stroke="none" />
        </svg>
      </button>
    </div>
  );
}
