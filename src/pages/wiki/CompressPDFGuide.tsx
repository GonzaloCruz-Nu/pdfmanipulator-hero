
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

const CompressPDFGuide = () => {
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
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Comprimir PDF - Guía Completa</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aprende a reducir el tamaño de tus archivos PDF manteniendo la mejor calidad posible.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">¿Qué es la compresión de PDF?</h2>
              <p className="text-muted-foreground mb-4">
                La compresión de PDF es un proceso que reduce el tamaño de un archivo PDF sin eliminar 
                ninguna página. Esto se logra mediante la optimización de imágenes, fuentes y estructuras 
                dentro del documento.
              </p>
              <p className="text-muted-foreground">
                PDFmanager ofrece tres niveles de compresión para adaptarse a tus necesidades:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Compresión Baja:</span>
                    <span className="text-muted-foreground"> Ideal para documentos con imágenes de alta calidad. Reduce ligeramente el tamaño manteniendo la máxima calidad visual.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Compresión Media:</span>
                    <span className="text-muted-foreground"> Equilibrio entre tamaño y calidad. Perfecta para la mayoría de documentos.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Compresión Alta:</span>
                    <span className="text-muted-foreground"> Máxima reducción de tamaño. Ideal para documentos donde el tamaño es prioritario sobre la calidad de imagen.</span>
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
                    Puedes seleccionar cualquier archivo PDF de hasta 100MB.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">2. Elige el nivel de compresión</h3>
                  <p className="text-sm text-muted-foreground">
                    Utiliza el selector para elegir entre los niveles Bajo, Medio o Alto según
                    tus necesidades de calidad y tamaño.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">3. Inicia la compresión</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón "Comprimir PDF" para comenzar el proceso. Verás una
                    barra de progreso indicando el avance de la operación.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">4. Revisa los resultados</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez completada la compresión, podrás ver el tamaño original, el nuevo
                    tamaño y el porcentaje de reducción logrado.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">5. Descarga tu PDF comprimido</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en "Descargar PDF comprimido" para guardar el archivo en tu dispositivo.
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
                    <span className="font-medium text-foreground">Prueba diferentes niveles:</span> Si el resultado no es satisfactorio con un nivel, prueba otro.
                    Algunos PDFs responden mejor a ciertos niveles de compresión.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Comprueba la calidad:</span> Siempre verifica el PDF comprimido antes de distribuirlo,
                    especialmente si contiene imágenes o gráficos importantes.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Guarda el original:</span> Mantén una copia del archivo original por si necesitas
                    recuperar la calidad inicial.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Limitaciones:</span> Los PDFs que ya están altamente optimizados o que contienen
                    principalmente texto pueden no reducirse significativamente.
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
                    La compresión de PDFmanager utiliza algoritmos avanzados que analizan cada componente del PDF, 
                    optimizando específicamente las imágenes que suelen ser la principal causa de archivos pesados.
                    Todo el procesamiento ocurre directamente en tu navegador, manteniendo tus documentos privados.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <Link 
                to="/tools/compress" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Zap className="h-5 w-5 mr-2" />
                Ir a Comprimir PDF
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CompressPDFGuide;
