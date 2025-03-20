
import React from 'react';
import { motion } from 'framer-motion';
import { Merge, Scissors, FileText, FileOutput, Zap, FileCog, FileSearch, FileLock } from 'lucide-react';
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
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Dividir PDF"
              description="Divide un documento PDF en múltiples archivos"
              icon={Scissors}
              to="/tools/split"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Comprimir PDF"
              description="Reduce el tamaño de tus archivos PDF sin perder calidad"
              icon={Zap}
              to="/tools/compress"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Convertir PDF"
              description="Convierte entre PDF y otros formatos"
              icon={FileOutput}
              to="/tools/convert"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Editar PDF"
              description="Edita el contenido de tus documentos PDF"
              icon={FileCog}
              to="/tools/edit"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="OCR PDF"
              description="Extrae texto de imágenes y documentos escaneados"
              icon={FileSearch}
              to="/tools/ocr"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Proteger PDF"
              description="Añade contraseñas y restricciones a tus PDFs"
              icon={FileLock}
              to="/tools/protect"
            />
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Tools;
