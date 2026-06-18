'use client';

/**
 * apps/web/components/account/AddressBook.tsx
 *
 * Iyarkai Nala Maruthuvamanai — Address Book
 * Next.js 14 App Router · TypeScript strict · Tamil-first · Mobile-first
 *
 * ─── Features ──────────────────────────────────────────────────────────────────
 *   • List all saved addresses using AddressCard
 *   • "புதிய முகவரி சேர்" CTA — slides in AddressForm below the list
 *   • Edit address — re-opens AddressForm pre-filled with existing data
 *   • Delete address (delegated to AddressCard inline confirm)
 *   • Set default address (delegated to AddressCard)
 *   • Inline AddressForm with full validation and Tamil error messages:
 *       - Address Type radio (Home / Work / Other + custom label)
 *       - Full Name · Mobile · Address Line 1 · Line 2 (optional)
 *       - City · State (dropdown, major Indian states) · Pincode
 *       - Set as default checkbox
 *   • Beautiful botanical empty-state illustration (SVG)
 *   • Loading state for list fetch
 *   • Server error banner on save failure
 *   • Maximum 5 addresses guard
 *
 * ─── Props ─────────────────────────────────────────────────────────────────────
 *   See AddressBookProps below.
 */

import {
  useState,
  useCallback,
  useId,
  type FormEvent,
} from 'react';
import { FontAwesomeIcon }   from '@fortawesome/react-fontawesome';
import { faHouse, faBriefcase, faLocationDot, faStar } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import AddressCard, { type Address, type AddressType } from './AddressCard';

// ─── Design tokens ─────────────────────────────────────────────────────────────
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

const MAX_ADDRESSES = 5;

