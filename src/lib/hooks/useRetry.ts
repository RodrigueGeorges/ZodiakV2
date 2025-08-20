import { useState, useCallback, useRef } from 'react';

interface UseRetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error, attempt: number) => void;
}

interface UseRetryReturn {
  retry: <T>(fn: () => Promise<T>) => Promise<T>;
  attempts: number;
  isRetrying: boolean;
  lastError: Error | null;
  reset: () => void;
  canRetry: boolean;
}

export function useRetry(options: UseRetryOptions = {}): UseRetryReturn {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
    onSuccess,
    onError
  } = options;

  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setAttempts(0);
    setIsRetrying(false);
    setLastError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const retry = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    let currentAttempt = 0;

    const attempt = async (): Promise<T> => {
      try {
        currentAttempt++;
        setAttempts(currentAttempt);
        setIsRetrying(true);
        setLastError(null);

        // Appeler le callback onRetry si fourni
        if (onRetry) {
          onRetry(currentAttempt);
        }

        const result = await fn();
        
        // Succès - reset et appeler onSuccess
        reset();
        if (onSuccess) {
          onSuccess();
        }
        
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);

        // Appeler le callback onError si fourni
        if (onError) {
          onError(err, currentAttempt);
        }

        // Vérifier si on peut encore réessayer
        if (currentAttempt < maxAttempts) {
          // Calculer le délai avec backoff exponentiel
          const delay = Math.min(
            initialDelay * Math.pow(backoffMultiplier, currentAttempt - 1),
            maxDelay
          );

          // Attendre avant de réessayer
          await new Promise(resolve => {
            timeoutRef.current = setTimeout(resolve, delay);
          });

          // Réessayer
          return attempt();
        } else {
          // Plus de tentatives possibles
          setIsRetrying(false);
          throw err;
        }
      }
    };

    return attempt();
  }, [maxAttempts, initialDelay, maxDelay, backoffMultiplier, onRetry, onSuccess, onError, reset]);

  const canRetry = attempts < maxAttempts && !isRetrying;

  return {
    retry,
    attempts,
    isRetrying,
    lastError,
    reset,
    canRetry
  };
}
