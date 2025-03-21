
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

const RotatePDFGuide = () => {
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
              <RotateCcw className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Rotar PDFs - Guía Completa</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aprende a rotar páginas específicas o documentos PDF completos con facilidad y precisión.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">¿Qué es la rotación de PDFs?</h2>
              <p className="text-muted-foreground mb-4">
                La rotación de PDFs es un proceso que permite ajustar la orientación de las páginas en un documento PDF. 
                Esta función es especialmente útil cuando trabajas con documentos escaneados, fotos o cualquier PDF 
                que no tenga la orientación correcta para su visualización o impresión.
              </p>
              <p className="text-muted-foreground">
                PDFmanager ofrece opciones flexibles para rotar tus documentos:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Rotación de páginas específicas:</span>
                    <span className="text-muted-foreground"> Selecciona una o múltiples páginas individuales para rotar.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Rotación en diferentes ángulos:</span>
                    <span className="text-muted-foreground"> Gira las páginas a 90°, 180° o 270° según tus necesidades.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Vista previa instantánea:</span>
                    <span className="text-muted-foreground"> Visualiza cómo quedarán tus páginas rotadas antes de guardar los cambios.</span>
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
                    Puedes seleccionar cualquier archivo PDF que necesites rotar.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">2. Visualiza las páginas</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez cargado el PDF, verás una vista previa de todas las páginas como miniaturas.
                    Esto te ayudará a identificar rápidamente qué páginas necesitan rotación.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">3. Selecciona las páginas a rotar</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en las miniaturas de las páginas que deseas rotar. Puedes seleccionar múltiples
                    páginas manteniendo presionada la tecla Ctrl (o Cmd en Mac) mientras haces clic.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">4. Elige el ángulo de rotación</h3>
                  <p className="text-sm text-muted-foreground">
                    Utiliza los botones de rotación para girar las páginas seleccionadas. Puedes elegir entre:
                    • 90° en sentido horario
                    • 90° en sentido antihorario
                    • 180° (invertir)
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">5. Vista previa de cambios</h3>
                  <p className="text-sm text-muted-foreground">
                    Verás una vista previa actualizada de las páginas después de aplicar la rotación.
                    Esto te permitirá confirmar que la orientación es correcta antes de guardar.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">6. Guarda el PDF rotado</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez que estés satisfecho con las rotaciones, haz clic en "Guardar PDF" para
                    aplicar los cambios y descargar el documento rotado en tu dispositivo.
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
                    <span className="font-medium text-foreground">Selección múltiple inteligente:</span> Utiliza la opción "Seleccionar todas las páginas pares/impares" para rotar rápidamente documentos escaneados a doble cara.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Previsualiza siempre:</span> Comprueba la vista previa de cada página rotada para asegurarte de que la orientación es correcta antes de guardar.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Rotaciones consecutivas:</span> Puedes aplicar múltiples rotaciones a la misma página. Cada rotación de 90° se suma a la posición actual.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Documentos protegidos:</span> Si tu PDF está protegido con contraseña o tiene restricciones, deberás desbloquearlo primero con nuestra herramienta de desbloqueo antes de poder rotarlo.
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
                    Rotar un PDF con PDFmanager mantiene todas las características del documento original, 
                    incluyendo texto seleccionable, enlaces y marcadores. A diferencia de algunas soluciones 
                    que convierten el contenido a imágenes, nuestro método preserva la calidad y funcionalidad 
                    completa del PDF.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <Link 
                to="/tools/rotate" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Ir a Rotar PDFs
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default RotatePDFGuide;
