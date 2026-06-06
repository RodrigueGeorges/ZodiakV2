export const APP_NAME = 'Zodiak Astro';
export const APP_DESCRIPTION = 'Votre guide astral personnel';

/** Domaine de production (sans protocole). */
export const APP_DOMAIN = 'zodiakastro.com';
/** URL absolue de production. */
export const APP_URL = `https://${APP_DOMAIN}`;
/** Email de contact public. */
export const CONTACT_EMAIL = `contact@${APP_DOMAIN}`;
/** Prix de l'abonnement mensuel (affichage FR). */
export const PRICE_MONTHLY = '8,90';

export const AUTH_SETTINGS = {
  CODE_LENGTH: 6,
  CODE_EXPIRY: 10 * 60 * 1000,
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000,
  STORAGE_KEY: 'auth_session'
};

export const TRIAL_DURATION = 7 * 24 * 60 * 60 * 1000;

export const API_SETTINGS = {
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};