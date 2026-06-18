'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function AgasthiyanWidget() {
  const pathname = usePathname();
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'வணக்கம்! நான் அகஸ்தியன். சித்த மற்றும் ஆயுர்வேத மூலிகைகள் பற்றி நீங்கள் என்னிடம் கேட்கலாம்.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ta';

  // Update initial greeting dynamically if chat has not started yet
  useEffect(() => {
    if (mounted && messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([
        {
          role: 'assistant',
          content: currentLang === 'ta'
            ? 'வணக்கம்! நான் அகஸ்தியன். சித்த மற்றும் ஆயுர்வேத மூலிகைகள் பற்றி நீங்கள் என்னிடம் கேட்கலாம்.'
            : 'Hello! I am Agasthiyan. You can ask me about Siddha and Ayurveda herbs.',
        }
      ]);
    }
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
    window.addEventListener('open-agasthiyan', handleOpenWidget);
    return () => window.removeEventListener('open-agasthiyan', handleOpenWidget);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userMsg = inputVal.trim();
    setInputVal('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agasthiyan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Widget error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: currentLang === 'ta'
            ? 'மன்னிக்கவும், தகவல் பரிமாற்றத்தில் பிழை ஏற்பட்டுள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
            : 'Sorry, a communication error occurred. Please try again later.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // The customer-facing AI shopping assistant has no place in the admin
  // portal — it floats over dashboard panels and tables there.
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={currentLang === 'ta' ? 'அகஸ்தியன் AI உதவியாளர்' : 'Agasthiyan AI Assistant'}
        style={{
          position: 'fixed',
          bottom: isMobile ? '84px' : '24px',
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3D8A5C, #2E6845)',
          border: 'none',
          boxShadow: '0 0 16px rgba(212, 137, 10, 0.4), 0 4px 10px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 130,
          transition: 'transform 0.2s ease',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {/* Custom Leaf + Sparkle SVG */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5EDD6" strokeWidth="2">
          <path d="M12 20c-4.4 0-8-3.6-8-8c0-5.4 7-10 8-10s8 4.6 8 10c0 4.4-3.6 8-8 8Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2c0 8-4 12-8 16" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 5.5l1.5.5.5 1.5.5-1.5 1.5-.5-1.5-.5-.5-1.5-.5 1.5z" fill="#E8A820" stroke="none" />
        </svg>
      </button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: isMobile ? '96px' : '148px',
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
                justifyContent: 'between',
                background: 'rgba(13, 34, 24, 0.50)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2">
                  <path d="M12 20c-4.4 0-8-3.6-8-8c0-5.4 7-10 8-10s8 4.6 8 10c0 4.4-3.6 8-8 8Z" />
                </svg>
                <span style={{ fontFamily: FONT.display, fontSize: '1.25rem', fontWeight: 600, color: '#F5EDD6' }}>
                  {currentLang === 'ta' ? 'அகஸ்தியன் AI' : 'Agasthiyan AI'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(245,237,214,0.6)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages body */}
            <div
              ref={scrollRef}
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
                <div style={{ alignSelf: 'flex-start', background: 'rgba(13, 34, 24, 0.70)', border: `1px solid ${T.border}`, padding: '8px 14px', borderRadius: '14px', borderBottomLeftRadius: '2px' }}>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '14px' }}>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
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
                gap: '10px',
                background: 'rgba(13, 34, 24, 0.50)',
              }}
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={currentLang === 'ta' ? 'எழுதி அனுப்புங்கள்...' : 'Type your message...'}
                style={{
                  flex: 1,
                  background: 'rgba(13,34,24,0.60)',
                  border: '1px solid rgba(61,138,92,0.22)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  color: '#F5EDD6',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #C9922A, #E8A820)',
                  color: '#0A1A10',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {currentLang === 'ta' ? 'அனுப்பு' : 'Send'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
