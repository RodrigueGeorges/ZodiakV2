import React from 'react';
import { Logo } from './Logo';

export const LogoTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-cosmic-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold font-cinzel text-primary mb-6 md:mb-8 text-center">
          Test du Nouveau Logo Cosmique
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Nouveau logo cosmique */}
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-semibold text-primary mb-4">Nouveau Logo Cosmique</h2>
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center">
                <p className="text-gray-400 mb-2 text-sm">Mobile (sm)</p>
                <Logo size="sm" variant={'cosmic' as const} />
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-2 text-sm">Desktop (md)</p>
                <Logo size="md" variant="cosmic" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-2 text-sm">Large (lg)</p>
                <Logo size="lg" variant="cosmic" />
              </div>
            </div>
          </div>
          
          {/* Logo classique */}
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-semibold text-primary mb-4">Logo Classique</h2>
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center">
                <p className="text-gray-400 mb-2 text-sm">Mobile (sm)</p>
                <Logo size="sm" variant="classic" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-2 text-sm">Desktop (md)</p>
                <Logo size="md" variant="classic" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-2 text-sm">Large (lg)</p>
                <Logo size="lg" variant="classic" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Comparaison côte à côte */}
        <div className="mb-12">
          <h2 className="text-lg md:text-xl font-semibold text-primary mb-6 text-center">Comparaison Côte à Côte</h2>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-12">
            <div className="text-center">
              <p className="text-gray-400 mb-3 text-sm">Nouveau Cosmique</p>
              <Logo size="md" variant="cosmic" />
              <p className="text-gray-500 mt-2 text-xs">Bleu néon, géométrique</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 mb-3 text-sm">Classique</p>
              <Logo size="md" variant="classic" />
              <p className="text-gray-500 mt-2 text-xs">Doré, astrologique</p>
            </div>
          </div>
        </div>

        {/* Test responsive */}
        <div className="mb-12">
          <h2 className="text-lg md:text-xl font-semibold text-primary mb-6 text-center">Test Responsive</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-400 mb-2 text-xs">XS</p>
              <Logo size="sm" variant="cosmic" />
            </div>
            <div className="text-center">
              <p className="text-gray-400 mb-2 text-xs">SM</p>
              <Logo size="sm" variant="cosmic" />
            </div>
            <div className="text-center">
              <p className="text-gray-400 mb-2 text-xs">MD</p>
              <Logo size="md" variant="cosmic" />
            </div>
            <div className="text-center">
              <p className="text-gray-400 mb-2 text-xs">LG</p>
              <Logo size="lg" variant="cosmic" />
            </div>
          </div>
        </div>

        {/* Informations techniques */}
        <div className="bg-cosmic-800 rounded-lg p-6 border border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-4">Informations Techniques</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-primary mb-2">Nouveau Logo Cosmique</h4>
              <ul className="space-y-1">
                <li>• Symbole géométrique "A" avec cercles concentriques</li>
                <li>• Couleurs : Bleu néon (#00BFFF) avec effets de glow</li>
                <li>• Animations : Pulse cosmique et effets de particules</li>
                <li>• Responsive : 3 tailles (sm, md, lg)</li>
                <li>• Effets : Glow, néon, particules étoilées</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Logo Classique</h4>
              <ul className="space-y-1">
                <li>• Design astrologique avec soleil, lune et étoiles</li>
                <li>• Couleurs : Doré (#D8CAB8) et bronze (#BFAF80)</li>
                <li>• Animations : Rotation, float et twinkle</li>
                <li>• Responsive : 3 tailles (sm, md, lg)</li>
                <li>• Effets : Glow doré et animations orbitales</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoTest;
