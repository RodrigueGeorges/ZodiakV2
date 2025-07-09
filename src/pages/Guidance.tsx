import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';
import GuidanceContent from '../components/GuidanceContent';
import { useAuth } from '../lib/hooks/useAuth';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function Guidance() {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <LoadingScreen message="Chargement de votre guidance..." />;
  }

  if (!profile) {
    return <LoadingScreen error="Profil non trouvé. Redirection..." />;
  }

  return <GuidanceContent profile={profile} />;
}