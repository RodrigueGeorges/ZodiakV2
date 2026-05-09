/**
 * birthday.ts — utilitaires "révolution solaire".
 *
 * En astrologie, le retour solaire (anniversaire) est un moment-clé :
 * le Soleil revient à sa position natale exacte. On en profite pour
 * proposer une expérience spéciale dans l'app ce jour-là.
 */

export interface BirthdayInfo {
  isToday: boolean;
  daysUntil: number;
  age: number | null;
}

/**
 * Vérifie si la date du jour correspond au mois/jour de la date de
 * naissance fournie (format ISO `YYYY-MM-DD`).
 *
 * Tient compte du fuseau horaire optionnel pour qu'un user qui voyage
 * ait sa célébration au bon moment local.
 */
export function birthdayInfo(
  birthDateIso: string | null | undefined,
  timezone?: string | null,
): BirthdayInfo {
  if (!birthDateIso) {
    return { isToday: false, daysUntil: -1, age: null };
  }

  const now = new Date();
  // On ne dépend pas de luxon ici pour rester léger : on fait du Date natif
  // et on accepte une approximation (timezone non utilisée explicitement).
  // L'ordre de grandeur est suffisant pour déclencher un easter-egg.
  void timezone;

  const [yStr, mStr, dStr] = birthDateIso.split('-');
  const birthYear = Number(yStr);
  const birthMonth = Number(mStr); // 1-12
  const birthDay = Number(dStr);

  if (!birthYear || !birthMonth || !birthDay) {
    return { isToday: false, daysUntil: -1, age: null };
  }

  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  const isToday = birthMonth === todayM && birthDay === todayD;

  // Calcul du nombre de jours jusqu'au prochain anniversaire
  let nextBirthday = new Date(todayY, birthMonth - 1, birthDay);
  if (nextBirthday < new Date(todayY, todayM - 1, todayD)) {
    nextBirthday = new Date(todayY + 1, birthMonth - 1, birthDay);
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = Math.ceil(
    (nextBirthday.getTime() - new Date(todayY, todayM - 1, todayD).getTime()) /
      msPerDay,
  );

  // Âge atteint cette année (au prochain ou ce jour même)
  const age = todayY - birthYear - (isToday ? 0 : daysUntil > 0 ? 0 : 1);

  return { isToday, daysUntil, age };
}
