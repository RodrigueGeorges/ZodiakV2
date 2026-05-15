import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Check, Link2, MessageCircle, Twitter, Instagram } from 'lucide-react';
import { toast } from '../lib/toast';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface ShareButtonProps {
  title: string;
  content: string;
  url?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
}

/**
 * ShareButton — DA aurora.
 *
 * Web Share API en priorité (mobile + Safari), sinon menu avec :
 * Copier le lien · WhatsApp · X (Twitter) · Instagram (copie le texte).
 * Plus de "Facebook" en premier (peu utilisé sur la cible).
 */
export default function ShareButton({
  title,
  content,
  url,
  className,
  variant = 'default',
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = `${title}\n\n${content}`;

  // Click outside
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      toast.success('Lien copié.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier.');
    }
  };

  const openWhatsApp = () => {
    const link = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  };
  const openTwitter = () => {
    const link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  };
  const openInstagram = () => {
    copyLink();
    toast.info(
      "Texte copié — colle-le dans ton DM Instagram.",
    );
  };

  const canWebShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const shareNative = async () => {
    try {
      await navigator.share({ title, text: content, url: shareUrl });
    } catch {
      /* l'utilisateur a annulé */
    }
  };

  const handleClick = canWebShare ? shareNative : () => setOpen((o) => !o);

  // Floating variant
  if (variant === 'floating') {
    return (
      <Button
        variant="primary"
        size="md"
        onClick={handleClick}
        className={cn('fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 rounded-full shadow-glow-aurora', className)}
        aria-label="Partager"
      >
        <Share2 className="w-5 h-5" />
      </Button>
    );
  }

  // Compact variant : un seul bouton "copier"
  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={copyLink}
        iconLeft={copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        className={className}
      >
        {copied ? 'Copié' : 'Copier'}
      </Button>
    );
  }

  // Default variant : button + menu
  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <Button
        variant="ghost"
        onClick={handleClick}
        iconLeft={<Share2 className="w-4 h-4" />}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Partager
      </Button>

      <AnimatePresence>
        {!canWebShare && open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-night-900/95 border border-night-700/80 backdrop-blur-md shadow-card overflow-hidden z-50"
          >
            {[
              { icon: Link2, label: copied ? 'Copié' : 'Copier le lien', action: copyLink },
              { icon: MessageCircle, label: 'WhatsApp', action: openWhatsApp },
              { icon: Twitter, label: 'X (Twitter)', action: openTwitter },
              { icon: Instagram, label: 'Instagram', action: openInstagram },
            ].map(({ icon: Icon, label, action }) => (
              <li key={label} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    action();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-caption text-ivory-100 hover:bg-aurora-500/10 hover:text-aurora-200 transition-colors"
                >
                  <Icon className="w-4 h-4 text-aurora-300" aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
