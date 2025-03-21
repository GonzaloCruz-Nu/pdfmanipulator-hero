
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Merge, Scissors, Zap, Unlock, FileCog, FileSearch, FileLock } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import ToolCard from '@/components/ToolCard';

const Index = () => {
  useEffect(() => {
    console.log('Index page mounted');
    
    // Check for any CSS or rendering issues
    const rootElement = document.getElementById('root');
    if (rootElement) {
      console.log('Root element dimensions:', {
        width: rootElement.clientWidth,
        height: rootElement.clientHeight,
        isVisible: rootElement.clientWidth > 0 && rootElement.clientHeight > 0
      });
    }
    
    return () => {
      console.log('Index page unmounted');
    };
  }, []);

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

  console.log('Rendering Index page');

  return (
    <Layout>
      <Header />
      
      <div className="pt-6 pb-12">
        <motion.div 
          className="text-center space-y-3 mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="inline-block rounded-full bg-naranja/10 px-3 py-1 text-sm text-naranja mb-1">
            100% Local, 100% Privado
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Manipula PDFs con facilidad<br />
            <span className="text-naranja">sin salir de tu navegador</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-sm">
            Herramientas potentes para unir, dividir y comprimir PDFs.
            Sin servidores externos. Tus archivos nunca salen de tu dispositivo.
          </p>
        </motion.div>

        <motion.h2 
          className="text-lg font-bold text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Nuestras herramientas
        </motion.h2>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-8 max-w-[800px] mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Unir PDFs"
              description="Combina múltiples documentos"
              icon={Merge}
              to="/tools/merge"
              className="h-full"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Dividir PDF"
              description="Divide un documento PDF"
              icon={Scissors}
              to="/tools/split"
              className="h-full"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Comprimir PDF"
              description="Reduce el tamaño"
              icon={Zap}
              to="/tools/compress"
              className="h-full"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Desbloquear PDF"
              description="Elimina contraseñas"
              icon={Unlock}
              to="/tools/unlock"
              className="h-full"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Editar PDF"
              description="Edita tus documentos"
              icon={FileCog}
              to="/tools/edit"
              className="h-full"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="OCR PDF"
              description="Extrae texto de imágenes"
              icon={FileSearch}
              to="/tools/ocr"
              className="h-full"
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolCard
              title="Proteger PDF"
              description="Añade contraseñas"
              icon={FileLock}
              to="/tools/protect"
              className="h-full"
            />
          </motion.div>
        </motion.div>

        <motion.div 
          className="rounded-2xl bg-white p-5 md:p-6 shadow-glass text-center max-w-[800px] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="mx-auto max-w-2xl">
            <Zap className="h-8 w-8 text-naranja mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Privacidad por diseño</h2>
            <p className="text-muted-foreground mb-3 text-sm">
              Toda la manipulación de PDF ocurre directamente en tu navegador. Tus archivos nunca 
              se cargan a ningún servidor. Funciona incluso sin conexión a internet.
            </p>
            <Link to="/about" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
              Conoce más
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Index;
