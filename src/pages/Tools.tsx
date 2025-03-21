
import React from 'react';
import { motion } from 'framer-motion';
import { Merge, Scissors, Zap, FileCog, FileSearch, FileLock, Unlock, Languages, RotateCw, Stamp } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import ToolCard from '@/components/ToolCard';

const Tools = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
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
    <Layout>
      <Header />
      
      <div className="py-12">
        <motion.div 
          className="text-center mb-12"
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

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Unir PDFs"
              description="Combina múltiples documentos PDF en un solo archivo"
              icon={Merge}
              to="/tools/merge"
              className="h-full"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Dividir PDF"
              description="Divide un documento PDF en múltiples archivos"
              icon={Scissors}
              to="/tools/split"
              className="h-full"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Comprimir PDF"
              description="Reduce el tamaño de tus archivos PDF sin perder calidad"
              icon={Zap}
              to="/tools/compress"
              className="h-full"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Desbloquear PDF"
              description="Elimina la contraseña de tus documentos PDF protegidos"
              icon={Unlock}
              to="/tools/unlock"
              className="h-full"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Editar PDF"
              description="Edita el contenido de tus documentos PDF"
              icon={FileCog}
              to="/tools/edit"
              className="h-full"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="OCR PDF"
              description="Extrae texto de imágenes y documentos escaneados"
              icon={FileSearch}
              to="/tools/ocr"
              className="h-full"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Rotar PDF"
              description="Rota páginas individuales en cualquier posición"
              icon={RotateCw}
              to="/tools/rotate"
              className="h-full"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Traducir PDF"
              description="Traduce documentos PDF del español al inglés con IA"
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
              description="Añade contraseñas y restricciones a tus PDFs"
              icon={FileLock}
              to="/tools/protect"
              className="h-full"
              maintenance={true}
              isNew={true}
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Marca de Agua"
              description="Añade marca de agua a tus documentos PDF"
              icon={Stamp}
              to="/tools/watermark"
              className="h-full"
              isNew={true}
            />
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Tools;
