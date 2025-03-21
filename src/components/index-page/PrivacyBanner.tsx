
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const PrivacyBanner = () => {
  return (
    <motion.div 
      className="rounded-2xl bg-white p-6 md:p-8 shadow-glass text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      <div className="mx-auto max-w-2xl">
        <Zap className="h-10 w-10 text-naranja mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-3">Privacidad por diseño</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Toda la manipulación de PDF ocurre directamente en tu navegador. Tus archivos nunca 
          se cargan a ningún servidor. Funciona incluso sin conexión a internet.
        </p>
        <Link to="/about" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
          Conoce más
        </Link>
      </div>
    </motion.div>
  );
};

export default PrivacyBanner;
