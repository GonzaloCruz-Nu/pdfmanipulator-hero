
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Merge, Scissors, Zap, Unlock } from 'lucide-react';
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
      
      <div className="pt-12 pb-24">
        <motion.div 
          className="text-center space-y-6 mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="inline-block rounded-full bg-naranja/10 px-3 py-1 text-sm text-naranja mb-4">
            100% Local, 100% Privado
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Manipula PDFs con facilidad<br />
            <span className="text-naranja">sin salir de tu navegador</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            Herramientas potentes para unir, dividir y comprimir PDFs.
            Sin servidores externos. Tus archivos nunca salen de tu dispositivo.
          </p>
          <div className="pt-4">
            <Link to="/tools" className="inline-flex items-center justify-center rounded-md bg-naranja px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-naranja/90 transition-colors">
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
        </motion.div>
      </div>

      <motion.div 
        className="rounded-2xl bg-white p-8 md:p-12 shadow-glass text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="mx-auto max-w-2xl">
          <Zap className="h-12 w-12 text-naranja mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Privacidad por diseño</h2>
          <p className="text-muted-foreground mb-6">
            Toda la manipulación de PDF ocurre directamente en tu navegador. Tus archivos nunca 
            se cargan a ningún servidor. Funciona incluso sin conexión a internet.
          </p>
          <Link to="/about" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
            Conoce más
          </Link>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Index;
