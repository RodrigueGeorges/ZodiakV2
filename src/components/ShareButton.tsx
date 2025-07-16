import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareButtonProps {
  title: string;
  content: string;
  url?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
}

export default function ShareButton({ title, content, url, className = '', variant = 'default' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareText = `${title}\n\n${content}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      toast.success('Lien copié dans le presse-papiers !');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareOnInstagram = () => {
    // Instagram ne supporte pas le partage direct via URL, on copie le texte
    copyToClipboard();
  };

  const shareOptions = [
    { icon: <Check className="w-4 h-4" />, label: 'Copier', action: copyToClipboard, color: '' },
    { icon: <Check className="w-4 h-4" />, label: 'Twitter', action: shareOnTwitter, color: '' },
    { icon: <Check className="w-4 h-4" />, label: 'Facebook', action: shareOnFacebook, color: '' },
    { icon: <Check className="w-4 h-4" />, label: 'Instagram', action: shareOnInstagram, color: '' }
  ];

  const variants = {
    default: (
      <div className={`relative ${className}`}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-cosmic-900 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {copied ? <Check className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          <span>{copied ? 'Copié !' : 'Partager'}</span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="absolute top-full left-0 mt-2 p-2 bg-cosmic-800 border border-primary/30 rounded-lg shadow-2xl z-50 min-w-[200px]"
            >
              <div className="grid grid-cols-2 gap-2">
                {shareOptions.map((option, index) => (
                  <motion.button
                    key={option.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      option.action();
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-md text-primary transition-colors bg-gradient-to-r from-primary/10 to-secondary/10`}
                  >
                    {option.icon}
                    <span className="text-sm">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ),
    compact: (
      <motion.button
        onClick={copyToClipboard}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary/80 to-secondary/80 text-black text-sm font-medium rounded-md shadow-md ${className}`}
      >
        {copied ? <Check className="w-3 h-3" /> : <LogIn className="w-3 h-3" />}
        <span className="text-xs">{copied ? 'Copié' : 'Partager'}</span>
      </motion.button>
    ),
    floating: (
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-primary to-secondary text-black rounded-full shadow-2xl z-40 flex items-center justify-center ${className}`}
      >
        <LogIn className="w-5 h-5" />
      </motion.button>
    )
  };

  return variants[variant];
} 