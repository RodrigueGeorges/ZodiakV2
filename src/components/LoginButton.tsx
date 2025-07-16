import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, X, Loader2, User } from 'lucide-react';
import { cn } from '../lib/utils';
import InteractiveCard from './InteractiveCard';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { ButtonZodiak } from './ButtonZodiak';
import PhoneAuth from './PhoneAuth';
import { useAuth } from '../lib/hooks/useAuth';
import { GRADIENTS, EFFECTS } from '../lib/theme';

interface LoginButtonProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

function LoginButton({ 
  showToast, 
  className = '', 
  variant = 'default',
  size = 'md'
}: LoginButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [authMode, setAuthMode] = useState<'sms' | 'email'>('sms');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Vérifier l'état de connexion actuel
    const checkUser = async () => {
      await supabase.auth.getUser();
    };
    
    checkUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async () => {
      }
    );

    return () => subscription.unsubscribe();
  }, [showToast]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSuccess = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && profile) {
        StorageService.saveProfile(profile);
        // console.log('Profil sauvegardé dans le localStorage:', profile);
        setIsOpen(false);
        showToast('Connexion réussie', 'success');
        // La redirection sera gérée par useAuthRedirect
      } else {
        setIsOpen(false);
        showToast('Profil non trouvé, veuillez compléter votre inscription.', 'info');
        // La redirection sera gérée par useAuthRedirect
      }
      // console.log('Session dans le localStorage:', localStorage.getItem('auth_session'));
    } catch (error) {
      showToast('Erreur lors de la connexion', 'error');
      console.error('Error handling auth success:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        showToast('Erreur lors de la déconnexion', 'error');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Erreur lors de la déconnexion', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError(null);
    try {
      if (isSignUp) {
        // Inscription
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error || !data.user) {
          setEmailError(error?.message || 'Erreur lors de l\'inscription');
          setIsLoading(false);
          return;
        }
        setIsOpen(false);
        showToast('Inscription réussie, veuillez compléter votre profil.', 'success');
        navigate('/register');
        return;
      } else {
        // Connexion
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session) {
          setEmailError(error?.message || 'Erreur de connexion');
          setIsLoading(false);
          return;
        }
        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (!profileError && profile) {
          StorageService.saveProfile(profile);
          setIsOpen(false);
          showToast('Connexion réussie', 'success');
          // La redirection sera gérée par useAuthRedirect
        } else {
          setIsOpen(false);
          showToast('Profil non trouvé, veuillez compléter votre inscription.', 'info');
          // La redirection sera gérée par useAuthRedirect
        }
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Login error:', error);
        showToast('Erreur lors de la connexion', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Erreur lors de la connexion', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {user ? 'Déconnexion...' : 'Connexion...'}
        </>
      );
    }

    if (user) {
      return (
        <>
          <User className="w-4 h-4" />
          {user.email ? user.email.split('@')[0] : 'Profil'}
        </>
      );
    }

    return (
      <>
        <LogIn className="w-4 h-4" />
        Se connecter
      </>
    );
  };

  const getButtonStyles = () => {
    const baseStyles = 'flex items-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const variantStyles = {
      default: 'bg-gradient-to-r from-[#D8CAB8] to-[#BFAF80] text-cosmic-900 hover:opacity-90 focus:ring-[#D8CAB8]',
      outline: 'border border-[#D8CAB8] text-[#D8CAB8] hover:bg-[#D8CAB8] hover:text-cosmic-900 focus:ring-[#D8CAB8]',
      ghost: 'text-[#D8CAB8] hover:bg-[#D8CAB8]/10 focus:ring-[#D8CAB8]'
    };

    return cn(
      baseStyles,
      sizeStyles[size],
      variantStyles[variant],
      className
    );
  };

  if (isLoading) return null;

  return (
    <button
      type="button"
      className={getButtonStyles()}
      style={variant === 'default' ? {
        background: GRADIENTS.lunarSheenAnimated,
        color: '#181C28',
        boxShadow: EFFECTS.halo,
        animation: 'sheen 3s linear infinite',
        backgroundSize: '200% auto',
      } : {}}
      onClick={user ? handleLogout : handleLogin}
      disabled={isLoading}
      tabIndex={0}
    >
      {getButtonContent()}
    </button>
  );
}

export default LoginButton;