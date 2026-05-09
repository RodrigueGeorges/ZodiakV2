/**
 * referral.ts — gestion du parrainage côté client.
 *
 * Cycle :
 *   1. Quelqu'un clique sur un lien `/r/CODE`.
 *   2. On valide le code (RPC Supabase ou simple lecture profile).
 *   3. On stocke le code dans localStorage (clef `zodiak.ref`).
 *   4. À l'inscription (RegisterComplete), on lit ce code et on
 *      remplit `profile.referred_by` avec l'UUID du parrain.
 *   5. Une fonction Netlify cron applique les jours bonus côté serveur
 *      (hors scope du client).
 */

import { supabase } from './supabase';

const STORAGE_KEY = 'zodiak.ref';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

interface StoredRef {
  code: string;
  inviterId: string;
  storedAt: string;
}

/**
 * Mémorise un code parrain valide. Retourne `true` si c'est OK.
 *
 * IMPORTANT : on passe par la RPC `find_inviter_by_code` (SECURITY DEFINER)
 * et NON par un SELECT direct sur `profiles`. La table profiles est protégée
 * par une RLS owner-only — un SELECT direct depuis un user anonyme renverrait
 * toujours null. La RPC retourne juste l'uuid du parrain (rien d'autre).
 */
export async function rememberReferralCode(code: string): Promise<boolean> {
  const cleaned = (code || '').trim().toUpperCase();
  if (!cleaned || cleaned.length < 4) return false;

  try {
    const { data: inviterId, error } = await supabase.rpc(
      'find_inviter_by_code',
      { code: cleaned },
    );
    if (error || !inviterId || typeof inviterId !== 'string') return false;

    const payload: StoredRef = {
      code: cleaned,
      inviterId,
      storedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Récupère le code parrain mémorisé, s'il est encore valide.
 */
export function getStoredReferral(): StoredRef | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRef;
    const ageMs = Date.now() - new Date(parsed.storedAt).getTime();
    if (ageMs > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearReferral(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Génère le lien partageable à partir d'un code parrain.
 */
export function buildReferralUrl(code: string, origin?: string): string {
  const root = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${root}/r/${code}`;
}
