import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CosmicLoader from '../components/CosmicLoader';
import { GuidanceContent } from '../components/GuidanceContent';
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <CosmicLoader />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <div className="text-red-400 text-center">Profil non trouvé. Redirection...</div>
      </div>
    );
  }

  return <GuidanceContent />;
}