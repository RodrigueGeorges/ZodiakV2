import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface OnboardingStepperProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

/**
 * Indicateur d'étape minimaliste pour l'onboarding (Register → RegisterComplete).
 * Un dot rempli par étape complète, un dot ouvert pour les étapes restantes.
 */
export default function OnboardingStepper({
  currentStep,
  totalSteps,
  className,
}: OnboardingStepperProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2',
        className,
      )}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Étape ${currentStep} sur ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isActive = i + 1 === currentStep;
        const isCompleted = i + 1 < currentStep;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              isActive
                ? 'w-8 bg-gradient-to-r from-aurora-400 to-magenta-400'
                : isCompleted
                ? 'w-4 bg-aurora-400'
                : 'w-4 bg-ivory-50/15',
            )}
          />
        );
      })}
    </div>
  );
}
