
import React from 'react';
import { FileType } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConversionHeaderProps {
  title?: string;
  description?: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const ConversionHeader: React.FC<ConversionHeaderProps> = ({ 
  title = "Extraer texto de PDF (OCR)",
  description = "Extrae texto de tus documentos PDF utilizando tecnología de reconocimiento óptico de caracteres (OCR)."
}) => {
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
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        {description}
      </p>
    </motion.div>
  );
};

export default ConversionHeader;
