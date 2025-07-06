import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabase';
import { StorageService } from '../storage';
import type { Profile } from '../types/supabase';
import type { AuthSession, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  session: AuthSession | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const refreshProfile = async () => {
    if (session?.user) {
      const userProfile = await StorageService.getProfile(session.user.id);
      setProfile(userProfile);
      return userProfile;
    }
    return null;
  };

  const loadProfile = async (userId: string) => {
    try {
      let userProfile = await StorageService.getProfile(userId);
      if (!userProfile) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!profileError && profileData) {
          userProfile = profileData;
          StorageService.saveProfile(userProfile);
        }
      }
      setProfile(userProfile ?? null);
      return userProfile;
    } catch (error) {
      setProfile(null);
      return null;
    }
  };

  const handleAuthStateChange = async (event: string, _session: AuthSession | null) => {
    setIsLoading(true);
    try {
      if (event === 'SIGNED_IN' && _session?.user) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          return;
        }
        setSession(_session);
        setUser(_session.user);
        setIsAuthenticated(true);
        await loadProfile(_session.user.id);
        StorageService.clearUserCache(_session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        if (_session?.user?.id) {
          StorageService.clearUserCache(_session.user.id);
        }
        navigate('/login', { replace: true });
      }
    } catch (error) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialiser l'état d'authentification
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data, error } = await supabase.auth.getUser();
          if (error || !data.user) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          await loadProfile(session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[useAuth] Erreur lors de l\'initialisation de l\'auth:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    console.log('[useAuth] Etat global:', { isLoading, isAuthenticated, user, profile });
  }, [isLoading, isAuthenticated, user, profile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[useAuth] Erreur lors de la déconnexion:', error);
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signOut,
    isAuthenticated,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 