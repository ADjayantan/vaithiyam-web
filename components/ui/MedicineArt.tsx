import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLeaf,
  faSeedling,
  faMortarPestle,
  faShieldVirus,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { getMedicineInitials, type SeedMedicine } from '@/lib/medicineData';

const toneClass: Record<SeedMedicine['artTone'], string> = {
  emerald: 'linear-gradient(145deg, rgba(31,138,98,0.22),   rgba(220,248,238,0.84))',
  teal:    'linear-gradient(145deg, rgba(0,200,194,0.20),   rgba(210,248,245,0.82))',
  gold:    'linear-gradient(145deg, rgba(244,213,129,0.34), rgba(255,248,222,0.84))',
  cyan:    'linear-gradient(145deg, rgba(6,182,212,0.20),   rgba(207,244,252,0.82))',
  leaf:    'linear-gradient(145deg, rgba(57,143,89,0.22),   rgba(234,248,240,0.84))',
  coral:   'linear-gradient(145deg, rgba(198,91,71,0.18),   rgba(255,232,224,0.84))',
};

const traditionIcon: Record<SeedMedicine['tradition'], IconDefinition> = {
  siddha:   faMortarPestle,
  ayurveda: faLeaf,
  natural:  faSeedling,
};

const traditionColor: Record<SeedMedicine['tradition'], string> = {
  siddha:   'rgba(31, 138, 98, 0.72)',
  ayurveda: 'rgba(34, 96, 56, 0.72)',
  natural:  'rgba(57, 143, 89, 0.68)',
};

export function MedicineArt({
  product,
  compact = false,
}: {
  product: SeedMedicine | { nameEn: string; artTone?: SeedMedicine['artTone']; tradition?: SeedMedicine['tradition']; prescriptionRequired?: boolean };
  compact?: boolean;
}) {
  const initials   = getMedicineInitials(product.nameEn);
  const background = toneClass[(product as SeedMedicine).artTone ?? 'emerald'];
  const tradition  = (product as SeedMedicine).tradition ?? 'siddha';
  const icon       = traditionIcon[tradition] ?? faLeaf;
  const iconColor  = traditionColor[tradition] ?? 'rgba(31, 138, 98, 0.72)';

  const symbolSize    = compact ? 58 : 82;
  const symbolRadius  = compact ? 20 : 26;
  const symbolFont    = compact ? '1.3rem' : '2.2rem';
  const mainIconSize  = compact ? 24 : 36;

  return (
    <div className="vt-product-art" style={{ background }}>
      {/* Central symbol box */}
      <div
        className="vt-art-symbol"
        style={{
          width:        symbolSize,
          height:       symbolSize,
          borderRadius: symbolRadius,
          fontSize:     symbolFont,
          display:      'flex',
          flexDirection:'column',
          alignItems:   'center',
          justifyContent: 'center',
          gap:          compact ? 3 : 5,
        }}
      >
        {/* Tradition icon — large, clear, instantly recognisable */}
        <FontAwesomeIcon
          aria-hidden="true"
          icon={icon}
          style={{
            width:  mainIconSize,
            height: mainIconSize,
            color:  iconColor,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
          }}
        />
        {/* Initials sub-label */}
        {!compact && (
          <span
            style={{
              fontSize:   '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color:      'rgba(10, 30, 20, 0.52)',
              lineHeight: 1,
              fontFamily: 'var(--vt-font-display)',
            }}
          >
            {initials || 'VT'}
          </span>
        )}
      </div>

      {/* Decorative leaf — bottom left */}
      <FontAwesomeIcon
        aria-hidden="true"
        icon={faLeaf}
        style={{
          width:    compact ? 14 : 18,
          height:   compact ? 14 : 18,
          position: 'absolute',
          left:     '14%',
          bottom:   '13%',
          color:    'rgba(31, 138, 98, 0.28)',
        }}
      />

      {/* Decorative star — top right */}
      <FontAwesomeIcon
        aria-hidden="true"
        icon={faStar}
        style={{
          width:    compact ? 12 : 16,
          height:   compact ? 12 : 16,
          position: 'absolute',
          right:    '16%',
          top:      '14%',
          color:    'rgba(217, 167, 67, 0.38)',
        }}
      />

      {/* Rx prescription badge */}
      {product.prescriptionRequired && (
        <div
          className="vt-badge vt-badge-danger"
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
        >
          <FontAwesomeIcon icon={faShieldVirus} style={{ width: 12, height: 12 }} /> Rx
        </div>
      )}
    </div>
  );
}
