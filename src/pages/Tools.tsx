
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import ToolsGrid from '@/components/index-page/ToolsGrid';

const Tools = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-8 container max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Herramientas PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Todas nuestras herramientas son 100% locales, procesando tus PDFs directamente en tu navegador.
            No se envía ningún dato a servidores externos.
          </p>
        </motion.div>

        <ToolsGrid />
      </div>
    </Layout>
  );
};

export default Tools;
