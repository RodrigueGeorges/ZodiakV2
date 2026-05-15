/// <reference types="vite/client" />

/**
 * Variables d'environnement EXPOSÉES côté client.
 *
 * RÈGLE D'OR : tout ce qui finit ici se retrouve dans le bundle JS public.
 * N'ajouter ICI QUE des clés "publiques par design" (Supabase anon key,
 * URL publiques). Les secrets (OpenAI, Brevo, WhatsApp, Vonage, etc.) doivent
 * UNIQUEMENT être configurés côté Netlify Functions sans préfixe `VITE_`.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  /** Sentry DSN — public par design. */
  readonly VITE_SENTRY_DSN?: string;

  /** URL absolue du site (utilisé pour build des liens canoniques). */
  readonly VITE_NETLIFY_URL?: string;

  /** Numéro WhatsApp business (E.164 sans le "+", ex: "33612345678") — public. */
  readonly VITE_ZODIAK_WHATSAPP_NUMBER?: string;

  /** Handle Instagram business (sans le "@") — public. */
  readonly VITE_ZODIAK_INSTAGRAM_HANDLE?: string;

  /** Clé publique VAPID pour Web Push — `npx web-push generate-vapid-keys`. */
  readonly VITE_VAPID_PUBLIC_KEY?: string;

  /** PostHog project key (publique par design). */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog host (par défaut https://eu.i.posthog.com). */
  readonly VITE_POSTHOG_HOST?: string;

  // ── Stripe (clés publiques — pk_test_... ou pk_live_...) ──────────────
  /** Clé publiable Stripe (pk_test_ ou pk_live_). */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Price ID abonnement Premium 8,90 €/mois. */
  readonly VITE_STRIPE_PRICE_PREMIUM?: string;
  /** Price ID pack Étoile Filante (10 messages, 3,99 €). */
  readonly VITE_STRIPE_PRICE_FILANTE?: string;
  /** Price ID pack Pleine Lune (30 messages, 9,99 €). */
  readonly VITE_STRIPE_PRICE_LUNE?: string;
  /** Price ID pack Constellation (100 messages, 24,99 €). */
  readonly VITE_STRIPE_PRICE_CONSTELLATION?: string;
  /** Price ID pack Galaxie (300 messages, 59,99 €). */
  readonly VITE_STRIPE_PRICE_GALAXIE?: string;

  // ─────────────────────────────────────────────────────────────────────
  // SUPPRIMÉS (P0 sécurité — migration Meta) :
  //   - VITE_OPENAI_API_KEY        → côté serveur uniquement (OPENAI_API_KEY)
  //   - VITE_BREVO_API_KEY         → Meta côté serveur
  //   - VITE_VONAGE_API_KEY        → idem
  //   - VITE_VONAGE_API_SECRET     → idem
  //   - VITE_ASTRO_*               → astrologie côté serveur uniquement
  // ─────────────────────────────────────────────────────────────────────
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
