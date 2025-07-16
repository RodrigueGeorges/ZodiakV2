import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, MessageSquare, Heart, Star, Sparkle } from 'lucide-react';

interface PlanetBadgeProps {
  planet: {
    name: string;
    sign: string;
    house?: number;
    retrograde?: boolean;
  };
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const planetIcons: { [key: string]: JSX.Element } = {
  'Soleil': <Sun className="w-4 h-4" />,
  'Lune': <Moon className="w-4 h-4" />,
  'Mercure': <MessageSquare className="w-4 h-4" />,
  'Vénus': <Heart className="w-4 h-4" />,
  'Mars': <MessageSquare className="w-4 h-4" />,
  'Jupiter': <Star className="w-4 h-4" />,
  'Saturne': <Star className="w-4 h-4" />,
  'Uranus': <Star className="w-4 h-4" />,
  'Neptune': <Star className="w-4 h-4" />,
  'Pluton': <Star className="w-4 h-4" />,
  'Ascendant': <Sparkle className="w-4 h-4" />
};

const planetColors: { [key: string]: string } = {
  'Soleil': 'from-yellow-500 to-yellow-600 text-yellow-100',
  'Lune': 'from-slate-400 to-slate-500 text-slate-100',
  'Mercure': 'from-green-500 to-green-600 text-green-100',
  'Vénus': 'from-pink-500 to-pink-600 text-pink-100',
  'Mars': 'from-red-500 to-red-600 text-red-100',
  'Jupiter': 'from-orange-500 to-orange-600 text-orange-100',
  'Saturne': 'from-indigo-500 to-indigo-600 text-indigo-100',
  'Uranus': 'from-cyan-500 to-cyan-600 text-cyan-100',
  'Neptune': 'from-blue-500 to-blue-600 text-blue-100',
  'Pluton': 'from-purple-500 to-purple-600 text-purple-100',
  'Ascendant': 'from-fuchsia-500 to-fuchsia-600 text-fuchsia-100'
};

const zodiacSymbols: { [key: string]: string } = {
  'Bélier': '♈', 'Taureau': '♉', 'Gémeaux': '♊', 'Cancer': '♋',
  'Lion': '♌', 'Vierge': '♍', 'Balance': '♎', 'Scorpion': '♏',
  'Sagittaire': '♐', 'Capricorne': '♑', 'Verseau': '♒', 'Poissons': '♓'
};

export default function PlanetBadge({ planet, variant = 'default', className = '' }: PlanetBadgeProps) {
  const colorClass = planetColors[planet.name] || 'from-gray-500 to-gray-600 text-gray-100';
  const icon = planetIcons[planet.name];
  const zodiacSymbol = zodiacSymbols[planet.sign];

  const variants = {
    default: (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${colorClass} shadow-lg border border-white/20 ${className}`}
      >
        <div className="flex items-center gap-1">
          {icon}
          <span className="font-semibold text-sm text-primary">{planet.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg">{zodiacSymbol}</span>
          <span className="font-bold text-sm text-primary">{planet.sign}</span>
          {planet.retrograde && (
            <span className="text-xs bg-primary/20 px-1 rounded text-primary">R</span>
          )}
        </div>
        {planet.house && (
          <span className="text-xs bg-white/20 px-1 rounded text-primary">Maison {planet.house}</span>
        )}
      </motion.div>
    ),
    compact: (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r ${colorClass} shadow-md ${className}`}
      >
        {icon}
        <span className="text-sm font-semibold">{planet.name}</span>
        <span className="text-sm">{zodiacSymbol}</span>
      </motion.div>
    ),
    detailed: (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className={`flex flex-col items-center p-4 rounded-xl bg-gradient-to-br ${colorClass} shadow-xl border border-white/20 ${className}`}
      >
        <div className="text-2xl mb-2">{icon}</div>
        <h4 className="font-bold text-sm mb-1 text-primary">{planet.name}</h4>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xl">{zodiacSymbol}</span>
          <span className="font-semibold text-sm text-primary">{planet.sign}</span>
        </div>
        {planet.house && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-primary">Maison {planet.house}</span>
        )}
        {planet.retrograde && (
          <span className="text-xs bg-primary/20 px-2 py-1 rounded-full mt-1 text-primary">Rétrograde</span>
        )}
      </motion.div>
    )
  };

  return variants[variant];
} 