import React from 'react';
import { motion } from 'framer-motion';

interface ZodiacWheelProps {
  natalChart: any;
  className?: string;
}

const zodiacSigns = [
  { name: 'Bélier', symbol: '♈', startDegree: 0, color: '#D8CAB8' },
  { name: 'Taureau', symbol: '♉', startDegree: 30, color: '#D8CAB8' },
  { name: 'Gémeaux', symbol: '♊', startDegree: 60, color: '#D8CAB8' },
  { name: 'Cancer', symbol: '♋', startDegree: 90, color: '#D8CAB8' },
  { name: 'Lion', symbol: '♌', startDegree: 120, color: '#D8CAB8' },
  { name: 'Vierge', symbol: '♍', startDegree: 150, color: '#D8CAB8' },
  { name: 'Balance', symbol: '♎', startDegree: 180, color: '#D8CAB8' },
  { name: 'Scorpion', symbol: '♏', startDegree: 210, color: '#D8CAB8' },
  { name: 'Sagittaire', symbol: '♐', startDegree: 240, color: '#D8CAB8' },
  { name: 'Capricorne', symbol: '♑', startDegree: 270, color: '#D8CAB8' },
  { name: 'Verseau', symbol: '♒', startDegree: 300, color: '#D8CAB8' },
  { name: 'Poissons', symbol: '♓', startDegree: 330, color: '#D8CAB8' }
];

const planetSymbols: { [key: string]: string } = {
  'Soleil': '☀️',
  'Lune': '🌙',
  'Mercure': '☿',
  'Vénus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturne': '♄',
  'Uranus': '♅',
  'Neptune': '♆',
  'Pluton': '♇',
  'Ascendant': '✨'
};

const planetColors: { [key: string]: string } = {
  'Soleil': '#D8CAB8',
  'Lune': '#D8CAB8',
  'Mercure': '#D8CAB8',
  'Vénus': '#D8CAB8',
  'Mars': '#D8CAB8',
  'Jupiter': '#D8CAB8',
  'Saturne': '#D8CAB8',
  'Uranus': '#D8CAB8',
  'Neptune': '#D8CAB8',
  'Pluton': '#D8CAB8',
  'Ascendant': '#D8CAB8'
};

export default function ZodiacWheel({ natalChart, className = '' }: ZodiacWheelProps) {
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  const getPlanetPosition = (planet: any) => {
    const angle = (planet.longitude / 360) * 2 * Math.PI;
    const planetRadius = radius - 20;
    return {
      x: centerX + planetRadius * Math.cos(angle - Math.PI / 2),
      y: centerY + planetRadius * Math.sin(angle - Math.PI / 2)
    };
  };

  const getSignPosition = (sign: any, index: number) => {
    const angle = (sign.startDegree / 360) * 2 * Math.PI;
    const signRadius = radius + 15;
    return {
      x: centerX + signRadius * Math.cos(angle - Math.PI / 2),
      y: centerY + signRadius * Math.sin(angle - Math.PI / 2)
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`relative ${className}`}
    >
      <svg width="300" height="300" viewBox="0 0 300 300" className="w-full h-auto">
        {/* Cercle extérieur */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="url(#gradient-border)"
          strokeWidth="2"
          className="drop-shadow-glow"
        />

        {/* Définition du gradient pour la bordure */}
        <defs>
          <linearGradient id="gradient-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8CAB8" />
            <stop offset="50%" stopColor="#BFAF80" />
            <stop offset="100%" stopColor="#00CED1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Lignes des maisons astrologiques */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 / 360) * 2 * Math.PI;
          const x1 = centerX + (radius - 10) * Math.cos(angle - Math.PI / 2);
          const y1 = centerY + (radius - 10) * Math.sin(angle - Math.PI / 2);
          const x2 = centerX + (radius + 10) * Math.cos(angle - Math.PI / 2);
          const y2 = centerY + (radius + 10) * Math.sin(angle - Math.PI / 2);
          
          return (
            <line
              key={`house-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
          );
        })}

        {/* Signes du zodiaque */}
        {zodiacSigns.map((sign, index) => {
          const pos = getSignPosition(sign, index);
          return (
            <motion.g
              key={sign.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fill={sign.color}
                className="font-bold"
                filter="url(#glow)"
              >
                {sign.symbol}
              </text>
            </motion.g>
          );
        })}

        {/* Planètes du thème natal */}
        {natalChart?.planets?.map((planet: any, index: number) => {
          const pos = getPlanetPosition(planet);
          return (
            <motion.g
              key={planet.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r="8"
                fill={planetColors[planet.name] || '#FFFFFF'}
                stroke="#000000"
                strokeWidth="1"
                filter="url(#glow)"
              />
              <text
                x={pos.x}
                y={pos.y + 25}
                textAnchor="middle"
                fontSize="10"
                fill="white"
                className="font-semibold"
              >
                {planet.name}
              </text>
            </motion.g>
          );
        })}

        {/* Ascendant */}
        {natalChart?.ascendant && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <circle
              cx={centerX}
              cy={centerY - radius + 20}
              r="6"
              fill={planetColors['Ascendant']}
              stroke="#000000"
              strokeWidth="1"
              filter="url(#glow)"
            />
            <text
              x={centerX}
              y={centerY - radius + 45}
              textAnchor="middle"
              fontSize="10"
              fill="white"
              className="font-semibold"
            >
              ASC
            </text>
          </motion.g>
        )}

        {/* Cercle central */}
        <circle
          cx={centerX}
          cy={centerY}
          r="15"
          fill="url(#gradient-border)"
          className="drop-shadow-glow"
        />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="white"
          className="font-bold"
        >
          🌟
        </text>
      </svg>
    </motion.div>
  );
} 