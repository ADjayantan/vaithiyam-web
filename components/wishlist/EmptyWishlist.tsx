'use client';

/**
 * apps/web/components/wishlist/EmptyWishlist.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Empty Wishlist State
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • Inline botanical SVG illustration — potted herb with floating heart
 *     Uses Iyarkai Nala design tokens directly; no external images or deps
 *   • Gentle float animation on illustration (mirrors EmptyState in OrderHistoryList)
 *   • Tamil-first heading + body copy
 *   • Primary CTA  — "தொடர் கடைபிடி"   → /
 *   • Secondary CTA — "பிரபல பொருட்கள்" → /products
 *   • Mobile-first — max-width 320px container, centred
 *   • White card surface with cream border (matches project card convention)
 */

import Link               from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faLeaf, faStar } from '@fortawesome/free-solid-svg-icons';

// ─── Design tokens (identical to all Iyarkai Nala modules) ───────────────────────
const T = {
  forestPrimary: 'var(--vt-forest-700)',
  forestDark:    'var(--vt-forest-900)',
  creamBase:     'rgba(13,34,24,0.35)', // dark glassmorphic input background
  creamAlt:      'rgba(13,34,24,0.60)', // dark selector background
  gold:          'var(--vt-gold-500)',
  goldPale:      'var(--vt-gold-300)',
  leaf:          'var(--vt-forest-600)',
  saffron:       'var(--vt-saffron)',
  terracotta:    'var(--vt-coral-500)',
  darkText:      'var(--vt-ink)',
  secondaryText: 'var(--vt-ink-80)',
  muted:         'var(--vt-muted)',
  border:        'var(--vt-border)',
} as const;

const FONT = {
  display: "var(--vt-font-display)",
  body:    "var(--vt-font-body)",
  serif:   "var(--vt-font-serif)",
} as const;

