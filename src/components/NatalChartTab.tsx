import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import OpenAIService from '../lib/services/OpenAIService';
import { StorageService } from '../lib/storage';
import NatalSignature from './NatalSignature';
import CosmicLoader from './CosmicLoader';
import ZodiacWheel from './ZodiacWheel';
import EmptyState from './EmptyState';
import type { Profile } from '../lib/types/supabase';
import StarryBackground from './StarryBackground';
import Logo from './Logo';

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

  useEffect(() => {
    const loadOrGenerateSummary = async () => {
      if (!natalChart || !profile) return;
      if (profile.natal_summary && !astroSummary) {
        setAstroSummary(profile.natal_summary);
        return;
      }
      if (!profile.natal_summary && !astroSummary) {
        setIsLoading(true);
        try {
          const summaryResponse = await OpenAIService.generateNatalSummary(natalChart, firstName);
          if (summaryResponse.success && summaryResponse.data) {
            setAstroSummary(summaryResponse.data);
            const updatedProfile = { ...profile, natal_summary: summaryResponse.data };
            await StorageService.saveProfile(updatedProfile);
          } else {
            throw new Error('Erreur lors de la génération du résumé');
          }
        } catch (err) {
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
      if (!natalChart || !profile) return;
      if (profile.natal_chart_interpretation) {
        setInterpretation(profile.natal_chart_interpretation);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const interpretationResponse = await OpenAIService.generateNatalChartInterpretation(natalChart, firstName);
        if (interpretationResponse.success && interpretationResponse.data) {
          setInterpretation(interpretationResponse.data);
          const updatedProfile = { ...profile, natal_chart_interpretation: interpretationResponse.data };
          await StorageService.saveProfile(updatedProfile);
        } else {
          throw new Error('Erreur lors de la génération de l\'interprétation');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la génération de votre interprétation.');
      } finally {
        setIsLoading(false);
      }
    };
    generateInterpretation();
  }, [natalChart, profile?.natal_chart_interpretation, profile, firstName]);

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

  return (
    <div className="flex flex-col items-center w-full gap-8">
      {/* Header premium avec logo */}
      <div className="w-full flex flex-col items-center mb-2">
        <Logo className="w-16 h-16 mb-2" />
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold mb-2 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text text-center">
          Thème Natal de {firstName}
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg text-center">
          Découvrez votre carte du ciel de naissance. Chaque planète révèle une facette unique de votre personnalité.
        </p>
      </div>

      {/* Carte du ciel agrandie et centrée */}
      <div className="flex justify-center w-full">
        <div className="bg-gradient-to-br from-cosmic-800/90 to-cosmic-900/90 border-2 border-primary/30 shadow-2xl rounded-3xl p-4 md:p-8 flex flex-col items-center max-w-2xl w-full">
          <ZodiacWheel natalChart={natalChart} size={window.innerWidth < 600 ? 320 : 520} />
        </div>
      </div>

      {/* Signature astrale premium */}
      <div className="w-full max-w-2xl mx-auto">
        <NatalSignature sunSign={sunSign} moonSign={moonSign} ascendantSign={ascendantSign} />
      </div>

      {/* Bloc résumé premium, unique, personnalisé */}
      {astroSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-3xl mx-auto bg-gradient-to-br from-primary/80 to-secondary/80 text-cosmic-900 rounded-2xl shadow-xl p-8 mb-2 border-2 border-primary/40 text-center font-cinzel text-xl md:text-2xl font-semibold"
        >
          {astroSummary.replace(/^([A-Z][a-z]+),/i, `Cher ${firstName},`)}
        </motion.div>
      )}

      {/* Interprétation détaillée premium */}
      {interpretationText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-3xl mx-auto bg-cosmic-800/90 text-white rounded-2xl shadow-lg p-8 border border-primary/30 mt-4"
        >
          <h3 className="text-2xl font-cinzel font-bold mb-4 text-primary text-center">Interprétation détaillée</h3>
          <div className="text-lg leading-relaxed text-center">
            {interpretationText.replace(/^([A-Z][a-z]+),/i, `Cher ${firstName},`)}
          </div>
        </motion.div>
      )}

      {/* Fallback ou loader */}
      {isLoading && <CosmicLoader message="Génération de votre thème natal..." />}
      {error && (
        <div className="text-red-400 text-center mt-4">{error}</div>
      )}
    </div>
  );
}

export default NatalChartTab;