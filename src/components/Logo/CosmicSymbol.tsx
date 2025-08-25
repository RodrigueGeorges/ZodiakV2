import React from 'react';

interface CosmicSymbolProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: { width: 64, height: 64, strokeWidth: 2 },
  md: { width: 128, height: 128, strokeWidth: 2.5 },
  lg: { width: 192, height: 192, strokeWidth: 3.5 },
};

export const CosmicSymbol: React.FC<CosmicSymbolProps> = ({ 
  size = 'md', 
  className = '',
  animated = true 
}) => {
  const { width, height, strokeWidth } = sizeMap[size];
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Proportions optimisées pour éviter les chevauchements
  const outerRadius = Math.min(width, height) * 0.38; // Réduit légèrement
  const innerRadius = outerRadius * 0.62; // Ajusté pour éviter le chevauchement
  const crosshairLength = outerRadius * 0.1; // Réduit pour éviter les débordements
  
  // Triangle "A" optimisé avec espacement
  const triangleHeight = innerRadius * 0.8; // Réduit pour plus d'espace
  const triangleWidth = triangleHeight * 0.7; // Plus fin pour éviter les chevauchements
  const triangleTop = centerY - triangleHeight / 2;
  const triangleBottom = centerY + triangleHeight / 2;
  const triangleLeft = centerX - triangleWidth / 2;
  const triangleRight = centerX + triangleWidth / 2;
  const triangleMiddle = centerY + triangleHeight * 0.2; // Barre horizontale plus basse

  // Calcul des positions des crosshairs pour éviter les débordements
  const crosshairTop = centerY - outerRadius - crosshairLength;
  const crosshairBottom = centerY + outerRadius + crosshairLength;
  const crosshairLeft = centerX - outerRadius - crosshairLength;
  const crosshairRight = centerX + outerRadius + crosshairLength;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={`${animated ? 'animate-cosmic-pulse' : ''}`}
        style={{ 
          filter: animated ? 'drop-shadow(0 0 8px rgba(0, 191, 255, 0.3))' : 'none',
          transition: 'filter 0.3s ease-in-out'
        }}
      >
        <defs>
          {/* Gradient optimisé pour le glow */}
          <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00BFFF" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#0080FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#004080" stopOpacity="0" />
          </radialGradient>
          
          {/* Gradient pour les cercles */}
          <radialGradient id="circleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00BFFF" stopOpacity="1" />
            <stop offset="80%" stopColor="#0080FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#004080" stopOpacity="0.1" />
          </radialGradient>
          
          {/* Filtre de glow optimisé */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Filtre néon plus subtil */}
          <filter id="neon" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="neonBlur"/>
            <feMerge> 
              <feMergeNode in="neonBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Cercle de glow de fond - optimisé */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius + 8}
          fill="url(#neonGlow)"
          opacity="0.15"
        />

        {/* Cercle extérieur */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill="none"
          stroke="url(#circleGlow)"
          strokeWidth={strokeWidth}
          filter="url(#glow)"
        />

        {/* Cercle intérieur */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="none"
          stroke="url(#circleGlow)"
          strokeWidth={strokeWidth * 0.8}
          filter="url(#glow)"
        />

        {/* Triangle "A" - côté gauche */}
        <path
          d={`M ${triangleLeft} ${triangleBottom} L ${centerX} ${triangleTop} L ${centerX} ${triangleMiddle} Z`}
          fill="none"
          stroke="#00BFFF"
          strokeWidth={strokeWidth}
          filter="url(#neon)"
        />

        {/* Triangle "A" - côté droit */}
        <path
          d={`M ${triangleRight} ${triangleBottom} L ${centerX} ${triangleTop} L ${centerX} ${triangleMiddle} Z`}
          fill="none"
          stroke="#00BFFF"
          strokeWidth={strokeWidth}
          filter="url(#neon)"
        />

        {/* Barre horizontale du "A" - optimisée */}
        <line
          x1={triangleLeft + triangleWidth * 0.3}
          y1={triangleMiddle}
          x2={triangleRight - triangleWidth * 0.3}
          y2={triangleMiddle}
          stroke="#00BFFF"
          strokeWidth={strokeWidth * 0.6}
          filter="url(#neon)"
        />

        {/* Lignes de visée - optimisées pour éviter les débordements */}
        <line
          x1={centerX}
          y1={crosshairTop}
          x2={centerX}
          y2={centerY - outerRadius}
          stroke="#00BFFF"
          strokeWidth={strokeWidth * 0.4}
          filter="url(#neon)"
        />
        <line
          x1={centerX}
          y1={centerY + outerRadius}
          x2={centerX}
          y2={crosshairBottom}
          stroke="#00BFFF"
          strokeWidth={strokeWidth * 0.4}
          filter="url(#neon)"
        />
        <line
          x1={crosshairLeft}
          y1={centerY}
          x2={centerX - outerRadius}
          y2={centerY}
          stroke="#00BFFF"
          strokeWidth={strokeWidth * 0.4}
          filter="url(#neon)"
        />
        <line
          x1={centerX + outerRadius}
          y1={centerY}
          x2={crosshairRight}
          y2={centerY}
          stroke="#00BFFF"
          strokeWidth={strokeWidth * 0.4}
          filter="url(#neon)"
        />

        {/* Points de visée - optimisés */}
        <circle
          cx={centerX}
          cy={crosshairTop}
          r={strokeWidth * 0.5}
          fill="#00BFFF"
          filter="url(#neon)"
        />
        <circle
          cx={centerX}
          cy={crosshairBottom}
          r={strokeWidth * 0.5}
          fill="#00BFFF"
          filter="url(#neon)"
        />
        <circle
          cx={crosshairLeft}
          cy={centerY}
          r={strokeWidth * 0.5}
          fill="#00BFFF"
          filter="url(#neon)"
        />
        <circle
          cx={crosshairRight}
          cy={centerY}
          r={strokeWidth * 0.5}
          fill="#00BFFF"
          filter="url(#neon)"
        />
      </svg>
    </div>
  );
};

export default CosmicSymbol;