// ─── Botanical illustration ───────────────────────────────────────────────────
//   Hand-crafted SVG. All colours reference design tokens.
//   Layout: terracotta pot → soil → main stem → left/right branching leaves
//           → gold flower at apex + empty heart with sparkle floating top-right.
function BotanicalIllustration() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Pot ──────────────────────────────────────────────────────── */}
      {/* Pot body */}
      <path
        d="M72 154 L67 130 L133 130 L128 154 Q100 163 72 154Z"
        fill={T.terracotta}
        opacity="0.82"
      />
      {/* Pot rim */}
      <rect
        x="62" y="122" width="76" height="10"
        rx="5"
        fill={T.saffron}
        opacity="0.78"
      />
      {/* Pot shadow / soil surface */}
      <ellipse cx="100" cy="122" rx="36" ry="5.5" fill={T.forestDark} opacity="0.28" />
      {/* Pot decorative band */}
      <path
        d="M69 143 Q100 148 131 143"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* ── Main stem ────────────────────────────────────────────────── */}
      <path
        d="M100 122 C100 110 99 98 100 76"
        stroke={T.leaf}
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* ── Left branch ──────────────────────────────────────────────── */}
      <path
        d="M100 106 C88 100 78 94 68 87"
        stroke={T.leaf}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Left leaf — large */}
      <path
        d="M68 87 C56 76 60 62 68 58 C76 62 76 78 68 87Z"
        fill={T.leaf}
        opacity="0.88"
      />
      {/* Left leaf — midway */}
      <path
        d="M100 96 C90 91 82 82 80 73 C90 72 98 82 100 96Z"
        fill={T.leaf}
        opacity="0.70"
      />
      {/* Left leaf vein */}
      <path
        d="M68 58 Q64 70 68 87"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* ── Right branch ─────────────────────────────────────────────── */}
      <path
        d="M100 98 C112 91 122 85 132 78"
        stroke={T.leaf}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Right leaf — large */}
      <path
        d="M132 78 C144 67 140 53 132 49 C124 53 124 69 132 78Z"
        fill={T.leaf}
        opacity="0.88"
      />
      {/* Right leaf — midway */}
      <path
        d="M100 88 C110 83 120 73 120 64 C110 63 102 74 100 88Z"
        fill={T.leaf}
        opacity="0.70"
      />
      {/* Right leaf vein */}
      <path
        d="M132 49 Q136 62 132 78"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* ── Apex flower ──────────────────────────────────────────────── */}
      {/* Petals — 6-fold radial, offset 30° */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const px  = 100 + Math.round(Math.cos(rad) * 15 * 10) / 10;
        const py  = 72  + Math.round(Math.sin(rad) * 15 * 10) / 10;
        return (
          <ellipse
            key={i}
            cx={px} cy={py}
            rx="5.5" ry="4.5"
            fill={T.gold}
            opacity="0.52"
            transform={`rotate(${deg + 90},${px},${py})`}
          />
        );
      })}
      {/* Flower centre */}
      <circle cx="100" cy="72" r="10" fill={T.gold}     opacity="0.88" />
      <circle cx="100" cy="72" r="6"  fill={T.goldPale} opacity="0.90" />
      <circle cx="100" cy="72" r="2"  fill={T.saffron}  opacity="0.70" />

      {/* ── Floating empty heart ─────────────────────────────────────── */}
      {/* Positioned top-right; parent applies float animation */}
      <path
        d="M158 42 C162 34 174 34 174 44 C174 54 162 62 158 66 C154 62 142 54 142 44 C142 34 154 34 158 42Z"
        fill="none"
        stroke={T.gold}
        strokeWidth="2.2"
        opacity="0.60"
      />
      {/* Sparkle star near heart */}
      <path
        d="M174 30 L175.2 26 L176.4 30 L180.4 31.2 L176.4 32.4 L175.2 36.4 L174 32.4 L170 31.2 L174 30Z"
        fill={T.goldPale}
        opacity="0.55"
      />
      {/* Small dot accents on leaves */}
      <circle cx="76" cy="100" r="2.8" fill={T.leaf} opacity="0.38" />
      <circle cx="124" cy="96" r="2.8" fill={T.leaf} opacity="0.38" />
      <circle cx="86"  cy="84" r="2"   fill={T.leaf} opacity="0.28" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmptyWishlist() {
  return (
    <div
      role="status"
      style={{
        background:    'var(--vt-card)',
        borderRadius:  '24px',
        border:        `1px solid var(--vt-border)`,
        padding:       '52px 24px 44px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        textAlign:     'center',
      }}
    >
      {/* Illustration — floats up and down */}
      <div
        aria-hidden="true"
        style={{
          marginBottom: '28px',
          animation:    'vt-ew-float 3.2s ease-in-out infinite',
        }}
      >
        <style>{`
          @keyframes vt-ew-float {
            0%,100% { transform: translateY(0px);  }
            50%      { transform: translateY(-9px); }
          }
        `}</style>
        <BotanicalIllustration />
      </div>

      {/* Heading */}
      <h2
        style={{
          fontFamily:    FONT.display,
          fontSize:      'clamp(1.1rem, 4vw, 1.3rem)',
          fontWeight:    700,
          color:         T.darkText,
          margin:        '0 0 10px',
          lineHeight:    1.3,
          letterSpacing: '0.01em',
        }}
      >
        விருப்பப்பட்டியல் காலியாக உள்ளது
      </h2>

      {/* Body copy */}
      <p
        style={{
          fontFamily: FONT.body,
          fontSize:   '0.9rem',
          color:      T.secondaryText,
          margin:     '0 0 32px',
          lineHeight: 1.75,
          maxWidth:   '300px',
        }}
      >
        உங்களுக்கு பிடித்த சித்தா, ஆயுர்வேத மற்றும் இயற்கை பொருட்களை
        <FontAwesomeIcon icon={faHeart} style={{ width: 13, height: 13, color: 'var(--vt-coral-500)', margin: '0 3px', verticalAlign: 'middle' }} aria-hidden="true" /> அழுத்தி இங்கே சேமிக்கவும்.
      </p>

      {/* CTAs */}
      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '10px',
          width:         '100%',
          maxWidth:      '288px',
        }}
      >
        {/* Primary — continue shopping */}
        <Link
          href="/"
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '8px',
            height:         '48px',
            borderRadius:   '14px',
            background:     `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
            color:          '#FFFFFF',
            fontFamily:     FONT.display,
            fontSize:       '0.92rem',
            fontWeight:     700,
            letterSpacing:  '0.01em',
            textDecoration: 'none',
            boxShadow:      '0 3px 12px rgba(26,58,42,0.24)',
          }}
        >
          <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faLeaf} style={{ width: 14, height: 14 }} />
          </span>
          தொடர் கடைபிடி
        </Link>

        {/* Secondary — popular products */}
        <Link
          href="/products"
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '8px',
            height:         '48px',
            borderRadius:   '14px',
            background:     'transparent',
            color:          'var(--vt-gold-300)',
            fontFamily:     FONT.display,
            fontSize:       '0.92rem',
            fontWeight:     600,
            letterSpacing:  '0.01em',
            textDecoration: 'none',
            border:         `1.5px solid var(--vt-border)`,
          }}
        >
          <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faStar} style={{ width: 14, height: 14 }} />
          </span>
          பிரபல பொருட்கள்
        </Link>
      </div>
    </div>
  );
}
