import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { useGuidance } from '../lib/hooks/useGuidance';
import { useRetry } from '../lib/hooks/useRetry';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import EmptyState from './ui/EmptyState';
import GuidanceDisplay from './GuidanceDisplay';
import ShareButton from './ShareButton';

interface GuidanceContentProps {
  className?: string;
  /** Prénom de l'utilisateur — passé au GuidanceDisplay pour la story image. */
  firstName?: string;
}

export function GuidanceContent({
  className = '',
  firstName,
}: GuidanceContentProps) {
  const { guidance, loading, error, generateGuidance, refreshGuidance } =
    useGuidance();
  const [isGenerating, setIsGenerating] = useState(false);

  const { retry, attempts, isRetrying, lastError, canRetry } = useRetry({
    maxAttempts: 3,
    initialDelay: 1000,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await retry(async () => {
        await generateGuidance();
      });
    } catch (err) {
      console.error('Erreur génération:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await retry(async () => {
        await refreshGuidance();
      });
      // Petit son cosmique au refresh (ne joue que si l'utilisateur a opté in)
      const { playSound } = await import('../lib/sounds');
      playSound('whoosh');
    } catch (err) {
      console.error('Erreur actualisation:', err);
    }
  };

  // ─────────── Loading ───────────
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card variant="elevated">
          <div className="px-6 md:px-10 py-10 space-y-4">
            <Skeleton className="h-3 w-40 mx-auto" />
            <Skeleton className="h-10 w-3/4 mx-auto" rounded="lg" />
            <Skeleton className="h-10 w-1/2 mx-auto" rounded="lg" />
          </div>
        </Card>
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} variant="surface">
              <div className="p-6 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-1.5 w-full" rounded="full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ─────────── Erreur ───────────
  if (error || lastError) {
    const message =
      error || lastError?.message || "Une erreur est survenue.";
    return (
      <div className={className}>
        <EmptyState
          icon={<AlertTriangle className="w-7 h-7" />}
          title="Lecture du ciel impossible"
          description={message}
          action={
            <Button
              variant="primary"
              loading={isGenerating || isRetrying}
              disabled={!canRetry}
              onClick={handleGenerate}
              iconLeft={<RefreshCw className="w-4 h-4" />}
            >
              {isRetrying ? 'Nouvelle tentative…' : 'Réessayer'}
            </Button>
          }
        />
        {attempts > 0 && (
          <p className="mt-4 text-center text-micro uppercase tracking-widest text-ivory-400">
            Tentatives · {attempts}/3
          </p>
        )}
      </div>
    );
  }

  // ─────────── Pas encore générée ───────────
  if (!guidance) {
    return (
      <div className={className}>
        <Card variant="elevated" className="relative overflow-hidden">
          <div className="relative px-7 md:px-16 py-16 md:py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-aurora-400/30 mb-8">
              <Sparkles className="w-6 h-6 text-aurora-400" aria-hidden="true" />
            </div>
            <p className="eyebrow-ritual text-aurora-400/80 mb-5">
              Ton ciel du jour
            </p>
            <h2 className="font-serif text-display text-ivory-50 leading-[0.95] mb-6">
              Prêt(e) à lire <span className="italic-editorial text-aurora-400">les étoiles ?</span>
            </h2>
            <p className="max-w-xl mx-auto text-body-lg text-ivory-200/85 leading-[1.7] mb-10">
              Une lecture personnalisée — fondée sur ton thème natal et les
              transits du jour. Cœur, chantiers, vitalité, mantra : tout y
              passe.
            </p>
            <Button
              variant="primary"
              size="lg"
              loading={isGenerating}
              onClick={handleGenerate}
              iconLeft={<Sparkles className="w-4 h-4" />}
            >
              Recevoir ma guidance
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─────────── Guidance affichée ───────────
  const shareText = `${guidance.summary}\n\n💜 Cœur : ${
    typeof guidance.love === 'object' ? guidance.love.text : guidance.love
  }\n✨ Chantiers : ${
    typeof guidance.work === 'object' ? guidance.work.text : guidance.work
  }\n🔥 Vitalité : ${
    typeof guidance.energy === 'object'
      ? guidance.energy.text
      : guidance.energy
  }\n\n« ${guidance.mantra ?? 'Que les étoiles te guident.'} »`;

  return (
    <div className={className}>
      <GuidanceDisplay guidance={guidance} firstName={firstName} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button
          variant="ghost"
          onClick={handleRefresh}
          iconLeft={<RefreshCw className="w-4 h-4" />}
        >
          Actualiser
        </Button>
        <ShareButton
          title="Ta guidance du jour"
          content={shareText}
          url={window.location.href}
        />
      </motion.div>
    </div>
  );
}
