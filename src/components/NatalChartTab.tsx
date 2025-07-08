import React, { useState, useEffect } from 'react';
import { Sun, Moon, MessageSquare, Heart, Star, Sparkle } from 'lucide-react';
import { motion } from 'framer-motion';
import OpenAIService from '../lib/services/OpenAIService';
import { StorageService } from '../lib/storage';
import InteractiveCard from './InteractiveCard';
import NatalSignature from './NatalSignature';
import CosmicLoader from './CosmicLoader';
import ZodiacWheel from './ZodiacWheel';
import PlanetBadge from './PlanetBadge';
import ShareButton from './ShareButton';
import EmptyState from './EmptyState';
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

  // Extraction robuste des 3 astres
  const sunSign = natalChart?.planets?.find((p: { name: string; sign: string }) => p.name === 'Soleil')?.sign || 'Non disponible';
  const moonSign = natalChart?.planets?.find((p: { name: string; sign: string }) => p.name === 'Lune')?.sign || 'Non disponible';
  const ascendantSign = natalChart?.ascendant?.sign || 'Non disponible';

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
      <EmptyState
        type="natal"
        action={{
          label: "Compléter mon profil",
          onClick: () => window.location.href = '/profile'
        }}
      />
    );
  }

  // Générer la liste des planètes à afficher
  let allPlanets: { name: string; sign: string; house?: number; retrograde?: boolean }[] = natalChart?.planets ? [...natalChart.planets] : [];
  if (natalChart?.ascendant?.sign) {
    allPlanets.unshift({ name: 'Ascendant', sign: natalChart.ascendant.sign });
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pt-2 md:pt-2 flex flex-col justify-start"
    >
      {/* En-tête avec signature astrale */}
      <motion.div variants={itemVariants} className="text-center mb-0 mt-0">
        <h2 className="text-2xl md:text-3xl font-cinzel font-bold mb-2 md:mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
          Votre Thème Natal
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg">
          Découvrez votre carte du ciel de naissance, {firstName}. Chaque planète révèle une facette unique de votre personnalité.
        </p>
        <div className="mt-2 mb-2 text-primary font-cinzel text-base md:text-lg">
          <NatalSignature sunSign={sunSign} moonSign={moonSign} ascendantSign={ascendantSign} />
        </div>
      </motion.div>

      {/* Roue zodiacale */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <InteractiveCard className="p-6 bg-gradient-to-br from-cosmic-800/90 to-cosmic-900/90 border-primary/30 shadow-2xl rounded-3xl">
          <ZodiacWheel natalChart={natalChart} />
        </InteractiveCard>
      </motion.div>

      {/* Résumé astrologique */}
      {astroSummary && (
        <motion.div variants={itemVariants}>
          <InteractiveCard className="relative bg-gradient-to-br from-cosmic-800/90 to-cosmic-900/90 border-primary/30 shadow-2xl rounded-3xl p-8 overflow-hidden">
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
              {/* Mantra */}
              {mantra && (
                <div className="mt-6 px-6 py-3 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-xl shadow-inner text-lg font-cinzel text-center text-primary animate-pulse-slow">
                  {mantra}
                </div>
              )}
              {/* Bouton de partage */}
              <div className="mt-4">
                <ShareButton
                  title="Ma Signature Astrale"
                  content={`${accroche || ''}\n\nSoleil en ${sunSign}, Lune en ${moonSign}, Ascendant en ${ascendantSign}\n\n${mantra || ''}`}
                  variant="compact"
                />
              </div>
            </div>
          </InteractiveCard>
        </motion.div>
      )}

      {/* Grille des planètes avec badges */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allPlanets.map((planet, index) => (
            <motion.div
              key={planet.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PlanetBadge planet={planet} variant="detailed" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Interprétation détaillée */}
      {interpretationText && (
        <motion.div variants={itemVariants}>
          <InteractiveCard className="bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📖</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white font-cinzel">Interprétation Détaillée</h3>
                  <ShareButton
                    title="Mon Interprétation Astrologique"
                    content={interpretationText}
                    variant="compact"
                  />
                </div>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {interpretationText}
                </div>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>
      )}

      {/* Bouton pour générer l'interprétation */}
      {!interpretation && !isLoading && (
        <motion.div variants={itemVariants}>
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
        </motion.div>
      )}

      {/* État de chargement */}
      {isLoading && (
        <motion.div variants={itemVariants}>
          <InteractiveCard className="bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/20">
            <div className="text-center p-8">
              <CosmicLoader />
              <p className="text-gray-300 mt-4">Génération de votre interprétation personnalisée...</p>
            </div>
          </InteractiveCard>
        </motion.div>
      )}

      {/* Erreur */}
      {error && (
        <motion.div variants={itemVariants}>
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
        </motion.div>
      )}

      {/* Fallback si aucune donnée */}
      {!astroSummary && allPlanets.length === 0 && !interpretationText && (
        <motion.div variants={itemVariants}>
          <EmptyState type="general" />
        </motion.div>
      )}
    </motion.div>
  );
}

export default NatalChartTab;