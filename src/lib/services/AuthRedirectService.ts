import { StorageService } from '../storage';
import type { Profile } from '../types/supabase';

export interface RedirectConfig {
  defaultRoute: string;
  profileCompleteRoute: string;
  profileIncompleteRoute: string;
  loginRoute: string;
}

export class AuthRedirectService {
  private static readonly DEFAULT_CONFIG: RedirectConfig = {
    defaultRoute: '/profile',
    profileCompleteRoute: '/profile',
    profileIncompleteRoute: '/register/complete',
    loginRoute: '/login'
  };

  /**
   * Détermine la route de redirection appropriée selon l'état d'authentification
   */
  static getRedirectRoute(
    isAuthenticated: boolean,
    profile: Profile | null,
    config: Partial<RedirectConfig> = {}
  ): string {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    if (!isAuthenticated) {
      return finalConfig.loginRoute;
    }

    if (!profile) {
      return finalConfig.profileIncompleteRoute;
    }

    return finalConfig.profileCompleteRoute;
  }

  /**
   * Vérifie si une redirection est nécessaire
   */
  static shouldRedirect(
    isAuthenticated: boolean,
    profile: Profile | null,
    currentPath: string
  ): boolean {
    const targetRoute = this.getRedirectRoute(isAuthenticated, profile);
    return currentPath !== targetRoute;
  }

  /**
   * Obtient la route de redirection pour un utilisateur spécifique
   */
  static async getRedirectRouteForUser(userId: string): Promise<string> {
    try {
      const profile = await StorageService.getProfile(userId);
      return this.getRedirectRoute(true, profile);
    } catch (error) {
      console.error('Error getting redirect route for user:', error);
      return this.DEFAULT_CONFIG.loginRoute;
    }
  }

  /**
   * Valide si une route est accessible pour l'état d'authentification actuel
   */
  static isRouteAccessible(
    route: string,
    isAuthenticated: boolean,
    profile: Profile | null
  ): boolean {
    const publicRoutes = ['/', '/login', '/register', '/register/complete'];
    
    // Les routes publiques sont toujours accessibles
    if (publicRoutes.includes(route)) {
      return true;
    }

    // Les routes privées nécessitent une authentification
    if (!isAuthenticated) {
      return false;
    }

    // Les routes qui nécessitent un profil complet
    const profileRequiredRoutes = ['/profile', '/guidance', '/natal'];
    if (profileRequiredRoutes.some(r => route.startsWith(r))) {
      return profile !== null;
    }

    return true;
  }

  /**
   * Obtient les paramètres de redirection pour React Router
   */
  static getRedirectParams(
    from: string,
    message?: string
  ): { replace: boolean; state?: { from: string; message?: string } } {
    return {
      replace: true,
      state: message ? { from, message } : { from }
    };
  }
} 