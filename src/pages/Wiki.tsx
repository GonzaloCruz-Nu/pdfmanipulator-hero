
import React from 'react';
import { motion } from 'framer-motion';
import { Book, FileText, HelpCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

const Wiki = () => {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Wiki de PDFmanager</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Guías y documentación para aprovechar al máximo nuestras herramientas PDF.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={fadeInUp}
            className="bg-white shadow-subtle rounded-xl p-6"
          >
            <div className="flex items-start mb-4">
              <div className="mr-4 rounded-full bg-primary/10 p-3 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Guía de Herramientas</h3>
                <p className="text-muted-foreground text-sm">
                  Aprende a usar cada una de nuestras herramientas para editar, combinar y manipular PDFs.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="bg-white shadow-subtle rounded-xl p-6"
          >
            <div className="flex items-start mb-4">
              <div className="mr-4 rounded-full bg-primary/10 p-3 text-primary">
                <Book className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Tutoriales</h3>
                <p className="text-muted-foreground text-sm">
                  Tutoriales paso a paso para tareas comunes con archivos PDF.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="bg-white shadow-subtle rounded-xl p-6"
          >
            <div className="flex items-start mb-4">
              <div className="mr-4 rounded-full bg-primary/10 p-3 text-primary">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Preguntas Frecuentes</h3>
                <p className="text-muted-foreground text-sm">
                  Respuestas a las preguntas más comunes sobre nuestras herramientas.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-subtle text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-4">¡Estamos construyendo nuestra Wiki!</h2>
          <p className="text-muted-foreground mb-6">
            Estamos trabajando en crear guías detalladas para todas nuestras herramientas.
            Pronto encontrarás aquí toda la información que necesitas.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Wiki;
