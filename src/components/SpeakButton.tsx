import { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface SpeakButtonProps {
  /** Texte à lire à voix haute. */
  text: string;
  /** Langue ISO (par défaut français de France). */
  lang?: string;
  /** Vitesse de lecture (1.0 = normal). */
  rate?: number;
  /** Hauteur de voix (1.0 = normal, < 1 = plus grave). */
  pitch?: number;
  className?: string;
  /** Variante visuelle. */
  variant?: 'icon' | 'pill';
  /** Label accessible. */
  ariaLabel?: string;
}

/**
 * SpeakButton — lit un texte à voix haute via Web Speech API.
 *
 * Politique : on attend l'interaction utilisateur (Web Speech ne se
 * déclenche pas sans geste). On choisit la voix française la plus
 * naturelle disponible et on tombe en silencieux si l'API n'est pas
 * supportée (vieux navigateurs, certains in-app browsers).
 */
export default function SpeakButton({
  text,
  lang = 'fr-FR',
  rate = 0.92,
  pitch = 1.05,
  className,
  variant = 'icon',
  ariaLabel,
}: SpeakButtonProps) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        typeof SpeechSynthesisUtterance !== 'undefined',
    );
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const pickFrenchVoice = (): SpeechSynthesisVoice | null => {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;
      // 1) Une voix marquée premium / enhanced
      const enhanced = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('fr') &&
          /amelie|audrey|thomas|enhanced|premium|google|natural/i.test(v.name),
      );
      if (enhanced) return enhanced;
      // 2) Sinon n'importe quelle voix française
      return voices.find((v) => v.lang.toLowerCase().startsWith('fr')) ?? null;
    } catch {
      return null;
    }
  };

  const speak = () => {
    if (!supported || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      const voice = pickFrenchVoice();
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeaking(false);
    }
  };

  const stop = () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setSpeaking(false);
  };

  if (!supported) return null;

  const handleClick = () => (speaking ? stop() : speak());
  const label = speaking ? 'Arrêter la lecture' : 'Écouter';

  if (variant === 'pill') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        iconLeft={
          speaking ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )
        }
        className={className}
        aria-label={ariaLabel ?? label}
      >
        {speaking ? 'Stop' : 'Écouter'}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel ?? label}
      className={cn(
        'group inline-flex items-center justify-center w-9 h-9 rounded-full transition-all',
        'bg-aurora-500/15 ring-1 ring-aurora-400/30 text-aurora-200',
        'hover:bg-aurora-500/25 hover:ring-aurora-300/60 hover:text-aurora-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300',
        speaking && 'bg-aurora-500/30 ring-aurora-300/70 animate-pulse',
        className,
      )}
    >
      {speaking ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4 transition-transform group-hover:scale-110" />
      )}
    </button>
  );
}
