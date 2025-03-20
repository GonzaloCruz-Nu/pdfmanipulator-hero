
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Merge, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

const MergePDFGuide = () => {
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
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link to="/wiki" className="text-primary hover:underline flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a Wiki
            </Link>
          </div>

          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <div className="rounded-full bg-primary/10 p-3 inline-flex mb-4">
              <Merge className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Unir PDFs - Guía Completa</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aprende a combinar múltiples archivos PDF en un solo documento de forma rápida y sencilla.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">¿Qué es la unión de PDFs?</h2>
              <p className="text-muted-foreground mb-4">
                La unión de PDFs es un proceso que permite combinar múltiples archivos PDF en un solo documento. 
                Esta función es especialmente útil cuando necesitas organizar varios documentos relacionados en un 
                único archivo para facilitar su distribución, almacenamiento o impresión.
              </p>
              <p className="text-muted-foreground">
                PDFmanager te permite unir tus archivos PDF con estas características:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Selección múltiple:</span>
                    <span className="text-muted-foreground"> Puedes seleccionar tantos archivos PDF como necesites combinar.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Reordenamiento:</span>
                    <span className="text-muted-foreground"> Organiza el orden de los archivos antes de unirlos arrastrándolos en la interfaz.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Vista previa:</span>
                    <span className="text-muted-foreground"> Visualiza cómo quedarán tus documentos antes de completar la unión.</span>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Guía paso a paso</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">1. Selecciona tus archivos PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón "Seleccionar PDFs" o arrastra y suelta tus archivos en la zona designada.
                    Puedes seleccionar múltiples archivos PDF a la vez.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">2. Organiza el orden</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez que hayas cargado tus archivos, puedes reorganizarlos arrastrando cada uno a la posición deseada.
                    El orden en que aparecen en la lista será el orden final en el documento combinado.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">3. Vista previa (opcional)</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes hacer clic en cada archivo para ver una vista previa de su contenido antes de unirlos.
                    Esto te ayudará a asegurarte de que estás incluyendo los documentos correctos.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">4. Une los PDFs</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón "Unir PDFs" para comenzar el proceso de unión.
                    Verás una barra de progreso que indica el avance de la operación.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">5. Descarga el resultado</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez completado el proceso, haz clic en "Descargar PDF unido" para guardar el
                    documento combinado en tu dispositivo.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Consejos y mejores prácticas</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Organiza antes de subir:</span> Si tienes muchos archivos, considera nombrarlos con números al principio para facilitar su ordenamiento.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Revisa el resultado:</span> Siempre verifica el PDF combinado antes de distribuirlo para asegurarte de que todos los documentos se han unido correctamente.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Optimiza el tamaño:</span> Si el PDF combinado resulta demasiado grande, considera usar nuestra herramienta de compresión después de la unión.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Limitaciones:</span> Si tus archivos PDF tienen restricciones de seguridad, es posible que debas desbloquearlos primero con nuestra herramienta para poder unirlos.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-blue-50 rounded-xl p-6">
              <div className="flex">
                <Info className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">¿Sabías que?</h3>
                  <p className="text-blue-700 text-sm">
                    La unión de PDFs mantiene todas las características originales de cada documento, como enlaces, 
                    marcadores y campos de formulario. Todo el procesamiento ocurre directamente en tu navegador, 
                    manteniendo tus documentos privados y seguros.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <Link 
                to="/tools/merge" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Merge className="h-5 w-5 mr-2" />
                Ir a Unir PDFs
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default MergePDFGuide;