// ─── Indian states list ────────────────────────────────────────────────────────
const INDIAN_STATES = [
  'ஆந்திர பிரதேசம்', 'அரவர்கள் நீச்சல்', 'அஸ்ஸாம்', 'பிஹார்', 'சத்தீஸ்கர்',
  'கோவா', 'குஜராத்', 'ஹரியானா', 'ஹிமாசல பிரதேசம்', 'ஜார்கண்ட்',
  'கர்நாடகா', 'கேரளா', 'மத்திய பிரதேசம்', 'மகாராஷ்டிரா', 'மணிப்பூர்',
  'மேகாலயா', 'மிஸோரம்', 'நாகாலாந்து', 'டெல்லி (NCT)', 'ஒடிஷா',
  'பஞ்சாப்', 'ராஜஸ்தான்', 'சிக்கிம்', 'தமிழ்நாடு', 'தெலங்கானா',
  'திரிபுரா', 'உத்தர பிரதேசம்', 'உத்தரகாண்ட்', 'மேற்கு வங்கம்', 'பிற',
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
export type { Address, AddressType };

export interface AddressBookProps {
  addresses:      Address[];
  loading?:       boolean;
  onAdd:          (data: Omit<Address, 'id'>) => Promise<void>;
  onUpdate:       (id: string, data: Omit<Address, 'id'>) => Promise<void>;
  onDelete:       (id: string) => Promise<void>;
  onSetDefault:   (id: string) => Promise<void>;
}

// ─── Form field state ──────────────────────────────────────────────────────────
interface FormFields {
  type:       AddressType;
  label:      string;
  fullName:   string;
  mobile:     string;
  line1:      string;
  line2:      string;
  city:       string;
  state:      string;
  pincode:    string;
  isDefault:  boolean;
}

const EMPTY_FORM: FormFields = {
  type:      'home',
  label:     '',
  fullName:  '',
  mobile:    '',
  line1:     '',
  line2:     '',
  city:      '',
  state:     '',
  pincode:   '',
  isDefault: false,
};

// ─── Tamil validation messages ─────────────────────────────────────────────────
const ERR = {
  nameRequired:    'பெயர் தேவை.',
  nameMin:         'பெயர் குறைந்தது 2 எழுத்துகள் இருக்க வேண்டும்.',
  mobileRequired:  'மொபைல் எண் தேவை.',
  mobileInvalid:   'சரியான 10 இலக்க மொபைல் எண் உள்ளிடவும்.',
  line1Required:   'முகவரி வரி 1 தேவை.',
  line1Min:        'முகவரி வரி 1 குறைந்தது 5 எழுத்துகள் இருக்க வேண்டும்.',
  cityRequired:    'நகரம் / ஊர் தேவை.',
  stateRequired:   'மாநிலம் தேர்ந்தெடுக்கவும்.',
  pincodeRequired: 'அஞ்சல் குறியீடு தேவை.',
  pincodeInvalid:  'சரியான 6 இலக்க அஞ்சல் குறியீடு உள்ளிடவும்.',
  labelRequired:   'வகை பெயர் தேவை.',
} as const;

// ─── Validators ────────────────────────────────────────────────────────────────
const MOBILE_RE  = /^[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;

function validateForm(f: FormFields): Partial<Record<keyof FormFields, string>> {
  const errs: Partial<Record<keyof FormFields, string>> = {};

  if (!f.fullName.trim())           errs.fullName = ERR.nameRequired;
  else if (f.fullName.trim().length < 2) errs.fullName = ERR.nameMin;

  const mob = f.mobile.replace(/\s/g, '');
  if (!mob)                         errs.mobile = ERR.mobileRequired;
  else if (!MOBILE_RE.test(mob))    errs.mobile = ERR.mobileInvalid;

  if (!f.line1.trim())              errs.line1 = ERR.line1Required;
  else if (f.line1.trim().length < 5) errs.line1 = ERR.line1Min;

  if (!f.city.trim())               errs.city = ERR.cityRequired;

  if (!f.state)                     errs.state = ERR.stateRequired;

  const pin = f.pincode.replace(/\s/g, '');
  if (!pin)                         errs.pincode = ERR.pincodeRequired;
  else if (!PINCODE_RE.test(pin))   errs.pincode = ERR.pincodeInvalid;

  if (f.type === 'other' && !f.label.trim()) errs.label = ERR.labelRequired;

  return errs;
}

// ─── Shared input / label styles ──────────────────────────────────────────────
function inputSt(focused: boolean, error: boolean): React.CSSProperties {
  return {
    width:        '100%',
    boxSizing:    'border-box',
    padding:      '11px 14px',
    border:       `1.5px solid ${error ? T.terracotta : focused ? T.forestPrimary : T.border}`,
    borderRadius: '11px',
    background:   focused ? 'rgba(13,34,24,0.80)' : T.creamBase,
    fontFamily:   FONT.body,
    fontSize:     '0.94rem',
    color:        T.darkText,
    outline:      'none',
    transition:   'border-color 0.14s, box-shadow 0.14s, background 0.14s',
    boxShadow:    focused
      ? `0 0 0 3px ${error ? 'rgba(249,92,56,0.12)' : 'rgba(61,138,92,0.12)'}`
      : 'none',
  };
}

function labelSt(): React.CSSProperties {
  return {
    display:      'block',
    fontFamily:   FONT.display,
    fontSize:     '0.79rem',
    fontWeight:   600,
    color:        T.secondaryText,
    marginBottom: '6px',
  };
}

function FieldErr({ msg, id }: { msg?: string; id: string }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" style={{ margin: '5px 0 0', fontSize: '0.75rem', color: T.terracotta, fontFamily: FONT.body, display: 'flex', alignItems: 'center', gap: '3px' }}>
      <span aria-hidden="true">⚠</span>{msg}
    </p>
  );
}

function Spinner({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ animation: 'vt-ab-spin 0.75s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.26)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '24px 28px 24px 24px',
        gap:            '16px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'flex-start' }}>
        <h2
          style={{
            fontFamily:   FONT.display,
            fontSize:     '1.08rem',
            fontWeight:   700,
            color:        T.darkText,
            margin:       0,
            lineHeight:   1.3,
          }}
        >
          முகவரி புத்தகம்
        </h2>
        <button
          type="button"
          onClick={onAdd}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '8px',
            padding:        '10px 18px',
            border:         'none',
            borderRadius:   '10px',
            background:     '#3D8A5C',
            cursor:         'pointer',
            fontFamily:     FONT.display,
            fontSize:       '0.88rem',
            fontWeight:     700,
            color:          '#fff',
            transition:     'opacity 0.2s',
          }}
        >
          + முகவரி சேர்
        </button>
      </div>

      {/* Botanical SVG illustration */}
      <div style={{ flexShrink: 0, width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          width="84"
          height="84"
          viewBox="0 0 110 110"
          fill="none"
          aria-hidden="true"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* Ground circle */}
          <circle cx="55" cy="55" r="50" fill={T.creamAlt} opacity="0.7"/>
          {/* Map pin body */}
          <path
            d="M55 22c-10.5 0-19 8.5-19 19 0 14.25 19 37 19 37s19-22.75 19-37c0-10.5-8.5-19-19-19z"
            fill={T.forestPrimary} opacity="0.15"
          />
          <path
            d="M55 26c-8.3 0-15 6.7-15 15 0 11.3 15 30 15 30s15-18.7 15-30c0-8.3-6.7-15-15-15z"
            fill={T.forestPrimary} opacity="0.28"
          />
          <path
            d="M55 30c-6.1 0-11 4.9-11 11 0 8.25 11 22 11 22s11-13.75 11-22c0-6.1-4.9-11-11-11z"
            fill={T.forestPrimary}
          />
          {/* Inner dot */}
          <circle cx="55" cy="41" r="4.5" fill={T.creamBase}/>
          {/* Leaf sprigs left */}
          <path d="M34 60 Q28 52 30 45 Q36 50 34 60Z" fill={T.leaf} opacity="0.55"/>
          <path d="M30 66 Q22 58 24 51 Q31 56 30 66Z" fill={T.leaf} opacity="0.4"/>
          {/* Leaf sprigs right */}
          <path d="M76 60 Q82 52 80 45 Q74 50 76 60Z" fill={T.leaf} opacity="0.55"/>
          <path d="M80 66 Q88 58 86 51 Q79 56 80 66Z" fill={T.leaf} opacity="0.4"/>
          {/* Gold dots */}
          <circle cx="38" cy="80" r="3" fill={T.goldPale} opacity="0.8"/>
          <circle cx="72" cy="80" r="3" fill={T.goldPale} opacity="0.8"/>
          <circle cx="55" cy="84" r="3.5" fill={T.gold} opacity="0.6"/>
        </svg>
      </div>
    </div>
  );
}

