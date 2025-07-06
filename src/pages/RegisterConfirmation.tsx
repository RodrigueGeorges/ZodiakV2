import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import StarryBackground from '../components/StarryBackground';

export default function RegisterConfirmation() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen overflow-hidden relative">
      <StarryBackground />
      <div className="container mx-auto px-4 md:px-8 xl:px-12 2xl:px-24 py-8 md:py-12 lg:py-16">
        <div className="max-w-md mx-auto mt-16">
          <div className="p-6 md:p-8 xl:p-10 2xl:p-16 bg-white/5 rounded-lg shadow-lg text-center">
            <Logo />
            <h2 className="text-2xl font-cinzel font-bold mt-4 mb-2">Inscription réussie !</h2>
            <p className="mb-4 text-gray-300">Merci pour ton inscription. Vérifie tes emails pour confirmer ton compte ou complète ton profil pour accéder à toutes les fonctionnalités.</p>
            <button
              className="w-full py-2 rounded-lg bg-primary text-black font-semibold hover:bg-secondary transition-colors mt-4"
              onClick={() => navigate('/register/complete?justSignedUp=true')}
            >
              Compléter mon profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 