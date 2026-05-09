import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Stars, BookOpen, Eye } from 'lucide-react';
import OpenAIService from '../lib/services/OpenAIService';
import { StorageService } from '../lib/storage';
import NatalSignature from './NatalSignature';
import ZodiacWheel from './ZodiacWheel';
import NatalArt from './NatalArt';
import StoryShareButton from './StoryShareButton';
import EmptyState from './EmptyState';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SkeletonText } from './ui/Skeleton';
import type { Profile } from '../lib/types/supabase';

interface NatalChartTabProps {
  profile: Profile;
}

interface PlanetLite {
  name: string;
  sign?: string;
}

export default function NatalChartTab({ profile }: NatalChartTabProps) {
  const [astroSummary, setAstroSummary] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingInterp, setLoadingInterp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'art' | 'wheel'>('art');

  const firstName = profile?.name?.split(' ')[0] || 'voyageur';
  const natalChart = profile?.natal_chart
    ? typeof profile.natal_chart === 'string'
      ? JSON.parse(profile.natal_chart)
      : profile.natal_chart
    : null;

  const sunSign =
    natalChart?.planets?.find((p: PlanetLite) => p.name === 'Soleil')?.sign ||
    'Non disponible';
  const moonSign =
    natalChart?.planets?.find((p: PlanetLite) => p.name === 'Lune')?.sign ||
    'Non disponible';
  const ascendantSign = natalChart?.ascendant?.sign || 'Non disponible';

  // Charge ou génère le résumé
  useEffect(() => {
    const run = async () => {
      if (!natalChart || !profile) return;
      if (profile.natal_summary) {
        setAstroSummary(profile.natal_summary);
        return;
      }
      setLoadingSummary(true);
      try {
        const res = await OpenAIService.generateNatalSummary(natalChart, firstName);
        if (res.success && res.data) {
          setAstroSummary(res.data);
          await StorageService.saveProfile({ ...profile, natal_summary: res.data });
        } else {
          setAstroSummary(
            `${firstName}, ta signature astrale révèle un Soleil en ${sunSign}, une Lune en ${moonSign} et un Ascendant en ${ascendantSign}. Une combinaison qui te dessine, te ressemble, et que personne d'autre ne porte tout à fait comme toi.`
          );
        }
      } catch {
        // fallback silencieux
      } finally {
        setLoadingSummary(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Charge ou génère l'interprétation détaillée
  useEffect(() => {
    const run = async () => {
      if (!natalChart || !profile) return;
      if (profile.natal_chart_interpretation) {
        setInterpretation(profile.natal_chart_interpretation);
        return;
      }
      setLoadingInterp(true);
      setError(null);
      try {
        const res = await OpenAIService.generateNatalChartInterpretation(
          natalChart,
          firstName
        );
        if (res.success && res.data) {
          setInterpretation(res.data);
          await StorageService.saveProfile({
            ...profile,
            natal_chart_interpretation: res.data,
          });
        } else {
          throw new Error("Erreur lors de la génération de l'interprétation.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Une erreur est survenue.'
        );
      } finally {
        setLoadingInterp(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Nettoie une éventuelle réponse JSON.stringifiée
  let interpretationText = interpretation;
  try {
    const parsed = JSON.parse(interpretation || '');
    if (parsed && typeof parsed === 'object' && parsed.data) {
      interpretationText = parsed.data;
    }
  } catch {
    /* texte brut */
  }

  if (!natalChart) {
    return (
      <EmptyState
        type="natal"
        action={{
          label: 'Compléter mon profil',
          onClick: () => (window.location.href = '/profile'),
        }}
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* Bloc carte du ciel + œuvre cosmique */}
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="relative p-7 md:p-14 flex flex-col items-center">
          <p className="eyebrow-ritual text-aurora-400/80 mb-3">
            {view === 'art' ? 'Œuvre cosmique' : 'Carte du ciel'}
          </p>
          <h2 className="font-serif text-display text-ivory-50 mb-3 text-center leading-[0.95]">
            {view === 'art' ? (
              <>
                Ta signature{' '}
                <span className="italic-editorial text-aurora-400">visuelle</span>
              </>
            ) : (
              <>
                Ton ciel à ta{' '}
                <span className="italic-editorial text-aurora-400">naissance</span>
              </>
            )}
          </h2>
          <p className="text-body text-ivory-300/80 italic-editorial text-center max-w-md mb-8">
            {view === 'art'
              ? 'Une composition unique générée à partir de ton ciel — ne ressemble à aucune autre.'
              : 'La carte technique de ta naissance — survole les planètes.'}
          </p>

          {/* Toggle Art / Carte */}
          <div
            role="tablist"
            className="flex items-center gap-1 p-1 mb-8 rounded-full bg-night-900/40 border border-ivory-50/[0.08]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === 'art'}
              onClick={() => setView('art')}
              className={`px-5 py-2 rounded-full text-caption font-serif transition-colors ${
                view === 'art'
                  ? 'bg-aurora-400/15 text-ivory-50 border border-aurora-400/30'
                  : 'text-ivory-300 hover:text-ivory-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1.5" aria-hidden="true" />
              Œuvre
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'wheel'}
              onClick={() => setView('wheel')}
              className={`px-5 py-2 rounded-full text-caption font-serif transition-colors ${
                view === 'wheel'
                  ? 'bg-aurora-400/15 text-ivory-50 border border-aurora-400/30'
                  : 'text-ivory-300 hover:text-ivory-50'
              }`}
            >
              <Stars className="w-3.5 h-3.5 inline mr-1.5" aria-hidden="true" />
              Carte
            </button>
          </div>

          {view === 'art' ? (
            <NatalArt chart={natalChart} size={460} />
          ) : (
            <ZodiacWheel natalChart={natalChart} size={400} />
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <StoryShareButton
              variant="primary"
              size="md"
              label="Partager en story"
              payload={{
                type: 'natal',
                firstName,
                sunSign,
                moonSign,
                ascSign: ascendantSign,
              }}
            />
            <Button
              variant="ghost"
              size="md"
              onClick={() => window.print()}
            >
              Imprimer en poster
            </Button>
          </div>
        </div>
      </Card>

      {/* Signature astrale */}
      <NatalSignature
        sunSign={sunSign}
        moonSign={moonSign}
        ascendantSign={ascendantSign}
      />

      {/* Résumé éditorial */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card variant="surface" className="relative">
          <div className="p-7 md:p-14">
            <div className="flex items-center gap-3 mb-5">
              <Stars className="w-4 h-4 text-aurora-400" aria-hidden="true" />
              <p className="eyebrow-ritual text-aurora-400/80">
                Lecture rapide
              </p>
            </div>
            {loadingSummary ? (
              <SkeletonText lines={3} />
            ) : astroSummary ? (
              <p className="text-body-lg leading-[1.7] text-ivory-100 italic-editorial font-serif">
                « {astroSummary.replace(/^([A-Z][a-z]+),/i, `Cher·e ${firstName},`)} »
              </p>
            ) : null}
          </div>
        </Card>
      </motion.div>

      {/* Interprétation détaillée */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Card variant="surface">
          <div className="p-7 md:p-14">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-4 h-4 text-aurora-400" aria-hidden="true" />
              <p className="eyebrow-ritual text-aurora-400/80">
                Interprétation détaillée
              </p>
            </div>
            {loadingInterp ? (
              <SkeletonText lines={6} />
            ) : interpretationText ? (
              <div className="prose prose-invert max-w-none text-ivory-200 leading-relaxed whitespace-pre-line">
                {interpretationText.replace(
                  /^([A-Z][a-z]+),/i,
                  `Cher·e ${firstName},`
                )}
              </div>
            ) : error ? (
              <p className="text-magenta-400">{error}</p>
            ) : null}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
