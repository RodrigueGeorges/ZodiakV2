import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Star } from 'lucide-react';

export default function Subscribe() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cosmic-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-cosmic-800 rounded-2xl shadow-xl border border-primary/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-cinzel bg-gradient-to-r from-blue-300 via-blue-200 to-cyan-300 text-transparent bg-clip-text mb-4 animate-blue-glow">
              🌟 Abonnement Premium
            </h1>
            <p className="text-gray-300 text-lg">
              Débloquez votre potentiel astral complet
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-cosmic-700 rounded-xl p-6 border border-primary/20"
            >
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold text-primary">Guidance Quotidienne</h3>
              </div>
              <ul className="text-gray-300 space-y-2">
                <li>• Messages personnalisés chaque jour</li>
                <li>• Conseils amour, travail et énergie</li>
                <li>• Mantras inspirants</li>
                <li>• Notifications SMS</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-cosmic-700 rounded-xl p-6 border border-primary/20"
            >
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold text-primary">Fonctionnalités Avancées</h3>
              </div>
              <ul className="text-gray-300 space-y-2">
                <li>• Thème natal détaillé</li>
                <li>• Chat avec l'IA astrologique</li>
                <li>• Historique complet</li>
                <li>• Support prioritaire</li>
              </ul>
            </motion.div>
          </div>

          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/profile')}
              className="bg-gradient-to-r from-primary to-secondary text-cosmic-900 font-bold py-4 px-8 rounded-xl text-lg hover:opacity-90 transition-opacity flex items-center justify-center mx-auto"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Commencer l'essai gratuit
            </motion.button>
            
            <p className="text-gray-400 text-sm mt-4">
              Essai gratuit de 7 jours • Annulation à tout moment
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}