// ─── AddressForm ───────────────────────────────────────────────────────────────
interface AddressFormProps {
  initial?:    Partial<FormFields>;
  onSave:      (data: Omit<Address, 'id'>) => Promise<void>;
  onCancel:    () => void;
  isEdit?:     boolean;
}

function AddressForm({ initial, onSave, onCancel, isEdit = false }: AddressFormProps) {
  const uid = useId();
  const [f, setF] = useState<FormFields>({ ...EMPTY_FORM, ...initial });
  const [errs, setErrs] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState('');

  // Focus states
  const [focusedField, setFocusedField] = useState<string>('');

  const setField = useCallback(<K extends keyof FormFields>(key: K, val: FormFields[K]) => {
    setF((prev) => ({ ...prev, [key]: val }));
    setErrs((prev) => ({ ...prev, [key]: '' }));
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const validation = validateForm(f);
    if (Object.keys(validation).length > 0) {
      setErrs(validation);
      return;
    }

    setSaving(true);
    setServerErr('');
    try {
      await onSave({
        type:      f.type,
        label:     f.type === 'other' ? f.label.trim() : undefined,
        fullName:  f.fullName.trim(),
        mobile:    f.mobile.replace(/\s/g, ''),
        line1:     f.line1.trim(),
        line2:     f.line2.trim() || undefined,
        city:      f.city.trim(),
        state:     f.state,
        pincode:   f.pincode.replace(/\s/g, ''),
        isDefault: f.isDefault,
      });
    } catch (err) {
      setServerErr(
        err instanceof Error
          ? err.message
          : 'முகவரி சேமிக்க தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
      );
    } finally {
      setSaving(false);
    }
  }, [saving, f, onSave]);

  const TYPE_OPTIONS: { value: AddressType; labelTa: string; icon: IconDefinition }[] = [
    { value: 'home',  labelTa: 'வீடு',    icon: faHouse       },
    { value: 'work',  labelTa: 'அலுவலகம்', icon: faBriefcase   },
    { value: 'other', labelTa: 'பிற',      icon: faLocationDot },
  ];

  return (
    <div
      style={{
        background:   'var(--vt-card)',
        border:       `1px solid var(--vt-border)`,
        borderRadius: '18px',
        overflow:     'hidden',
        boxShadow:    'var(--vt-shadow-sm)',
      }}
    >
      {/* Form header */}
      <div
        style={{
          padding:      '14px 20px',
          borderBottom: `1px solid ${T.border}`,
          background:   T.creamBase,
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
        }}
      >
        <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <FontAwesomeIcon icon={faLocationDot} style={{ width: 16, height: 16, color: T.saffron }} />
        </span>
        <h3
          style={{
            fontFamily:  FONT.display,
            fontSize:    '0.96rem',
            fontWeight:  700,
            color:       T.darkText,
            margin:      0,
          }}
        >
          {isEdit ? 'முகவரி திருத்து' : 'புதிய முகவரி சேர்'}
        </h3>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Server error */}
        {serverErr && (
          <div
            role="alert"
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              background:   'rgba(139,58,47,0.07)',
              border:       `1px solid rgba(139,58,47,0.22)`,
              borderRadius: '10px',
              padding:      '10px 12px',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
            <span style={{ flex: 1, fontSize: '0.82rem', color: T.terracotta, fontFamily: FONT.body }}>{serverErr}</span>
            <button type="button" onClick={() => setServerErr('')} style={{ background: 'none', border: 'none', color: T.terracotta, cursor: 'pointer', fontSize: '1rem', padding: '2px', lineHeight: 1 }}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Address type */}
          <div style={{ marginBottom: '18px' }}>
            <p style={labelSt()}>
              முகவரி வகை
              <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TYPE_OPTIONS.map((opt) => {
                const active = f.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setField('type', opt.value)}
                    disabled={saving}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '6px',
                      padding:      '8px 16px',
                      border:       `1.5px solid ${active ? T.leaf : T.border}`,
                      borderRadius: '100px',
                      background:   active ? 'rgba(61,138,92,0.18)' : 'transparent',
                      cursor:       saving ? 'not-allowed' : 'pointer',
                      fontFamily:   FONT.display,
                      fontSize:     '0.82rem',
                      fontWeight:   active ? 700 : 500,
                      color:        active ? '#fff' : T.secondaryText,
                      transition:   'all 0.15s',
                    }}
                  >
                    <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <FontAwesomeIcon icon={opt.icon} style={{ width: 13, height: 13 }} />
                    </span>
                    {opt.labelTa}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom label for 'other' */}
          {f.type === 'other' && (
            <div style={{ marginBottom: '14px' }}>
              <label htmlFor={`${uid}-label`} style={labelSt()}>
                வகை பெயர்
                <span aria-hidden="true" style={{ color: T.terracotta, marginLeft: '3px' }}>*</span>
              </label>
              <input
                id={`${uid}-label`}
                type="text"
                placeholder="எ.கா. பெற்றோர் வீடு"
                value={f.label}
                disabled={saving}
                onChange={(e) => setField('label', e.target.value)}
                onFocus={() => setFocusedField('label')}
                onBlur={() => setFocusedField('')}
                style={inputSt(focusedField === 'label', !!errs.label)}
              />
              <FieldErr msg={errs.label} id={`${uid}-label-err`} />
            </div>
          )}

          {/* 2-col grid: Full Name + Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label htmlFor={`${uid}-fname`} style={labelSt()}>
                பெயர் <span aria-hidden="true" style={{ color: T.terracotta }}>*</span>
              </label>
              <input
                id={`${uid}-fname`}
                type="text"
                autoComplete="name"
                placeholder="பூரண பெயர்"
                value={f.fullName}
                disabled={saving}
                onChange={(e) => setField('fullName', e.target.value)}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField('')}
                style={inputSt(focusedField === 'fullName', !!errs.fullName)}
              />
              <FieldErr msg={errs.fullName} id={`${uid}-fname-err`} />
            </div>
            <div>
              <label htmlFor={`${uid}-mob`} style={labelSt()}>
                மொபைல் <span aria-hidden="true" style={{ color: T.terracotta }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '11px 10px', background: T.creamAlt, border: `1.5px solid ${T.border}`, borderRadius: '11px', fontFamily: FONT.body, fontSize: '0.84rem', color: T.secondaryText, whiteSpace: 'nowrap', flexShrink: 0, userSelect: 'none' }}>+91</span>
                <div style={{ flex: 1 }}>
                  <input
                    id={`${uid}-mob`}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="9876543210"
                    value={f.mobile}
                    disabled={saving}
                    onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onFocus={() => setFocusedField('mobile')}
                    onBlur={() => setFocusedField('')}
                    style={{ ...inputSt(focusedField === 'mobile', !!errs.mobile), letterSpacing: '0.06em' }}
                  />
                </div>
              </div>
              <FieldErr msg={errs.mobile} id={`${uid}-mob-err`} />
            </div>
          </div>

          {/* Line 1 */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor={`${uid}-l1`} style={labelSt()}>
              முகவரி வரி 1 <span aria-hidden="true" style={{ color: T.terracotta }}>*</span>
            </label>
            <input
              id={`${uid}-l1`}
              type="text"
              autoComplete="address-line1"
              placeholder="வீடு எண், தெரு பெயர்"
              value={f.line1}
              disabled={saving}
              onChange={(e) => setField('line1', e.target.value)}
              onFocus={() => setFocusedField('line1')}
              onBlur={() => setFocusedField('')}
              style={inputSt(focusedField === 'line1', !!errs.line1)}
            />
            <FieldErr msg={errs.line1} id={`${uid}-l1-err`} />
          </div>

          {/* Line 2 */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor={`${uid}-l2`} style={labelSt()}>
              முகவரி வரி 2{' '}
              <span style={{ color: T.muted, fontWeight: 400, fontSize: '0.72rem' }}>(விருப்பமானது)</span>
            </label>
            <input
              id={`${uid}-l2`}
              type="text"
              autoComplete="address-line2"
              placeholder="மாடி, கட்டிடம், அடையாளம்"
              value={f.line2}
              disabled={saving}
              onChange={(e) => setField('line2', e.target.value)}
              onFocus={() => setFocusedField('line2')}
              onBlur={() => setFocusedField('')}
              style={inputSt(focusedField === 'line2', false)}
            />
          </div>

          {/* City + State + Pincode grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label htmlFor={`${uid}-city`} style={labelSt()}>
                நகரம் / ஊர் <span aria-hidden="true" style={{ color: T.terracotta }}>*</span>
              </label>
              <input
                id={`${uid}-city`}
                type="text"
                autoComplete="address-level2"
                placeholder="சென்னை"
                value={f.city}
                disabled={saving}
                onChange={(e) => setField('city', e.target.value)}
                onFocus={() => setFocusedField('city')}
                onBlur={() => setFocusedField('')}
                style={inputSt(focusedField === 'city', !!errs.city)}
              />
              <FieldErr msg={errs.city} id={`${uid}-city-err`} />
            </div>

            <div>
              <label htmlFor={`${uid}-state`} style={labelSt()}>
                மாநிலம் <span aria-hidden="true" style={{ color: T.terracotta }}>*</span>
              </label>
              <select
                id={`${uid}-state`}
                value={f.state}
                disabled={saving}
                onChange={(e) => setField('state', e.target.value)}
                onFocus={() => setFocusedField('state')}
                onBlur={() => setFocusedField('')}
                style={{
                  ...inputSt(focusedField === 'state', !!errs.state),
                  cursor:     saving ? 'not-allowed' : 'pointer',
                  appearance: 'auto',
                }}
              >
                <option value="">மாநிலம் தேர்ந்தெடு</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <FieldErr msg={errs.state} id={`${uid}-state-err`} />
            </div>

            <div>
              <label htmlFor={`${uid}-pin`} style={labelSt()}>
                அஞ்சல் குறியீடு <span aria-hidden="true" style={{ color: T.terracotta }}>*</span>
              </label>
              <input
                id={`${uid}-pin`}
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="600001"
                value={f.pincode}
                disabled={saving}
                onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                onFocus={() => setFocusedField('pincode')}
                onBlur={() => setFocusedField('')}
                style={{ ...inputSt(focusedField === 'pincode', !!errs.pincode), letterSpacing: '0.1em' }}
              />
              <FieldErr msg={errs.pincode} id={`${uid}-pin-err`} />
            </div>
          </div>

          {/* Set as default */}
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '12px 14px',
              background:   'rgba(13,34,24,0.60)',
              borderRadius: '12px',
              marginBottom: '22px',
              cursor:       saving ? 'not-allowed' : 'pointer',
            }}
            onClick={() => !saving && setField('isDefault', !f.isDefault)}
          >
            <input
              type="checkbox"
              id={`${uid}-default`}
              checked={f.isDefault}
              onChange={(e) => setField('isDefault', e.target.checked)}
              disabled={saving}
              style={{ width: '16px', height: '16px', accentColor: 'var(--vt-forest-600)', cursor: 'pointer', flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
            <label
              htmlFor={`${uid}-default`}
              style={{ fontFamily: FONT.display, fontSize: '0.84rem', fontWeight: 600, color: T.darkText, cursor: 'pointer', userSelect: 'none', lineHeight: 1.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <FontAwesomeIcon icon={faStar} style={{ width: 13, height: 13, color: T.gold, marginRight: 5 }} />
              இதை இயல்புநிலை முகவரியாக அமை
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              style={{
                flex:         '1 1 100px',
                padding:      '12px 18px',
                border:       `1.5px solid var(--vt-border)`,
                borderRadius: '12px',
                background:   'transparent',
                cursor:       saving ? 'not-allowed' : 'pointer',
                fontFamily:   FONT.display,
                fontSize:     '0.88rem',
                fontWeight:   700,
                color:        'var(--vt-muted)',
                opacity:      saving ? 0.5 : 1,
              }}
            >
              ரத்து
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex:           '2 1 160px',
                padding:        '12px 22px',
                border:         'none',
                borderRadius:   '12px',
                cursor:         saving ? 'not-allowed' : 'pointer',
                background:     saving
                  ? T.muted
                  : `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
                color:          '#fff',
                fontFamily:     FONT.display,
                fontSize:       '0.88rem',
                fontWeight:     700,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '7px',
                boxShadow:      saving ? 'none' : '0 4px 12px rgba(61,138,92,0.24)',
                opacity:        saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <><Spinner /> சேமிக்கிறோம்...</>
              ) : (
                <><span aria-hidden="true">✓</span>{isEdit ? 'மாற்றங்களை சேமி' : 'முகவரி சேர்'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────
function AddressSkeleton() {
  return (
    <>
      <style>{`
        @keyframes vt-ab-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            height:           130,
            borderRadius:     '18px',
            background:       T.creamAlt,
            animation:        'vt-ab-pulse 1.4s ease-in-out infinite',
            animationDelay:   `${i * 0.15}s`,
          }}
        />
      ))}
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AddressBook({
  addresses,
  loading = false,
  onAdd,
  onUpdate,
  onDelete,
  onSetDefault,
}: AddressBookProps) {
  const [formMode,     setFormMode]     = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingAddr,  setEditingAddr]  = useState<Address | null>(null);

  const canAdd = addresses.length < MAX_ADDRESSES;

  // ── Open add form ──────────────────────────────────────────────────────────
  const handleAddClick = useCallback(() => {
    if (!canAdd) return;
    setEditingAddr(null);
    setFormMode('add');
    // Scroll to form — small delay lets state flush first
    setTimeout(() => {
      document.getElementById('vt-address-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, [canAdd]);

  // ── Open edit form ─────────────────────────────────────────────────────────
  const handleEditClick = useCallback((addr: Address) => {
    setEditingAddr(addr);
    setFormMode('edit');
    setTimeout(() => {
      document.getElementById('vt-address-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, []);

  // ── Close form ─────────────────────────────────────────────────────────────
  const handleFormCancel = useCallback(() => {
    setFormMode('closed');
    setEditingAddr(null);
  }, []);

  // ── Save add ───────────────────────────────────────────────────────────────
  const handleAddSave = useCallback(async (data: Omit<Address, 'id'>) => {
    await onAdd(data);
    setFormMode('closed');
  }, [onAdd]);

  // ── Save edit ──────────────────────────────────────────────────────────────
  const handleUpdateSave = useCallback(async (data: Omit<Address, 'id'>) => {
    if (!editingAddr) return;
    await onUpdate(editingAddr.id, data);
    setFormMode('closed');
    setEditingAddr(null);
  }, [editingAddr, onUpdate]);

  return (
    <section
      aria-label="முகவரி புத்தகம்"
      style={{
        background:   'var(--vt-card)',
        border:       `1px solid ${T.border}`,
        borderRadius: '24px',
        overflow:     'hidden',
        boxShadow:    'var(--vt-shadow-sm)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '18px 22px',
          borderBottom:    `1px solid ${T.border}`,
          background:      T.creamBase,
          gap:             '12px',
          flexWrap:        'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            aria-hidden="true"
            style={{
              width:          '34px',
              height:         '34px',
              borderRadius:   '10px',
              background:     `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
            }}
          >
            <LocationIcon />
          </div>
          <div>
            <h2 style={{ fontFamily: FONT.display, fontSize: '0.98rem', fontWeight: 700, color: T.darkText, margin: '0 0 1px', lineHeight: 1.25 }}>
              முகவரி புத்தகம்
            </h2>
            <p style={{ fontFamily: FONT.body, fontSize: '0.72rem', color: T.muted, margin: 0, lineHeight: 1.4 }}>
              {addresses.length > 0
                ? `${addresses.length} / ${MAX_ADDRESSES} முகவரிகள்`
                : 'டெலிவரி முகவரிகள்'}
            </p>
          </div>
        </div>

        {/* Add button */}
        {canAdd && formMode === 'closed' && (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={loading}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '9px 18px',
              border:         'none',
              borderRadius:   '100px',
              background:     `linear-gradient(135deg, ${T.forestPrimary} 0%, ${T.leaf} 100%)`,
              cursor:         loading ? 'not-allowed' : 'pointer',
              fontFamily:     FONT.display,
              fontSize:       '0.82rem',
              fontWeight:     700,
              color:          '#fff',
              boxShadow:      '0 3px 10px rgba(26,58,42,0.20)',
              transition:     'opacity 0.2s',
              opacity:        loading ? 0.6 : 1,
              whiteSpace:     'nowrap',
              flexShrink:     0,
            }}
          >
            <PlusIcon color="#fff" />
            முகவரி சேர்
          </button>
        )}

        {/* Max reached notice */}
        {!canAdd && (
          <span style={{ fontFamily: FONT.body, fontSize: '0.76rem', color: T.saffron, fontWeight: 600, lineHeight: 1.4, textAlign: 'right' }}>
            அதிகபட்சம் {MAX_ADDRESSES} முகவரிகள் மட்டுமே
          </span>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ padding: addresses.length > 0 || loading || formMode !== 'closed' ? '20px' : '0' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <AddressSkeleton />
          </div>
        )}

        {/* Empty state */}
        {!loading && addresses.length === 0 && formMode === 'closed' && (
          <EmptyState onAdd={handleAddClick} />
        )}

        {/* Address cards */}
        {!loading && addresses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: formMode !== 'closed' ? '20px' : '0' }}>
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={handleEditClick}
                onDelete={onDelete}
                onSetDefault={onSetDefault}
                disabled={formMode !== 'closed'}
              />
            ))}
          </div>
        )}

        {/* Add / Edit form */}
        {formMode !== 'closed' && (
          <div id="vt-address-form">
            <AddressForm
              key={editingAddr?.id ?? 'new'}
              isEdit={formMode === 'edit'}
              initial={editingAddr ? {
                type:      editingAddr.type,
                label:     editingAddr.label ?? '',
                fullName:  editingAddr.fullName,
                mobile:    editingAddr.mobile,
                line1:     editingAddr.line1,
                line2:     editingAddr.line2 ?? '',
                city:      editingAddr.city,
                state:     editingAddr.state,
                pincode:   editingAddr.pincode,
                isDefault: editingAddr.isDefault,
              } : undefined}
              onSave={formMode === 'edit' ? handleUpdateSave : handleAddSave}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes vt-ab-spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z"
        stroke={T.goldPale} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10" cy="7" r="2" stroke={T.goldPale} strokeWidth="1.5"/>
    </svg>
  );
}
