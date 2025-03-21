
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileSearch, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';

const ConvertPDFGuide = () => {
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
              <FileSearch className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Extraer Texto de PDF (OCR) - Guía Completa</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aprende a extraer texto de documentos PDF escaneados o con texto no seleccionable utilizando tecnología OCR.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">¿Qué es la extracción de texto con OCR?</h2>
              <p className="text-muted-foreground mb-4">
                El Reconocimiento Óptico de Caracteres (OCR) es una tecnología que permite convertir diferentes tipos 
                de documentos, como imágenes escaneadas o PDFs con texto no seleccionable, en datos editables y con 
                capacidad de búsqueda. Esta herramienta es especialmente útil cuando necesitas trabajar con documentos 
                escaneados o PDFs generados a partir de imágenes.
              </p>
              <p className="text-muted-foreground">
                PDFmanager utiliza tecnología OCR avanzada para:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Reconocer texto en imágenes:</span>
                    <span className="text-muted-foreground"> Extrae texto legible de PDFs escaneados o basados en imágenes.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Preservar el formato:</span>
                    <span className="text-muted-foreground"> Intenta mantener la estructura del texto original en la medida de lo posible.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Procesamiento local:</span>
                    <span className="text-muted-foreground"> Toda la extracción se realiza en tu navegador, manteniendo tus documentos privados.</span>
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
                    Puedes seleccionar cualquier archivo PDF del que desees extraer texto.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">2. Inicia la extracción de texto</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón "Extraer texto del PDF" para comenzar el proceso de OCR.
                    Verás una barra de progreso que indica el avance del procesamiento.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">3. Revisa el texto extraído</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez completado el proceso, podrás ver el texto extraído en la pestaña correspondiente.
                    Revisa el contenido para asegurarte de que se ha extraído correctamente.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">4. Guarda o copia el resultado</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes copiar el texto al portapapeles haciendo clic en "Copiar al portapapeles" o
                    descargarlo como archivo de texto plano haciendo clic en "Descargar como TXT".
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
                    <span className="font-medium text-foreground">Calidad del documento:</span> Los mejores resultados se obtienen con documentos escaneados de alta calidad y texto claro.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Revisa el resultado:</span> El OCR no es perfecto, especialmente con fuentes inusuales o documentos de baja calidad. Siempre revisa el texto extraído.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Tamaño del archivo:</span> Los archivos más grandes pueden tardar más tiempo en procesarse. Ten paciencia con documentos extensos.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Limitaciones:</span> El OCR puede tener dificultades con textos manuscritos, caligrafía artística o documentos con fondos complejos.
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
                    La tecnología OCR fue desarrollada originalmente en la década de 1950, pero ha avanzado significativamente 
                    con la inteligencia artificial moderna. Hoy en día, los algoritmos de OCR pueden reconocer múltiples idiomas 
                    y adaptarse a diferentes estilos de fuentes, lo que los hace mucho más precisos y versátiles que sus 
                    predecesores.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <Link 
                to="/tools/ocr" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <FileSearch className="h-5 w-5 mr-2" />
                Ir a Extraer Texto de PDF
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ConvertPDFGuide;
