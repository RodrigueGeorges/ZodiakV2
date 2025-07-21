import { Sun, Star } from 'lucide-react';
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-32 h-32',
};
const centerMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-24 h-24',
};
const glyphMap = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

const zodiacGlyphs = [
  { symbol: '♈', label: 'Bélier', angle: 0 },
  { symbol: '♋', label: 'Cancer', angle: 60 },
  { symbol: '♎', label: 'Balance', angle: 120 },
  { symbol: '♑', label: 'Capricorne', angle: 180 },
  { symbol: '♓', label: 'Poissons', angle: 240 },
  { symbol: '♌', label: 'Lion', angle: 300 },
];

// Animation CSS orbitale à ajouter dans index.css :
// @keyframes orbit-cosmic {
//   0% { transform: rotate(0deg) translateY(-110%) rotate(0deg); }
//   100% { transform: rotate(360deg) translateY(-110%) rotate(-360deg); }
// }
// .orbit-cosmic { animation: orbit-cosmic 16s linear infinite; transform-origin: 50% 60%; }

export function Logo({ size = 'md', className = '', style }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`} style={style}>
      {/* Cercle central lumineux (soleil/étoile) */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-30 animate-glow" />
        <Sun className={`${centerMap[size]} text-primary animate-glow relative z-10`} />
        <Star className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${glyphMap[size]} text-primary/90`} />
      </div>
      {/* Glyphes zodiacaux dorés en orbite harmonieuse */}
      {zodiacGlyphs.map((g, i) => (
        <div
          key={g.label}
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `rotate(${g.angle}deg)`
          }}
        >
          <span
            className={`${glyphMap[size]} text-primary font-bold orbit-cosmic`}
            style={{
              display: 'inline-block',
              transform: 'translateY(-110%)',
              animationDelay: `${i * 2.5}s`
            }}
            aria-label={g.label}
          >
            {g.symbol}
          </span>
        </div>
      ))}
    </div>
  );
}

export default Logo;