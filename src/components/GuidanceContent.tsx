import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useGuidance } from '../lib/hooks/useGuidance';
import { useRetry } from '../lib/hooks/useRetry';
import { ButtonZodiak } from './ButtonZodiak';
import ShareButton from './ShareButton';
import SkeletonLoader from './SkeletonLoader';

interface GuidanceContentProps {
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function GuidanceContent({ className = '' }: GuidanceContentProps) {
  const { guidance, loading, error, generateGuidance, refreshGuidance } = useGuidance();
  const [isGenerating, setIsGenerating] = useState(false);

  // Utiliser le hook useRetry pour une meilleure gestion des erreurs
  const { retry, attempts, isRetrying, lastError, canRetry } = useRetry({
    maxAttempts: 3,
    initialDelay: 1000,
    onRetry: (attempt) => {
      console.log(`🔄 Tentative ${attempt} de génération de guidance`);
    },
    onSuccess: () => {
      console.log('✅ Guidance générée avec succès');
    },
    onError: (error, attempt) => {
      console.error(`❌ Erreur lors de la tentative ${attempt}:`, error);
    }
  });

  const handleGenerateGuidance = async () => {
    setIsGenerating(true);
    try {
      await retry(async () => {
        await generateGuidance();
      });
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await retry(async () => {
        await refreshGuidance();
      });
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <SkeletonLoader type="guidance" />
        <SkeletonLoader type="card" height="150px" />
        <SkeletonLoader type="card" height="150px" />
        <SkeletonLoader type="card" height="150px" />
      </div>
    );
  }

  if (error || lastError) {
    const errorMessage = error || lastError?.message || 'Une erreur est survenue';
    
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-500 mb-2">Erreur</h3>
        <p className="text-gray-400 mb-4">{errorMessage}</p>
        
        {attempts > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Tentatives : {attempts}/3
          </p>
        )}
        
        <div className="space-y-3">
          <ButtonZodiak
            onClick={handleGenerateGuidance}
            disabled={isGenerating || isRetrying || !canRetry}
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating || isRetrying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isRetrying ? 'Nouvelle tentative...' : 'Génération...'}
              </>
            ) : (
              'Réessayer'
            )}
          </ButtonZodiak>
          
          {canRetry && (
            <p className="text-xs text-gray-500">
              Prochaine tentative dans quelques secondes...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!guidance) {
    return (
      <div
        className={`text-center py-12 ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(245, 203, 167, 0.1) 0%, rgba(212, 163, 115, 0.1) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(245, 203, 167, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-bold text-primary mb-4 font-cinzel">
            Prêt pour votre guidance ?
          </h3>
          <p className="text-gray-300 mb-6">
            Découvrez les messages que les étoiles ont pour vous aujourd'hui.
          </p>
          <ButtonZodiak
            onClick={handleGenerateGuidance}
            disabled={isGenerating}
            className="bg-gradient-to-r from-primary to-secondary text-cosmic-900 font-semibold px-8 py-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              'Générer ma guidance'
            )}
          </ButtonZodiak>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 ${className}`}>
      {/* Résumé */}
      <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-4 md:p-6 border border-primary/20 shadow-cosmic">
        <h3 className="text-base md:text-lg font-semibold text-primary mb-2 md:mb-3 font-cinzel">Résumé du jour</h3>
        <p className="text-gray-300 leading-relaxed text-sm md:text-base">{guidance.summary}</p>
      </motion.div>

      {/* Grille des sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Amour */}
        <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-4 md:p-6 border border-primary/20 shadow-cosmic">
          <h3 className="text-base md:text-lg font-semibold text-primary mb-2 md:mb-3 font-cinzel flex items-center gap-2">
            💖 Amour
          </h3>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-3">{guidance.love.text}</p>
          <div className="mt-3">
            <span className="text-xs md:text-sm text-gray-400">Score : </span>
            <span className="text-primary font-semibold text-sm md:text-base">{guidance.love.score}/10</span>
          </div>
        </motion.div>

        {/* Travail */}
        <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-4 md:p-6 border border-primary/20 shadow-cosmic">
          <h3 className="text-base md:text-lg font-semibold text-primary mb-2 md:mb-3 font-cinzel flex items-center gap-2">
            💼 Travail
          </h3>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-3">{guidance.work.text}</p>
          <div className="mt-3">
            <span className="text-xs md:text-sm text-gray-400">Score : </span>
            <span className="text-primary font-semibold text-sm md:text-base">{guidance.work.score}/10</span>
          </div>
        </motion.div>

        {/* Énergie */}
        <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-4 md:p-6 border border-primary/20 shadow-cosmic">
          <h3 className="text-base md:text-lg font-semibold text-primary mb-2 md:mb-3 font-cinzel flex items-center gap-2">
            ⚡ Énergie
          </h3>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-3">{guidance.energy.text}</p>
          <div className="mt-3">
            <span className="text-xs md:text-sm text-gray-400">Score : </span>
            <span className="text-primary font-semibold text-sm md:text-base">{guidance.energy.score}/10</span>
          </div>
        </motion.div>
      </div>

      {/* Mantra du jour */}
      <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-4 md:p-6 border border-primary/20 shadow-cosmic">
        <h3 className="text-base md:text-lg font-semibold text-primary mb-2 md:mb-3 font-cinzel flex items-center gap-2">
          🧘‍♀️ Mantra du jour
        </h3>
        <p className="text-gray-300 leading-relaxed italic text-center text-base md:text-lg">
          "{guidance.mantra || 'Les étoiles vous guident vers votre destinée...'}"
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
        <ButtonZodiak
          onClick={handleRefresh}
          disabled={isGenerating}
          className="bg-cosmic-700 hover:bg-cosmic-600 text-primary"
        >
          <Loader2 className="w-4 h-4 mr-2" />
          Actualiser
        </ButtonZodiak>
        
        <ShareButton
          title="Guidance du Jour"
          content={`${guidance.summary}\n\n💖 Amour: ${guidance.love.text}\n💼 Travail: ${guidance.work.text}\n⚡ Énergie: ${guidance.energy.text}\n\n🧘‍♀️ Mantra: "${guidance.mantra || 'Les étoiles vous guident vers votre destinée...'}"`}
          url={window.location.href}
        />
      </motion.div>
    </div>
  );
}