'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLanguageStore } from '@/stores/languageStore';

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_MESSAGE_CHARS = 1_200;
const MAX_HISTORY_MESSAGES = 8;

function greeting(language: 'ta' | 'en'): string {
  return language === 'ta'
    ? 'வணக்கம்! நான் அகஸ்தியன் AI. கடை பட்டியலில் உள்ள தயாரிப்புகள், பொருட்கள் மற்றும் இருப்பு தகவல்களை விளக்க உதவுகிறேன். மருத்துவ ஆலோசனை வழங்க மாட்டேன்.'
    : 'Hello! I am Agasthiyan AI. I can explain products, ingredients, and availability listed in the store catalogue. I do not provide medical advice.';
}

export default function AgasthiyanWidget() {
  const pathname = usePathname();
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: greeting('ta'),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef('');

  useEffect(() => {
    setMounted(true);
    const existing = sessionStorage.getItem('agasthiyan_session_id');
    const sessionId = existing && /^[A-Za-z0-9_-]{16,128}$/.test(existing)
      ? existing
      : crypto.randomUUID();
    sessionStorage.setItem('agasthiyan_session_id', sessionId);
    sessionIdRef.current = sessionId;
  }, []);

  const currentLang = mounted ? language : 'ta';

  // Update initial greeting dynamically if chat has not started yet
  useEffect(() => {
    if (!mounted) return;
    setMessages((current) => (
      current.length === 1 && current[0].role === 'assistant'
        ? [{ role: 'assistant', content: greeting(currentLang) }]
        : current
    ));
  }, [currentLang, mounted]);

  // Responsive state detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOpenWidget = () => {
      setIsOpen(true);
    };
    const handleToggleWidget = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener('open-agasthiyan', handleOpenWidget);
    window.addEventListener('toggle-agasthiyan', handleToggleWidget);
    return () => {
      window.removeEventListener('open-agasthiyan', handleOpenWidget);
      window.removeEventListener('toggle-agasthiyan', handleToggleWidget);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('agasthiyan-state', { detail: { isOpen } }));
    if (isOpen) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        window.requestAnimationFrame(() => {
          document.getElementById('agasthiyan-trigger')?.focus();
        });
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const closeChat = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById('agasthiyan-trigger')?.focus();
    });
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: greeting(currentLang) }]);
    setInputVal('');
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userMsg = inputVal.trim();
    setInputVal('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch('/api/agasthiyan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-MAX_HISTORY_MESSAGES),
          language: currentLang,
          sessionId: sessionIdRef.current || undefined,
        }),
        signal: controller.signal,
      });

      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code =
          typeof data === 'object'
          && data !== null
          && 'code' in data
          && typeof data.code === 'string'
            ? data.code
            : 'AI_UNAVAILABLE';
        throw new Error(code);
      }

      if (
        typeof data !== 'object'
        || data === null
        || !('reply' in data)
        || typeof data.reply !== 'string'
      ) {
        throw new Error('AI_UNAVAILABLE');
      }

      const reply = data.reply;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : 'AI_UNAVAILABLE';
      if (errorCode !== 'AI_NOT_CONFIGURED' && errorCode !== 'RATE_LIMITED') {
        console.warn('Agasthiyan request was unavailable.');
      }
      const errorMessage = errorCode === 'RATE_LIMITED'
        ? (currentLang === 'ta'
          ? 'சற்று அதிகமான கேள்விகள் அனுப்பப்பட்டுள்ளன. ஒரு நிமிடம் கழித்து மீண்டும் முயலவும்.'
          : 'Too many messages were sent. Please try again in a minute.')
        : errorCode === 'AI_NOT_CONFIGURED'
          ? (currentLang === 'ta'
            ? 'AI உதவியாளர் இன்னும் அமைக்கப்படவில்லை. தயவுசெய்து பின்னர் முயலவும்.'
            : 'The AI assistant is not configured yet. Please try again later.')
          : (currentLang === 'ta'
            ? 'மன்னிக்கவும், AI உதவியாளர் தற்போது பதிலளிக்க முடியவில்லை. சிறிது நேரம் கழித்து முயலவும்.'
            : 'Sorry, the AI assistant cannot respond right now. Please try again later.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ]);
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  // The customer-facing AI shopping assistant has no place in the admin
  // portal — it floats over dashboard panels and tables there.
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="agasthiyan-dialog"
            role="dialog"
            aria-labelledby="agasthiyan-title"
            aria-describedby="agasthiyan-safety-note"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 'calc(84px + env(safe-area-inset-bottom, 0px))' : '190px',
              right: '20px',
              width: isMobile ? 'calc(100vw - 32px)' : '340px',
              height: '480px',
              background: 'rgba(7, 20, 17, 0.96)',
              border: '1px solid rgba(61, 138, 92, 0.28)',
              borderRadius: '20px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
              zIndex: 130,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid rgba(61, 138, 92, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(13, 34, 24, 0.50)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2">
                  <path d="M12 20c-4.4 0-8-3.6-8-8c0-5.4 7-10 8-10s8 4.6 8 10c0 4.4-3.6 8-8 8Z" />
                </svg>
                <span id="agasthiyan-title" style={{ fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600, color: '#F5EDD6' }}>
                  {currentLang === 'ta' ? 'அகஸ்தியன் AI' : 'Agasthiyan AI'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={clearChat}
                  aria-label={currentLang === 'ta' ? 'உரையாடலை அழி' : 'Clear chat'}
                  title={currentLang === 'ta' ? 'உரையாடலை அழி' : 'Clear chat'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(245,237,214,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    minWidth: '36px',
                    minHeight: '36px',
                    padding: '4px',
                  }}
                >
                  {currentLang === 'ta' ? 'அழி' : 'Clear'}
                </button>
                <button
                  type="button"
                  onClick={closeChat}
                  aria-label={currentLang === 'ta' ? 'உரையாடலை மூடு' : 'Close chat'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(245,237,214,0.7)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    minWidth: '36px',
                    minHeight: '36px',
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              id="agasthiyan-safety-note"
              style={{
                padding: '9px 14px',
                background: 'rgba(201,146,42,0.10)',
                borderBottom: '1px solid rgba(201,146,42,0.22)',
                color: 'rgba(245,237,214,0.78)',
                fontSize: '0.7rem',
                lineHeight: 1.45,
              }}
            >
              {currentLang === 'ta'
                ? 'AI உருவாக்கிய கடை/கல்வி தகவல் மட்டும் — நோயறிதல், மருந்தளவு அல்லது அவசர உதவி அல்ல. தனிப்பட்ட அல்லது மருத்துவ விவரங்களை பகிர வேண்டாம். '
                : 'AI-generated store/education help only—not diagnosis, dosage, or emergency care. Do not share personal or medical details. '}
              <Link href="/privacy#ai-assistant" style={{ color: T.gold }}>
                {currentLang === 'ta' ? 'தனியுரிமை' : 'Privacy'}
              </Link>
              {' · '}
              <Link href="/help" style={{ color: T.gold }}>
                {currentLang === 'ta' ? 'உதவி' : 'Support'}
              </Link>
            </div>

            {/* Messages body */}
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        borderBottomRightRadius: isUser ? '2px' : '14px',
                        borderBottomLeftRadius: isUser ? '14px' : '2px',
                        background: isUser ? 'linear-gradient(135deg, #C9922A, #E8A820)' : 'rgba(13, 34, 24, 0.70)',
                        border: isUser ? 'none' : `1px solid ${T.border}`,
                        color: isUser ? '#0A1A10' : '#F5EDD6',
                        fontSize: '0.92rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {/* Loader dots */}
              {isLoading && (
                <div role="status" style={{ alignSelf: 'flex-start', background: 'rgba(13, 34, 24, 0.70)', border: `1px solid ${T.border}`, padding: '8px 14px', borderRadius: '14px', borderBottomLeftRadius: '2px' }}>
                  <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                    {currentLang === 'ta' ? 'பதில் உருவாக்கப்படுகிறது' : 'Generating a response'}
                  </span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '14px' }}>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={reduceMotion ? { opacity: 0.7 } : { opacity: [0.3, 1, 0.3] }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5EDD6' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(61, 138, 92, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'rgba(13, 34, 24, 0.50)',
              }}
            >
              <label
                htmlFor="agasthiyan-message"
                style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
              >
                {currentLang === 'ta' ? 'அகஸ்தியனுக்கு செய்தி' : 'Message Agasthiyan'}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  ref={inputRef}
                  id="agasthiyan-message"
                  type="text"
                  value={inputVal}
                  maxLength={MAX_MESSAGE_CHARS}
                  aria-describedby="agasthiyan-safety-note"
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={currentLang === 'ta' ? 'தயாரிப்பு பற்றி கேளுங்கள்...' : 'Ask about a product...'}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'rgba(13,34,24,0.60)',
                    border: '1px solid rgba(61,138,92,0.35)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    color: '#F5EDD6',
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputVal.trim()}
                  aria-disabled={isLoading || !inputVal.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #C9922A, #E8A820)',
                    color: '#0A1A10',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: isLoading || !inputVal.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !inputVal.trim() ? 0.55 : 1,
                  }}
                >
                  {currentLang === 'ta' ? 'அனுப்பு' : 'Send'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
