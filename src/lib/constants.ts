export const APP_NAME = 'Zodiak';
export const APP_DESCRIPTION = 'Votre guide astral personnel';

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