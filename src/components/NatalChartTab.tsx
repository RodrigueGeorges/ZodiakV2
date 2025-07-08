import React, { useState, useEffect } from 'react';
import { Sun, Moon, MessageSquare, Heart, Star, Sparkle } from 'lucide-react';
import OpenAIService from '../lib/services/OpenAIService';
import { StorageService } from '../lib/storage';
import InteractiveCard from './InteractiveCard';
import NatalSignature from './NatalSignature';
import CosmicLoader from './CosmicLoader';
import type { Profile } from '../lib/types/supabase';
import StarryBackground from './StarryBackground';

interface NatalChartTabProps {
  profile: Profile;
}

function NatalChartTab({ profile }: NatalChartTabProps) {
  const [astroSummary, setAstroSummary] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = profile?.name?.split(' ')[0] || 'Utilisateur';
  const natalChart = profile?.natal_chart ? 
    (typeof profile.natal_chart === 'string' ? JSON.parse(profile.natal_chart) : profile.natal_chart) 
    : null;

  const sunSign = natalChart?.planets?.find((p: { name: string; sign: string }) => p.name === 'Soleil')?.sign || 'N/A';
  const moonSign = natalChart?.planets?.find((p: { name: string; sign: string }) => p.name === 'Lune')?.sign || 'N/A';
  const ascendantSign = natalChart?.ascendant?.sign || 'N/A';

  // Après avoir reçu astroSummary (texte généré par OpenAI), découper en parties : accroche, soleil, lune, ascendant, mantra
  const [accroche, setAccroche] = useState<string | null>(null);
  const [descSoleil, setDescSoleil] = useState<string | null>(null);
  const [descLune, setDescLune] = useState<string | null>(null);
  const [descAscendant, setDescAscendant] = useState<string | null>(null);
  const [mantra, setMantra] = useState<string | null>(null);

  useEffect(() => {
    if (!astroSummary) return;
    // Découpage naïf basé sur les emojis et la structure demandée dans le prompt
    const lines = astroSummary.split('\n').map(l => l.trim()).filter(Boolean);
    setAccroche(lines[0] || null);
    setDescSoleil(lines.find(l => l.startsWith('☀️')) || null);
    setDescLune(lines.find(l => l.startsWith('🌙')) || null);
    setDescAscendant(lines.find(l => l.startsWith('✨')) || null);
    setMantra(lines.find(l => l.includes('🌟')) || lines[lines.length-1] || null);
  }, [astroSummary]);

  // On charge d'abord le résumé depuis Supabase si présent
  useEffect(() => {
    const loadOrGenerateSummary = async () => {
      if (!natalChart || !profile) return;
      
      // D'abord, essayer de charger le résumé existant depuis le profil
      if (profile.natal_summary && !astroSummary) {
        setAstroSummary(profile.natal_summary);
        return;
      }
      
      // Si pas de résumé existant et qu'on n'en a pas déjà un, en générer un nouveau
      if (!profile.natal_summary && !astroSummary) {
        setIsLoading(true);
        try {
          const summaryResponse = await OpenAIService.generateNatalSummary(natalChart, firstName);
          if (summaryResponse.success && summaryResponse.data) {
            setAstroSummary(summaryResponse.data);
            // Sauvegarder le résumé dans Supabase pour éviter les futurs appels OpenAI
            const updatedProfile = { ...profile, natal_summary: summaryResponse.data };
            await StorageService.saveProfile(updatedProfile);
          } else {
            throw new Error('Erreur lors de la génération du résumé');
          }
        } catch (err) {
          console.error('Erreur lors de la génération du résumé:', err);
          setAstroSummary(`${firstName}, votre signature astrale révèle un Soleil en ${sunSign}, une Lune en ${moonSign} et un Ascendant en ${ascendantSign}. Cette combinaison unique façonne votre personnalité et votre façon d'aborder la vie.`);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadOrGenerateSummary();
  }, [natalChart, profile, astroSummary, firstName, sunSign, moonSign, ascendantSign]);

  useEffect(() => {
    const generateInterpretation = async () => {
      // Optimisation : ne jamais appeler OpenAI si profile.natal_chart_interpretation existe déjà
      if (!natalChart || !profile) return;
      
      if (profile.natal_chart_interpretation) {
        setInterpretation(profile.natal_chart_interpretation);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        // console.log('🔄 Génération de l\'interprétation du thème natal...');
        const interpretationResponse = await OpenAIService.generateNatalChartInterpretation(natalChart, firstName);
        if (interpretationResponse.success && interpretationResponse.data) {
          setInterpretation(interpretationResponse.data);
          const updatedProfile = { ...profile, natal_chart_interpretation: interpretationResponse.data };
          await StorageService.saveProfile(updatedProfile);
          // console.log('✅ Interprétation générée et sauvegardée');
        } else {
          throw new Error('Erreur lors de la génération de l\'interprétation');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la génération de votre interprétation.');
        console.error('❌ Erreur lors de la génération de l\'interprétation:', err);
      } finally {
        setIsLoading(false);
      }
    };
    generateInterpretation();
  }, [natalChart, profile?.natal_chart_interpretation, profile]);

  // Parsing de l'interprétation détaillée pour n'afficher que le champ 'data' si c'est un JSON
  let interpretationText = interpretation;
  try {
    const parsed = JSON.parse(interpretation || '');
    if (parsed && typeof parsed === 'object' && parsed.data) {
      interpretationText = parsed.data;
    }
  } catch {
    // Ce n'est pas du JSON, on garde tel quel
  }

  if (!natalChart) {
    return (
      <InteractiveCard className="p-8 text-center bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 rounded-2xl shadow-lg border border-primary/20">
        <div className="text-6xl mb-4">🌌</div>
        <h3 className="text-xl font-cinzel font-bold mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">Thème Natal non disponible</h3>
        <p className="text-gray-400 mb-6">
          Veuillez compléter vos informations de naissance dans votre profil pour calculer votre thème natal.
        </p>
        <button 
          onClick={() => window.location.href = '/profile'}
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg"
        >
          Compléter mon profil
        </button>
      </InteractiveCard>
    );
  }

  // Générer dynamiquement toutes les planètes principales
  const planetIconMap: { [key: string]: JSX.Element } = {
    Soleil: <Sun className="w-8 h-8" />,
    Lune: <Moon className="w-8 h-8" />,
    Mercure: <MessageSquare className="w-8 h-8" />,
    Vénus: <Heart className="w-8 h-8" />,
    Mars: <MessageSquare className="w-8 h-8" />,
    Jupiter: <Star className="w-8 h-8" />,
    Saturne: <Star className="w-8 h-8" />,
    Uranus: <Star className="w-8 h-8" />,
    Neptune: <Star className="w-8 h-8" />,
    Pluton: <Star className="w-8 h-8" />,
    Ascendant: <Sparkle className="w-8 h-8" />
  };
  const planetColorMap: { [key: string]: string } = {
    Soleil: 'text-yellow-400',
    Lune: 'text-slate-300',
    Mercure: 'text-green-400',
    Vénus: 'text-pink-400',
    Mars: 'text-red-400',
    Jupiter: 'text-orange-400',
    Saturne: 'text-indigo-400',
    Uranus: 'text-cyan-400',
    Neptune: 'text-blue-400',
    Pluton: 'text-purple-400',
    Ascendant: 'text-fuchsia-400'
  };
  const planetBgMap: { [key: string]: string } = {
    Soleil: 'from-yellow-900/30 to-yellow-900/10',
    Lune: 'from-slate-800/40 to-slate-900/10',
    Mercure: 'from-green-900/30 to-green-900/10',
    Vénus: 'from-pink-900/30 to-pink-900/10',
    Mars: 'from-red-900/30 to-red-900/10',
    Jupiter: 'from-orange-900/30 to-orange-900/10',
    Saturne: 'from-indigo-900/30 to-indigo-900/10',
    Uranus: 'from-cyan-900/30 to-cyan-900/10',
    Neptune: 'from-blue-900/30 to-blue-900/10',
    Pluton: 'from-purple-900/30 to-purple-900/10',
    Ascendant: 'from-fuchsia-900/30 to-fuchsia-900/10'
  };
  const planetBorderMap: { [key: string]: string } = {
    Soleil: 'border-yellow-400/20',
    Lune: 'border-slate-300/10',
    Mercure: 'border-green-400/20',
    Vénus: 'border-pink-400/20',
    Mars: 'border-red-400/20',
    Jupiter: 'border-orange-400/20',
    Saturne: 'border-indigo-400/20',
    Uranus: 'border-cyan-400/20',
    Neptune: 'border-blue-400/20',
    Pluton: 'border-purple-400/20',
    Ascendant: 'border-fuchsia-400/20'
  };
  const planetDescriptionMap: { [key: string]: string } = {
    Soleil: 'Votre identité et votre volonté',
    Lune: 'Vos émotions et votre intuition',
    Mercure: 'Votre communication et pensée',
    Vénus: 'Vos valeurs et relations',
    Mars: 'Votre énergie et actions',
    Jupiter: 'Votre expansion et chance',
    Saturne: 'Votre structure et discipline',
    Uranus: 'Votre originalité et innovation',
    Neptune: 'Votre spiritualité et rêves',
    Pluton: 'Votre transformation et pouvoir',
    Ascendant: 'Votre apparence et première impression'
  };
  // Générer la liste des planètes à afficher
  let allPlanets: { name: string; sign: string }[] = natalChart?.planets ? [...natalChart.planets] : [];
  if (natalChart?.ascendant?.sign) {
    allPlanets.unshift({ name: 'Ascendant', sign: natalChart.ascendant.sign });
  }

  return (
    <div className="space-y-6 pt-2 md:pt-2 flex flex-col justify-start">
      {/* En-tête avec signature astrale */}
      <div className="text-center mb-0 mt-0">
        <h2 className="text-2xl md:text-3xl font-cinzel font-bold mb-2 md:mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
          Votre Thème Natal
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg">
          Découvrez votre carte du ciel de naissance, {firstName}. Chaque planète révèle une facette unique de votre personnalité.
        </p>
        <div className="mt-2 mb-2 text-primary font-cinzel text-base md:text-lg">
          <NatalSignature sunSign={sunSign} moonSign={moonSign} ascendantSign={ascendantSign} />
        </div>
      </div>

      {/* Résumé astrologique */}
      {astroSummary && (
        <InteractiveCard className="relative bg-gradient-to-br from-cosmic-800/90 to-cosmic-900/90 border-primary/30 shadow-2xl rounded-3xl p-8 overflow-hidden animate-fade-in">
          {/* Fond étoilé animé */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <StarryBackground />
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-cosmic-800/40 to-cosmic-900/90" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Accroche cosmique */}
            {accroche && (
              <div className="text-2xl md:text-3xl font-cinzel text-primary drop-shadow-glow text-center">
                {accroche}
              </div>
            )}
            {/* Portrait en 3 astres */}
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-2">
              {descSoleil && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl">☀️</span>
                  <span className="font-bold text-yellow-300">{sunSign}</span>
                  <span className="text-center text-gray-200">{descSoleil.replace('☀️', '').trim()}</span>
                </div>
              )}
              {descLune && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl">🌙</span>
                  <span className="font-bold text-blue-200">{moonSign}</span>
                  <span className="text-center text-gray-200">{descLune.replace('🌙', '').trim()}</span>
                </div>
              )}
              {descAscendant && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl">✨</span>
                  <span className="font-bold text-fuchsia-300">{ascendantSign}</span>
                  <span className="text-center text-gray-200">{descAscendant.replace('✨', '').trim()}</span>
                </div>
              )}
            </div>
            {/* Mantra */}
            {mantra && (
              <div className="mt-6 px-6 py-3 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-xl shadow-inner text-lg font-cinzel text-center text-primary animate-pulse-slow">
                {mantra}
              </div>
            )}
          </div>
        </InteractiveCard>
      )}

      {/* Grille des planètes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allPlanets.map((planet) => (
          <InteractiveCard
            key={planet.name}
            className={`bg-gradient-to-br ${planetBgMap[planet.name]} ${planetBorderMap[planet.name]} p-4`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={planetColorMap[planet.name]}>
                {planetIconMap[planet.name]}
              </div>
              <div>
                <h4 className="font-semibold text-white font-cinzel">{planet.name}</h4>
                <p className="text-sm text-gray-400">{planetDescriptionMap[planet.name]}</p>
              </div>
            </div>
            <div className="text-center">
              <span className={`text-lg font-bold ${planetColorMap[planet.name]}`}>
                {planet.sign}
              </span>
            </div>
          </InteractiveCard>
        ))}
      </div>

      {/* Interprétation détaillée */}
      {interpretationText && (
        <InteractiveCard className="bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📖</div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2 font-cinzel">Interprétation Détaillée</h3>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {interpretationText}
              </div>
            </div>
          </div>
        </InteractiveCard>
      )}

      {/* Bouton pour générer l'interprétation */}
      {!interpretation && !isLoading && (
        <InteractiveCard className="bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/20">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔮</div>
            <h3 className="text-xl font-cinzel font-bold mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
              Interprétation Personnalisée
            </h3>
            <p className="text-gray-300 mb-6">
              Découvrez une interprétation approfondie de votre thème natal, générée spécialement pour vous.
            </p>
            <button
              onClick={() => {
                // Déclencher la génération de l'interprétation
                const generateInterpretation = async () => {
                  if (!natalChart || interpretation) return;
                  
                  setIsLoading(true);
                  setError(null);
                  
                  try {
                    const generatedText = await OpenAIService.generateNatalChartInterpretation(natalChart, firstName);
                    if (generatedText && typeof generatedText === 'object' && 'success' in generatedText && generatedText.success && generatedText.data) {
                      setInterpretation(generatedText.data);
                    } else if (typeof generatedText === 'string') {
                      setInterpretation(generatedText);
                    } else {
                      setInterpretation('Erreur lors de la génération de l\'interprétation.');
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Une erreur est survenue');
                  } finally {
                    setIsLoading(false);
                  }
                };
                
                generateInterpretation();
              }}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg"
            >
              Générer l'interprétation
            </button>
          </div>
        </InteractiveCard>
      )}

      {/* État de chargement */}
      {isLoading && (
        <InteractiveCard className="bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/20">
          <div className="text-center p-8">
            <CosmicLoader />
            <p className="text-gray-300 mt-4">Génération de votre interprétation personnalisée...</p>
          </div>
        </InteractiveCard>
      )}

      {/* Erreur */}
      {error && (
        <InteractiveCard className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/20">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-cinzel font-bold mb-4 text-red-400">
              Erreur de génération
            </h3>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200"
            >
              Réessayer
            </button>
          </div>
        </InteractiveCard>
      )}

      {/* Fallback si aucune donnée */}
      {!astroSummary && allPlanets.length === 0 && !interpretationText && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">🌠</div>
          <h3 className="text-xl font-cinzel font-bold mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">Aucune donnée astrologique disponible</h3>
          <p className="text-gray-400 mb-6">Complétez votre profil ou réessayez plus tard.</p>
        </div>
      )}
    </div>
  );
}

export default NatalChartTab;