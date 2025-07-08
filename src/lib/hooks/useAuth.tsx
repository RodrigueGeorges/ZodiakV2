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
  const [timeoutError, setTimeoutError] = useState(false);
  const navigate = useNavigate();

  const refreshProfile = async () => {
    if (session?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (!profileError && profileData) {
        setProfile(profileData);
        await StorageService.saveProfile(profileData);
        return profileData;
      } else {
        setProfile(null);
        return null;
      }
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
          await StorageService.saveProfile(userProfile);
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
        setSession(_session);
        setUser(_session.user);
        setIsAuthenticated(true);
        await loadProfile(_session.user.id);
        StorageService.clearUserCache(_session.user.id);
        return;
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        if (_session?.user?.id) {
          StorageService.clearUserCache(_session.user.id);
        }
      }
    } catch (error) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let didTimeout = false;
    let timeout = setTimeout(() => {
      didTimeout = true;
      setTimeoutError(true);
      setIsLoading(false);
      console.error('[useAuth] Timeout: impossible de contacter Supabase');
    }, 5000);

    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (didTimeout) return;
        if (session?.user) {
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
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      } finally {
        if (!didTimeout) {
          setIsLoading(false);
          clearTimeout(timeout);
        }
      }
    };
    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);



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

  if (timeoutError) {
    return (
      <>
        <div style={{color: 'red', padding: 16, textAlign: 'center'}}>
          Erreur : Impossible de contacter Supabase.<br/>
          Vérifie ta connexion ou la configuration du projet.<br/>
          <span style={{fontSize: '0.9em', color: '#fff'}}>L'application fonctionne en mode déconnecté.</span>
        </div>
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      </>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 