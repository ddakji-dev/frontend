// ddakji.jsx — visual SVG component for a folded paper ddakji

function DdakjiCard({ size = 220, seed = 0, atkLvl = 0, defLvl = 0, damaged = false, showStats = false, label = null, highlight = 'none' }) {
  const palette = paletteForSeed(seed);
  return (
    <div className={`ddakji-wrap hl-${highlight}`} style={{ width: size, height: size, position: 'relative', filter: damaged ? 'grayscale(0.4) brightness(0.95)' : 'none' }}>
      {/* Coin layer — behind paper, revealed when coin highlighted */}
      <div className="ddakji-coin-layer" aria-hidden="true">
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <radialGradient id={`coin-grad-${seed}`} cx="35%" cy="32%" r="80%">
              <stop offset="0%" stopColor="oklch(0.82 0.10 80)" />
              <stop offset="50%" stopColor="oklch(0.68 0.12 75)" />
              <stop offset="100%" stopColor="oklch(0.48 0.10 70)" />
            </radialGradient>
            <filter id={`coin-shadow-${seed}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="2"/>
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0"/>
              <feComposite in2="SourceGraphic" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* aura when highlighted */}
          <circle className="coin-aura" cx="100" cy="100" r="68" fill="oklch(0.82 0.16 80)" opacity="0"/>
          {/* coin body — Korean yeopjeon style */}
          <circle cx="100" cy="100" r="56" fill={`url(#coin-grad-${seed})`} stroke="oklch(0.32 0.06 70)" strokeWidth="1.5" filter={`url(#coin-shadow-${seed})`}/>
          <circle cx="100" cy="100" r="51" fill="none" stroke="oklch(0.42 0.08 70)" strokeWidth="0.7" opacity="0.6"/>
          {/* square hole */}
          <rect x="89" y="89" width="22" height="22" rx="1" fill="var(--ink-0)" stroke="oklch(0.35 0.06 70)" strokeWidth="0.8"/>
          {/* 4 hanja-style markings around the hole */}
          <text x="100" y="78"  textAnchor="middle" fontSize="11" fontFamily="'Gowun Batang', serif" fontWeight="700" fill="oklch(0.32 0.06 70)">常</text>
          <text x="100" y="129" textAnchor="middle" fontSize="11" fontFamily="'Gowun Batang', serif" fontWeight="700" fill="oklch(0.32 0.06 70)">通</text>
          <text x="77"  y="106" textAnchor="middle" fontSize="11" fontFamily="'Gowun Batang', serif" fontWeight="700" fill="oklch(0.32 0.06 70)">平</text>
          <text x="123" y="106" textAnchor="middle" fontSize="11" fontFamily="'Gowun Batang', serif" fontWeight="700" fill="oklch(0.32 0.06 70)">寶</text>
          {/* highlight sheen */}
          <ellipse cx="82" cy="80" rx="20" ry="8" fill="oklch(0.95 0.06 85)" opacity="0.35" transform="rotate(-30 82 80)"/>
        </svg>
      </div>

      {/* Paper layer */}
      <svg className="ddakji-paper-layer" viewBox="0 0 200 200" width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id={`paper-noise-${seed}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" stitchTiles="stitch"/>
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0"/>
            <feComposite in2="SourceGraphic" operator="in"/>
          </filter>
          <linearGradient id={`grad-tl-${seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.tl} stopOpacity="1"/>
            <stop offset="100%" stopColor={palette.tl} stopOpacity="0.82"/>
          </linearGradient>
          <linearGradient id={`grad-tr-${seed}`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.tr} stopOpacity="1"/>
            <stop offset="100%" stopColor={palette.tr} stopOpacity="0.82"/>
          </linearGradient>
          <linearGradient id={`grad-bl-${seed}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={palette.bl} stopOpacity="1"/>
            <stop offset="100%" stopColor={palette.bl} stopOpacity="0.82"/>
          </linearGradient>
          <linearGradient id={`grad-br-${seed}`} x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={palette.br} stopOpacity="1"/>
            <stop offset="100%" stopColor={palette.br} stopOpacity="0.82"/>
          </linearGradient>
        </defs>

        {/* outer shadow */}
        <rect x="6" y="10" width="188" height="188" rx="3" fill="oklch(0.25 0.01 50 / 0.18)" />

        {/* base square */}
        <g transform="translate(100 100) rotate(0) translate(-100 -100)">
          <rect x="4" y="4" width="192" height="192" rx="2" fill={palette.center} stroke="oklch(0.4 0.02 50 / 0.3)" strokeWidth="0.5"/>

          {/* 4 folded triangle flaps */}
          {/* top */}
          <polygon className="paper-flap" points="14,14 186,14 100,100" fill={`url(#grad-tl-${seed})`} />
          {/* right */}
          <polygon className="paper-flap" points="186,14 186,186 100,100" fill={`url(#grad-tr-${seed})`} />
          {/* bottom */}
          <polygon className="paper-flap" points="186,186 14,186 100,100" fill={`url(#grad-bl-${seed})`} />
          {/* left */}
          <polygon className="paper-flap" points="14,186 14,14 100,100" fill={`url(#grad-br-${seed})`} />

          {/* fold lines */}
          <line x1="14" y1="14" x2="100" y2="100" stroke="oklch(0.2 0.01 50 / 0.25)" strokeWidth="0.6"/>
          <line x1="186" y1="14" x2="100" y2="100" stroke="oklch(0.2 0.01 50 / 0.25)" strokeWidth="0.6"/>
          <line x1="186" y1="186" x2="100" y2="100" stroke="oklch(0.2 0.01 50 / 0.25)" strokeWidth="0.6"/>
          <line x1="14" y1="186" x2="100" y2="100" stroke="oklch(0.2 0.01 50 / 0.25)" strokeWidth="0.6"/>

          {/* center hint */}
          <circle cx="100" cy="100" r="2" fill="oklch(0.2 0.01 50 / 0.35)"/>

          {/* paper grain overlay */}
          <rect x="4" y="4" width="192" height="192" rx="2" fill="white" filter={`url(#paper-noise-${seed})`} opacity="0.6"/>

          {/* outer paper edge highlight */}
          <rect x="4" y="4" width="192" height="192" rx="2" fill="none" stroke="oklch(0.98 0.01 80 / 0.5)" strokeWidth="0.8"/>

          {/* damage tears */}
          {damaged && (
            <g>
              <path d="M 60 14 L 70 50 L 55 55 L 65 90 L 50 100 L 70 130 L 60 186" stroke="oklch(0.25 0.01 50)" strokeWidth="0.8" fill="none" opacity="0.6"/>
              <path d="M 14 70 L 60 65 L 70 110" stroke="oklch(0.25 0.01 50)" strokeWidth="0.8" fill="none" opacity="0.5"/>
            </g>
          )}
        </g>
      </svg>
      {showStats && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--ink-0)',
          color: 'var(--paper-0)',
          padding: '3px 10px',
          borderRadius: 999,
          fontSize: 11,
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          zIndex: 5,
        }}>
          +{atkLvl} <span style={{ opacity: 0.5 }}>재질</span> · +{defLvl} <span style={{ opacity: 0.5 }}>동전</span>
        </div>
      )}
      {label && (
        <div style={{
          position: 'absolute',
          bottom: -28,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: "'Gowun Batang', serif",
          fontSize: 13,
          color: 'var(--ink-2)',
          letterSpacing: '0.1em',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// Small icon-sized variant for collection grid
function DdakjiThumb({ seed = 0, size = 96 }) {
  return <DdakjiCard size={size} seed={seed} />;
}

// Paper scrap icon
function PaperScrapIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M 4 6 L 14 4 L 20 9 L 18 18 L 6 19 L 3 14 Z" fill="oklch(0.78 0.08 80)" stroke="oklch(0.4 0.04 60)" strokeWidth="0.8"/>
      <path d="M 14 4 L 14 9 L 20 9" fill="none" stroke="oklch(0.4 0.04 60)" strokeWidth="0.8"/>
      <line x1="7" y1="11" x2="14" y2="11" stroke="oklch(0.4 0.04 60)" strokeWidth="0.6" opacity="0.4"/>
      <line x1="7" y1="13" x2="16" y2="13" stroke="oklch(0.4 0.04 60)" strokeWidth="0.6" opacity="0.4"/>
      <line x1="7" y1="15" x2="13" y2="15" stroke="oklch(0.4 0.04 60)" strokeWidth="0.6" opacity="0.4"/>
    </svg>
  );
}

Object.assign(window, { DdakjiCard, DdakjiThumb, PaperScrapIcon });
