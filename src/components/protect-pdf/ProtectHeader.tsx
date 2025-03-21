
import React from 'react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Construction, Info } from 'lucide-react';

const ProtectHeader = () => {
  return (
    <>
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Proteger PDF</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Añade contraseñas y restricciones de seguridad a tus documentos PDF. Toda la operación
          se realiza en tu navegador sin enviar datos a servidores externos.
        </p>
      </motion.div>

      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <Construction className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Esta herramienta se encuentra temporalmente en mantenimiento. Estamos trabajando para mejorar sus funcionalidades y rendimiento. 
          Disculpe las molestias.
        </AlertDescription>
      </Alert>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          La funcionalidad de protección con contraseña está temporalmente desactivada mientras trabajamos en mejorarla.
        </AlertDescription>
      </Alert>
    </>
  );
};

export default ProtectHeader;
