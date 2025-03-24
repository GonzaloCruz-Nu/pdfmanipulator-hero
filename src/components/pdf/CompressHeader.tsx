
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu } from 'lucide-react';

interface CompressHeaderProps {
  wasmSupported: boolean | null;
}

const CompressHeader: React.FC<CompressHeaderProps> = ({ wasmSupported }) => {
  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-center mb-6">
        <div className="bg-[#F5923E]/10 p-3 rounded-full">
          <Zap className="h-8 w-8 text-[#F5923E]" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-center mb-2">Comprimir PDF</h1>
      <p className="text-muted-foreground text-center max-w-2xl mx-auto">
        Reduce el tamaño de tus archivos PDF sin perder calidad significativa.
        Ideal para enviar por correo electrónico o subir a plataformas con límites de tamaño.
      </p>
      
      {wasmSupported && (
        <div className="flex items-center justify-center mt-2">
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <Cpu className="h-3 w-3 mr-1" />
            Optimización WebAssembly activa
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default CompressHeader;
