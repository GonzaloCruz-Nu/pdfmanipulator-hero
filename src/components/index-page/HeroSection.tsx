
import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.div 
      className="text-center space-y-4 mb-10"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      <div className="inline-block rounded-full bg-naranja/10 px-3 py-1 text-sm text-naranja mb-2">
        100% Local, 100% Privado
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
        Manipula PDFs con facilidad<br />
        <span className="text-naranja">sin salir de tu navegador</span>
      </h1>
      <p className="max-w-2xl mx-auto text-muted-foreground text-base">
        Herramientas potentes para unir, dividir y comprimir PDFs.
        Sin servidores externos. Tus archivos nunca salen de tu dispositivo.
      </p>
    </motion.div>
  );
};

export default HeroSection;
