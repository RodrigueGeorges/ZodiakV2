import { useEffect } from 'react';

/** Valeurs par défaut alignées avec `index.html` (SSR / pré-rendu). */
export const DEFAULT_DOC_TITLE =
  'Zodiak Astro · Horoscope personnalisé sur WhatsApp & Instagram';

export const DEFAULT_META_DESCRIPTION =
  'Horoscope personnalisé sur WhatsApp et Instagram : guidance astrologique basée sur ton thème natal chaque matin. Compte gratuit, essai Premium 7 jours (carte requise), puis 8,90 € / mois. Données en Europe.';

/**
 * Met à jour `document.title` et la meta description pour la route courante.
 * Restaure les valeurs précédentes au démontage (navigation SPA).
 */
export function useDocumentSeo(options: {
  title: string;
  description: string;
}): void {
  const { title, description } = options;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const prevDesc = meta?.getAttribute('content') ?? '';
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    return () => {
      document.title = prevTitle;
      meta?.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}
