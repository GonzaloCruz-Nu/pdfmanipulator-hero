
import React from 'react';
import { motion } from 'framer-motion';
import { MoveVertical, ArrowUp, ArrowDown, Check, Info } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SortPDFGuide = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Guía: Ordenar PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aprende cómo reorganizar las páginas de tus documentos PDF de manera sencilla.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="bg-white shadow-subtle rounded-xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <MoveVertical className="h-5 w-5 mr-2 text-primary" />
              ¿Qué es la herramienta de Ordenar PDF?
            </h2>
            
            <p className="text-muted-foreground mb-4">
              La herramienta de Ordenar PDF te permite reorganizar las páginas de un documento PDF, 
              cambiando su secuencia según tus necesidades. Es perfecta para cuando necesitas:
            </p>
            
            <ul className="ml-6 space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Corregir documentos escaneados en el orden incorrecto</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Reorganizar capítulos o secciones de un libro o informe</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Extraer páginas específicas y ordenarlas de manera personalizada</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Invertir el orden de las páginas de un documento</span>
              </li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
              <div className="flex items-start">
                <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Ventaja de privacidad</p>
                  <p className="text-sm">
                    Esta herramienta procesa tus documentos PDF directamente en tu navegador, 
                    sin subir ningún archivo a servidores externos, garantizando total privacidad.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white shadow-subtle rounded-xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold mb-4">Cómo usar la herramienta de Ordenar PDF</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Paso 1: Seleccionar archivo</h3>
                <p className="text-sm text-muted-foreground">
                  Haz clic en "Seleccionar PDF" o arrastra y suelta tu archivo en la zona indicada. 
                  La herramienta procesará el documento y generará miniaturas de cada página.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Paso 2: Reorganizar páginas</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Hay varias formas de reordenar las páginas:
                </p>
                <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                  <li><span className="font-medium">Arrastrar y soltar:</span> Arrastra una página y suéltala en la posición deseada.</li>
                  <li><span className="font-medium">Botones de navegación:</span> Usa los botones <ArrowUp className="h-3 w-3 inline" /> y <ArrowDown className="h-3 w-3 inline" /> para mover una página hacia arriba o hacia abajo.</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Paso 3: Aplicar cambios</h3>
                <p className="text-sm text-muted-foreground">
                  Cuando estés satisfecho con el nuevo orden, haz clic en el botón "Aplicar nuevo orden" 
                  para generar un nuevo documento PDF con las páginas reorganizadas.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Paso 4: Descargar resultado</h3>
                <p className="text-sm text-muted-foreground">
                  Una vez procesado, podrás previsualizar el resultado y descargar el nuevo PDF 
                  con las páginas en el orden que has establecido.
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white shadow-subtle rounded-xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-4">Consejos y trucos</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Invertir orden completo</h3>
                <p className="text-sm text-muted-foreground">
                  Para invertir completamente el orden de un documento, puedes arrastrar la última página 
                  a la primera posición, y continuar en ese orden.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Restaurar orden original</h3>
                <p className="text-sm text-muted-foreground">
                  Si cometes un error durante la reorganización, siempre puedes hacer clic en 
                  "Restablecer orden original" para volver a empezar.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Documentos grandes</h3>
                <p className="text-sm text-muted-foreground">
                  Para documentos con muchas páginas, considera dividirlo primero en secciones más 
                  pequeñas con la herramienta de "Dividir PDF" para facilitar la reorganización.
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/tools/sort">
              <Button className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Ir a la herramienta de Ordenar PDF
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SortPDFGuide;
