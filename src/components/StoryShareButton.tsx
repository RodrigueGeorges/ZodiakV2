import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Image as ImageIcon, Instagram, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from './ui/Button';
import { canvasToBlob, renderStory, StoryProps } from '../lib/storyGenerator';
import { track } from '../lib/analytics';
import { cn } from '../lib/utils';

interface StoryShareButtonProps {
  payload: StoryProps;
  /** Variante d'affichage. */
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Bouton qui ouvre une modale de prévisualisation Story (1080×1920) +
 * actions (télécharger PNG, partager via Web Share API si dispo, ouvrir
 * Instagram). Tout est généré côté client (canvas), aucune dépendance.
 */
export default function StoryShareButton({
  payload,
  variant = 'ghost',
  size = 'sm',
  className,
  label = 'Partager en story',
}: StoryShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    setGenerating(true);
    requestAnimationFrame(async () => {
      try {
        renderStory(canvasRef.current!, payload);
        const blob = await canvasToBlob(canvasRef.current!);
        if (blob) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          setBlobUrl(URL.createObjectURL(blob));
          track('story_generated', { type: payload.type });
        }
      } catch (err) {
        console.warn('story render failed', err);
        toast.error('Impossible de générer l\'image.');
      } finally {
        setGenerating(false);
      }
    });
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleShare = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      if (!blob) return;
      const file = new File([blob], 'zodiak-story.png', { type: 'image/png' });
      const shareData: ShareData & { files?: File[] } = {
        title: 'Zodiak',
        text: 'Découvre ton ciel sur Zodiak.',
        files: [file],
      };
      const nav = navigator as Navigator & {
        share?: (d: ShareData) => Promise<void>;
        canShare?: (d: ShareData) => boolean;
      };
      if (nav.canShare && nav.canShare(shareData) && nav.share) {
        await nav.share(shareData);
        return;
      }
      handleDownload();
    } catch (err) {
      console.warn('share failed', err);
      handleDownload();
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `zodiak-${payload.type}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleInstagram = () => {
    handleDownload();
    toast.success('Image téléchargée — colle-la dans ta story Instagram.');
    window.setTimeout(() => {
      window.open('https://www.instagram.com', '_blank', 'noopener');
    }, 600);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        iconLeft={<ImageIcon className="w-4 h-4" />}
        className={className}
      >
        {label}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-label="Aperçu de la story"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full"
            >
              <div
                className={cn(
                  'rounded-3xl overflow-hidden border border-aurora-500/30 bg-night-900',
                  'shadow-glow-aurora aspect-[9/16]'
                )}
              >
                {generating && (
                  <div className="absolute inset-0 flex items-center justify-center text-ivory-300 text-caption">
                    Génération…
                  </div>
                )}
                {blobUrl && (
                  <img
                    src={blobUrl}
                    alt="Aperçu de la story"
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Canvas hors écran utilisé pour le rendu */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  onClick={handleShare}
                  iconLeft={<Share2 className="w-4 h-4" />}
                  fullWidth
                >
                  Partager
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleInstagram}
                  iconLeft={<Instagram className="w-4 h-4" />}
                  fullWidth
                >
                  Instagram
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDownload}
                  iconLeft={<Download className="w-4 h-4" />}
                  fullWidth
                >
                  Télécharger
                </Button>
              </div>
              <p className="mt-3 text-center text-micro text-ivory-400">
                Format Story 1080×1920 — prêt à coller.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
