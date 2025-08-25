import { memo } from 'react';
import { Moon, Sun, Star, Sparkle } from 'lucide-react';
import CosmicSymbol from './CosmicSymbol';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'classic' | 'cosmic';
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
};
const ringMap = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
};
const middleMap = {
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'w-36 h-36',
};
const sunMap = {
  sm: 'w-8 h-8',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
};
const centerStarMap = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};
const moonMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};
const sparkleMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const Logo = memo(function Logo({ size = 'md', className = '', variant = 'cosmic', style }: LogoProps) {
  const isMobile = size === 'sm';

  // Nouveau logo cosmique avec le symbole géométrique
  if (variant === 'cosmic') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap[size]} group ${className}`} style={style}>
        {/* Fond étoilé animé avec effet de profondeur - optimisé */}
        <div className="absolute inset-0 bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900 rounded-full opacity-25 group-hover:opacity-35 transition-opacity duration-700" />
        
        {/* Effet de glow externe bleu néon - optimisé */}
        <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
        
        {/* Étoiles décoratives avec positions optimisées pour éviter les chevauchements */}
        {!isMobile && [...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-twinkle"
            style={{
              top: `${15 + (i * 15) % 70}%`,
              left: `${10 + (i * 20) % 80}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2.5 + (i % 2) * 0.5}s`
            }}
          />
        ))}

        {/* Étoiles plus grandes - positions optimisées */}
        {!isMobile && [...Array(2)].map((_, i) => (
          <div
            key={`large-${i}`}
            className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full animate-twinkle"
            style={{
              top: `${25 + i * 30}%`,
              left: `${30 + i * 40}%`,
              animationDelay: `${1 + i * 0.6}s`,
              animationDuration: `${3.5 + i * 0.5}s`
            }}
          />
        ))}

        {/* Symbole cosmique principal avec animation optimisée */}
        <div className="relative transform group-hover:scale-105 transition-transform duration-700 animate-cosmic-pulse">
          <CosmicSymbol size={size} animated={true} />
        </div>

        {/* Effet de particules cosmiques - optimisé */}
        {!isMobile && [...Array(3)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-0.5 h-0.5 bg-blue-500 rounded-full animate-float"
            style={{
              top: `${35 + (i * 20) % 30}%`,
              left: `${40 + (i * 15) % 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i * 0.5}s`
            }}
          />
        ))}
      </div>
    );
  }

  // Logo classique original - optimisé
  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} group ${className}`} style={style}>
      {/* Outer cosmic ring - optimisé */}
      <div className={`absolute ${ringMap[size]} rounded-full border-2 border-[#F5CBA7]/30 animate-spin-slow group-hover:border-[#F5CBA7]/50 transition-colors duration-700`}>
        <Star className={`absolute -top-1.5 left-1/2 -translate-x-1/2 ${sparkleMap[size]} text-[#D8CAB8] animate-cosmic-pulse`} style={{ animation: 'twinkle 2s infinite' }} />
        <Star className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 ${sparkleMap[size]} text-[#D8CAB8] animate-cosmic-pulse`} style={{ animation: 'twinkle 2.2s infinite' }} />
        <Star className={`absolute top-1/2 -left-1.5 -translate-y-1/2 ${sparkleMap[size]} text-[#D8CAB8] animate-cosmic-pulse`} style={{ animation: 'twinkle 2.4s infinite' }} />
        <Star className={`absolute top-1/2 -right-1.5 -translate-y-1/2 ${sparkleMap[size]} text-[#D8CAB8] animate-cosmic-pulse`} style={{ animation: 'twinkle 2.6s infinite' }} />
      </div>

      {/* Middle cosmic ring - optimisé */}
      <div className={`absolute ${middleMap[size]} rounded-full border-2 border-[#F5CBA7]/30 animate-reverse-spin group-hover:border-[#F5CBA7]/50 transition-colors duration-700`}>
        <Moon className={`absolute top-1/2 -left-3 -translate-y-1/2 ${moonMap[size]} text-[#F5CBA7] animate-float`} />
        <Moon className={`absolute top-1/2 -right-3 -translate-y-1/2 ${moonMap[size]} text-[#F5CBA7] animate-float-reverse`} />
      </div>

      {/* Central sun with glowing effect - optimisé */}
      <div className="relative transform group-hover:scale-105 transition-transform duration-700">
        <div className="absolute inset-0 bg-[#D8CAB8] rounded-full blur-xl opacity-15 animate-glow group-hover:opacity-25 transition-opacity duration-700" />
        <Sun className={`${sunMap[size]} text-[#D8CAB8] animate-glow relative z-10`} />
        <Star className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${centerStarMap[size]} text-white/90`} />
      </div>

      {/* Fixed sparkles - masqués sur mobile, positions optimisées */}
      {!isMobile && <>
        <Sparkle className={`absolute -top-4 left-1/2 -translate-x-1/2 ${sparkleMap[size]} text-[#D8CAB8] animate-float`} />
        <Sparkle className={`absolute -bottom-4 left-1/2 -translate-x-1/2 ${sparkleMap[size]} text-[#D8CAB8] animate-float-delayed`} />
        <Sparkle className={`absolute top-1/2 -left-4 -translate-y-1/2 ${sparkleMap[size]} text-[#D8CAB8] animate-float-reverse`} />
        <Sparkle className={`absolute top-1/2 -right-4 -translate-y-1/2 ${sparkleMap[size]} text-[#D8CAB8] animate-float-reverse-delayed`} />
      </>}

      {/* Decorative stars - masqués sur mobile, positions optimisées */}
      {!isMobile && [...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#D8CAB8] rounded-full animate-twinkle"
          style={{
            top: `${10 + (i * 12) % 80}%`,
            left: `${15 + (i * 18) % 70}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + (i % 3) * 0.5}s`
          }}
        />
      ))}
    </div>
  );
});

export { Logo };