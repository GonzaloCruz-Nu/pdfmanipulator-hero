
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

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
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Convertir PDF a Texto - Guía Completa</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aprende a extraer texto de documentos PDF utilizando tecnología OCR (Reconocimiento Óptico de Caracteres).
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
                El OCR (Reconocimiento Óptico de Caracteres) es una tecnología que permite convertir diferentes tipos de documentos, 
                como imágenes escaneadas o PDFs, en datos editables y con capacidad de búsqueda.
              </p>
              <p className="text-muted-foreground">
                Con la herramienta de PDFmanager, puedes extraer texto de cualquier PDF, incluso aquellos que:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Contienen imágenes de texto:</span>
                    <span className="text-muted-foreground"> Documentos escaneados, capturas de pantalla o PDFs generados a partir de imágenes.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">PDFs protegidos:</span>
                    <span className="text-muted-foreground"> Documentos que no permiten copiar y pegar directamente.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Documentos complejos:</span>
                    <span className="text-muted-foreground"> Facturas, formularios, tablas y otros documentos con formatos especiales.</span>
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
                    Puedes seleccionar cualquier archivo PDF de hasta 15MB.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">2. Inicia la extracción de texto</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón "Extraer texto del PDF" para iniciar el proceso de reconocimiento OCR.
                    Verás una barra de progreso que indica el avance del proceso.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">3. Revisa el texto extraído</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez completado el proceso, podrás ver el texto extraído en la pestaña "Texto extraído".
                    Revisa el contenido para asegurarte de que se ha reconocido correctamente.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">4. Obtén el texto extraído</h3>
                  <p className="text-sm text-muted-foreground">
                    Tienes dos opciones para guardar el texto extraído:
                    • Copiar al portapapeles: Copia todo el texto para pegarlo en cualquier editor.
                    • Descargar como TXT: Guarda el texto en un archivo de texto plano en tu dispositivo.
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
                    <span className="font-medium text-foreground">Calidad del documento:</span> Cuanto mejor sea la calidad del PDF original, 
                    mejores serán los resultados del OCR. Si es posible, utiliza documentos con texto claro y nítido.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Revisa el resultado:</span> El OCR no es perfecto, especialmente con fuentes inusuales, 
                    textos en columnas o documentos con baja resolución. Siempre verifica el texto obtenido.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Tamaño del archivo:</span> Los archivos más grandes pueden tardar más tiempo en procesarse. 
                    Si tu PDF tiene muchas páginas, considera dividirlo primero con nuestra herramienta de división.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Limitaciones:</span> El OCR puede tener dificultades con caracteres manuscritos, 
                    símbolos especiales o textos en idiomas con caracteres no latinos. Los resultados pueden variar.
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
                    Nuestra herramienta de OCR procesa todo localmente en tu navegador, lo que significa que tus documentos 
                    nunca salen de tu dispositivo. Esto garantiza la máxima privacidad y seguridad para tus datos sensibles.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <Link 
                to="/tools/ocr" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2" />
                Ir a Convertir PDF a Texto
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ConvertPDFGuide;
