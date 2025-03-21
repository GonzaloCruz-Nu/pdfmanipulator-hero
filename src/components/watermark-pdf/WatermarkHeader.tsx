
import React from 'react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const WatermarkHeader = () => {
  return (
    <>
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Añadir Marca de Agua a PDF</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Añade texto como marca de agua a tus documentos PDF. Toda la operación
          se realiza en tu navegador sin enviar datos a servidores externos.
        </p>
      </motion.div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta herramienta te permite añadir un texto como marca de agua en todas las páginas de tu PDF.
          Puedes personalizar el texto, color, opacidad, tamaño y ángulo de la marca de agua.
        </AlertDescription>
      </Alert>
    </>
  );
};

export default WatermarkHeader;
