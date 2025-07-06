import { AuthRedirectService } from '../services/AuthRedirectService';
import type { Profile } from '../types/supabase';

// Mock du profil utilisateur
const mockProfile: Profile = {
  id: 'test-user-id',
  name: 'Test User',
  phone: '+33612345678',
  birth_date: '1990-01-01',
  birth_time: '12:00',
  birth_place: 'Paris, France',
  natal_chart: {} as any,
  guidance_sms_time: '08:00',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('AuthRedirectService', () => {
  describe('getRedirectRoute', () => {
    it('should redirect to login when not authenticated', () => {
      const route = AuthRedirectService.getRedirectRoute(false, null);
      expect(route).toBe('/login');
    });

    it('should redirect to register/complete when authenticated but no profile', () => {
      const route = AuthRedirectService.getRedirectRoute(true, null);
      expect(route).toBe('/register/complete');
    });

    it('should redirect to profile when authenticated with profile', () => {
      const route = AuthRedirectService.getRedirectRoute(true, mockProfile);
      expect(route).toBe('/profile');
    });

    it('should use custom config', () => {
      const customConfig = {
        profileCompleteRoute: '/dashboard',
        loginRoute: '/signin'
      };
      
      const route = AuthRedirectService.getRedirectRoute(true, mockProfile, customConfig);
      expect(route).toBe('/dashboard');
    });
  });

  describe('shouldRedirect', () => {
    it('should return true when redirect is needed', () => {
      const shouldRedirect = AuthRedirectService.shouldRedirect(false, null, '/profile');
      expect(shouldRedirect).toBe(true);
    });

    it('should return false when no redirect is needed', () => {
      const shouldRedirect = AuthRedirectService.shouldRedirect(true, mockProfile, '/profile');
      expect(shouldRedirect).toBe(false);
    });

    it('should return false when already on correct route', () => {
      const shouldRedirect = AuthRedirectService.shouldRedirect(false, null, '/login');
      expect(shouldRedirect).toBe(false);
    });
  });

  describe('isRouteAccessible', () => {
    it('should allow access to public routes when not authenticated', () => {
      const isAccessible = AuthRedirectService.isRouteAccessible('/', false, null);
      expect(isAccessible).toBe(true);
    });

    it('should deny access to private routes when not authenticated', () => {
      const isAccessible = AuthRedirectService.isRouteAccessible('/profile', false, null);
      expect(isAccessible).toBe(false);
    });

    it('should allow access to private routes when authenticated', () => {
      const isAccessible = AuthRedirectService.isRouteAccessible('/profile', true, null);
      expect(isAccessible).toBe(true);
    });

    it('should allow access to profile routes when authenticated with profile', () => {
      const isAccessible = AuthRedirectService.isRouteAccessible('/profile', true, mockProfile);
      expect(isAccessible).toBe(true);
    });

    it('should deny access to profile routes when authenticated without profile', () => {
      const isAccessible = AuthRedirectService.isRouteAccessible('/profile', true, null);
      expect(isAccessible).toBe(false);
    });
  });

  describe('getRedirectParams', () => {
    it('should return correct params without message', () => {
      const params = AuthRedirectService.getRedirectParams('/profile');
      expect(params).toEqual({
        replace: true,
        state: { from: '/profile' }
      });
    });

    it('should return correct params with message', () => {
      const params = AuthRedirectService.getRedirectParams('/profile', 'Test message');
      expect(params).toEqual({
        replace: true,
        state: { from: '/profile', message: 'Test message' }
      });
    });
  });
});

// Tests pour les scénarios d'authentification
describe('Authentication Scenarios', () => {
  describe('New user registration flow', () => {
    it('should redirect through correct flow', () => {
      // 1. User not authenticated
      let route = AuthRedirectService.getRedirectRoute(false, null);
      expect(route).toBe('/login');

      // 2. User authenticated but no profile
      route = AuthRedirectService.getRedirectRoute(true, null);
      expect(route).toBe('/register/complete');

      // 3. User authenticated with profile
      route = AuthRedirectService.getRedirectRoute(true, mockProfile);
      expect(route).toBe('/profile');
    });
  });

  describe('Returning user login flow', () => {
    it('should redirect directly to profile', () => {
      const route = AuthRedirectService.getRedirectRoute(true, mockProfile);
      expect(route).toBe('/profile');
    });
  });

  describe('Route protection', () => {
    const testCases = [
      { route: '/', authenticated: false, profile: null, expected: true },
      { route: '/login', authenticated: false, profile: null, expected: true },
      { route: '/register', authenticated: false, profile: null, expected: true },
      { route: '/register/complete', authenticated: false, profile: null, expected: true },
      { route: '/profile', authenticated: false, profile: null, expected: false },
      { route: '/profile', authenticated: true, profile: null, expected: false },
      { route: '/profile', authenticated: true, profile: mockProfile, expected: true },
      { route: '/guidance', authenticated: false, profile: null, expected: false },
      { route: '/guidance', authenticated: true, profile: null, expected: false },
      { route: '/guidance', authenticated: true, profile: mockProfile, expected: true },
    ];

    testCases.forEach(({ route, authenticated, profile, expected }) => {
      it(`should ${expected ? 'allow' : 'deny'} access to ${route} when authenticated=${authenticated}, profile=${!!profile}`, () => {
        const isAccessible = AuthRedirectService.isRouteAccessible(route, authenticated, profile);
        expect(isAccessible).toBe(expected);
      });
    });
  });
}); 