
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Merge, Scissors, Zap, Unlock, FileCog, 
  FileSearch, FileLock, RotateCcw, Languages, 
  Stamp, MoveVertical
} from 'lucide-react';
import ToolCard from '@/components/ToolCard';

const ToolsGrid = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <motion.h2 
        className="text-xl font-bold text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Nuestras herramientas
      </motion.h2>

      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Unir PDFs"
            description="Combina múltiples documentos PDF en uno"
            icon={Merge}
            to="/tools/merge"
            className="h-full"
          />
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Dividir PDF"
            description="Divide un documento PDF en varios archivos"
            icon={Scissors}
            to="/tools/split"
            className="h-full"
          />
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Comprimir PDF"
            description="Reduce el tamaño sin perder calidad"
            icon={Zap}
            to="/tools/compress"
            className="h-full"
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Desbloquear PDF"
            description="Elimina contraseñas de PDFs protegidos"
            icon={Unlock}
            to="/tools/unlock"
            className="h-full"
          />
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Rotar PDF"
            description="Cambia la orientación de las páginas"
            icon={RotateCcw}
            to="/tools/rotate"
            className="h-full"
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Editar PDF"
            description="Edita el contenido de tus documentos"
            icon={FileCog}
            to="/tools/edit"
            className="h-full"
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <ToolCard
            title="OCR PDF"
            description="Extrae texto de imágenes y escaneados"
            icon={FileSearch}
            to="/tools/ocr"
            className="h-full"
          />
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Ordenar PDF"
            description="Reordena las páginas de tus documentos"
            icon={MoveVertical}
            to="/tools/sort"
            className="h-full"
            isNew={true}
          />
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Marca de Agua"
            description="Añade texto como marca de agua a tu PDF"
            icon={Stamp}
            to="/tools/watermark"
            className="h-full"
            isNew={true}
          />
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Traducir PDF"
            description="Traduce PDF de español a inglés con IA"
            icon={Languages}
            to="/tools/translate"
            className="h-full"
            maintenance={true}
            isNew={true}
          />
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <ToolCard
            title="Proteger PDF"
            description="Añade contraseñas a tus PDFs"
            icon={FileLock}
            to="/tools/protect"
            className="h-full"
            maintenance={true}
            isNew={true}
          />
        </motion.div>
      </motion.div>
    </>
  );
};

export default ToolsGrid;
