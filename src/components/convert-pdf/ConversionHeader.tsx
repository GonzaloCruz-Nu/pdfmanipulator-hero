
import React from 'react';
import { FileType } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const ConversionHeader: React.FC = () => {
  return (
    <motion.div 
      className="text-center mb-12"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      <div className="rounded-full bg-naranja/10 p-3 inline-flex mb-4">
        <FileType className="h-6 w-6 text-naranja" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Convertir PDF a Word</h1>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Convierte tus documentos PDF a formato Word (DOCX) para editarlos fácilmente.
        Todo el procesamiento ocurre en tu navegador para mantener tus documentos privados.
      </p>
    </motion.div>
  );
};

export default ConversionHeader;
