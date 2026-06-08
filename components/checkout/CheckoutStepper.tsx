'use client';

const T = {
  forestPrimary: '#1A3A2A', leaf: '#3D7A55', gold: '#C9922A',
  goldPale: '#F0C96E', creamAlt: '#EDE3CE', muted: '#9C8060',
  border: '#DDD0B8', darkText: '#1C1410',
} as const;
const FONT = { display: "'Mukta Malar', sans-serif", body: "'Hind Madurai', sans-serif" } as const;

export interface CheckoutStep { id?: string; label: string; labelTa?: string; labelEn?: string }
interface Props { steps: readonly CheckoutStep[]; currentStep: number }

export default function CheckoutStepper({ steps, currentStep }: Props) {
  return (
    <nav aria-label="சேக்அவுட் படிகள்" style={{ padding: '10px 0 2px' }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: 0, margin: 0, padding: 0, listStyle: 'none' }}>
        {steps.map((step, i) => {
          const done    = i < currentStep;
          const active  = i === currentStep;
          return (
            <li key={step.id ?? `${step.label}-${i}`} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? '1' : undefined }}>
              {/* Circle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, fontFamily: FONT.display,
                  background: done ? T.leaf : active ? T.forestPrimary : T.creamAlt,
                  color: (done || active) ? '#fff' : T.muted,
                  border: active ? `2px solid ${T.goldPale}` : 'none',
                  boxShadow: active ? `0 0 0 3px rgba(240,201,110,0.25)` : 'none',
                  transition: 'all 0.2s',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{
                  fontFamily: FONT.body, fontSize: '0.62rem', whiteSpace: 'nowrap',
                  color: active ? T.goldPale : done ? 'rgba(240,201,110,0.7)' : 'rgba(240,201,110,0.4)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {step.labelTa ?? step.label}
                </span>
              </div>
              {/* Connector */}
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 16,
                  background: done ? T.leaf : 'rgba(240,201,110,0.2)', transition: 'background 0.3s' }} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
