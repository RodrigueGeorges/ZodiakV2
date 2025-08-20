import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function RegisterConfirmation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cosmic-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-cosmic-800 rounded-2xl shadow-xl border border-primary/20 p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-8 h-8 text-green-400" />
          </motion.div>

          <h1 className="text-2xl font-bold font-cinzel text-primary mb-4">
            Inscription réussie !
          </h1>
          
          <p className="text-gray-300 mb-6">
            Vérifiez votre boîte mail pour confirmer votre adresse email avant de vous connecter.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-primary to-secondary text-cosmic-900 font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Aller à la connexion
          </button>
        </div>
      </motion.div>
    </div>
  );
} 