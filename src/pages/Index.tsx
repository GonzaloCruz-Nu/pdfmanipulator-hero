
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Merge, Scissors, FileText, FileOutput, Zap, FileType } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import ToolCard from '@/components/ToolCard';

const Index = () => {
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
    <Layout>
      <Header />
      
      <div className="pt-12 pb-24">
        <motion.div 
          className="text-center space-y-6 mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            100% Local, 100% Privado
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Manipula PDFs con facilidad<br />
            <span className="text-primary">sin salir de tu navegador</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            Herramientas potentes para unir, dividir, comprimir y convertir PDFs a Word.
            Sin servidores externos. Tus archivos nunca salen de tu dispositivo.
          </p>
          <div className="pt-4">
            <Link to="/tools" className="btn-primary">
              Explorar herramientas
            </Link>
          </div>
        </motion.div>

        <motion.h2 
          className="text-2xl font-bold text-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Nuestras herramientas
        </motion.h2>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
              title="PDF a Word"
              description="Convierte tus PDFs a documentos Word editables"
              icon={FileType}
              to="/tools/convert"
            />
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        className="rounded-2xl bg-white p-8 md:p-12 shadow-glass text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="mx-auto max-w-2xl">
          <FileText className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Privacidad por diseño</h2>
          <p className="text-muted-foreground mb-6">
            Toda la manipulación de PDF ocurre directamente en tu navegador. Tus archivos nunca 
            se cargan a ningún servidor. Funciona incluso sin conexión a internet.
          </p>
          <Link to="/about" className="btn-secondary">
            Conoce más
          </Link>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Index;
