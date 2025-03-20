
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Scissors, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

const SplitPDFGuide = () => {
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
              <Scissors className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Dividir PDFs - Guía Completa</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aprende a extraer páginas específicas o dividir un PDF en múltiples archivos de manera sencilla.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">¿Qué es la división de PDFs?</h2>
              <p className="text-muted-foreground mb-4">
                La división de PDFs es un proceso que permite extraer páginas específicas de un documento PDF 
                o separarlo en múltiples archivos independientes. Esta función es útil cuando solo necesitas 
                partes específicas de un documento extenso o quieres reorganizar sus páginas.
              </p>
              <p className="text-muted-foreground">
                PDFmanager ofrece diferentes opciones para dividir tus PDFs:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Extraer páginas específicas:</span>
                    <span className="text-muted-foreground"> Selecciona páginas individuales para extraer (ej. 1,3,5).</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Extraer rangos de páginas:</span>
                    <span className="text-muted-foreground"> Selecciona rangos de páginas para extraer (ej. 1-5, 8-10).</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Dividir por cada página:</span>
                    <span className="text-muted-foreground"> Crea un PDF separado por cada página del documento original.</span>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Guía paso a paso</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">1. Selecciona tu archivo PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón "Seleccionar PDF" o arrastra y suelta tu archivo en la zona designada.
                    Puedes seleccionar cualquier archivo PDF que necesites dividir.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">2. Vista previa del documento</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez cargado el PDF, podrás ver una vista previa de todas las páginas. 
                    Usa los controles de navegación para revisar el contenido antes de dividirlo.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">3. Selecciona el método de división</h3>
                  <p className="text-sm text-muted-foreground">
                    Elige cómo quieres dividir tu PDF: por páginas específicas, por rangos, o crear un archivo 
                    por cada página. Cada método tiene su propia interfaz para facilitar la selección.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">4. Especifica las páginas</h3>
                  <p className="text-sm text-muted-foreground">
                    Según el método elegido, selecciona las páginas o rangos que deseas extraer. 
                    Puedes hacerlo usando el campo de entrada o seleccionando las miniaturas directamente.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">5. Divide el PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón "Dividir PDF" para iniciar el proceso.
                    Verás una barra de progreso indicando el avance de la operación.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">6. Descarga los resultados</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez completado el proceso, podrás descargar los PDFs resultantes individualmente
                    o como un archivo ZIP que contiene todos los documentos divididos.
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
                    <span className="font-medium text-foreground">Previsualiza primero:</span> Revisa todas las páginas del documento antes de dividirlo para asegurarte de seleccionar las correctas.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Usa la notación correcta:</span> Para páginas específicas, usa comas (1,3,5). Para rangos, usa guiones (1-5).
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Renombra los archivos:</span> Después de descargar, renombra los archivos según su contenido para facilitar su identificación posterior.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Limitaciones:</span> Si tu PDF está protegido, deberás usar nuestra herramienta de desbloqueo antes de poder dividirlo.
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
                    Cuando divides un PDF, cada nuevo documento mantiene la misma calidad y propiedades que el 
                    original. Además, todos los marcadores, enlaces y metadatos específicos de página se 
                    conservan en los archivos resultantes. Todo el procesamiento ocurre directamente en tu 
                    navegador, garantizando la privacidad de tus documentos.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <Link 
                to="/tools/split" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Scissors className="h-5 w-5 mr-2" />
                Ir a Dividir PDFs
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SplitPDFGuide;
