/**
 * Navigation helpers — source de vérité partagée entre TopNavBar et BottomNavBar.
 *
 * `isNavActive` gère l'active state intelligent : une route comme /synastry/:id
 * doit allumer l'entrée "Liens" parce qu'elle dépend conceptuellement de /friends.
 */

/**
 * Map des routes filles vers leur entrée de nav parente.
 * Ajoute ici toute nouvelle deeplink-route protégée pour qu'elle highlight
 * la bonne entrée principale.
 */
const ROUTE_FAMILY: Record<string, string> = {
  '/synastry': '/friends',
};

/**
 * Détermine si une entrée de navigation est active pour le chemin courant.
 *
 * Règles :
 *  - Match exact (/guidance === /guidance)
 *  - Match préfixe sur les sous-routes officielles (/synastry/abc → /friends)
 *  - Match préfixe direct sur les sous-pages partageant le même slug
 *    (/calendar/2026-05 → /calendar)
 */
export function isNavActive(itemPath: string, currentPath: string): boolean {
  if (currentPath === itemPath) return true;

  // Sous-route directe : /calendar/foo → /calendar
  if (currentPath.startsWith(itemPath + '/')) return true;

  // Famille déclarée : /synastry/abc → /friends
  for (const [prefix, parent] of Object.entries(ROUTE_FAMILY)) {
    if (currentPath === prefix || currentPath.startsWith(prefix + '/')) {
      return parent === itemPath;
    }
  }

  return false;
}
