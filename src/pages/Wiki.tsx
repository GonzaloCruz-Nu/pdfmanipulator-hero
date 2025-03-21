
import React from 'react';
import { motion } from 'framer-motion';
import { Book, FileText, HelpCircle, Merge, Scissors, Zap, Unlock, FileCog, FileSearch, RotateCcw } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';

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
            <div className="mb-4">
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Guías de Herramientas</h2>
              <ul className="space-y-4">
                <li>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Merge className="h-5 w-5 mr-2 text-primary" />
                    Unir PDFs
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Combina múltiples documentos PDF en un solo archivo.
                  </p>
                  <Link to="/wiki/merge" className="text-primary text-sm hover:underline">
                    Leer guía completa →
                  </Link>
                </li>
                
                <li>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Scissors className="h-5 w-5 mr-2 text-primary" />
                    Dividir PDF
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Extrae páginas específicas o divide un PDF en múltiples archivos.
                  </p>
                  <Link to="/wiki/split" className="text-primary text-sm hover:underline">
                    Leer guía completa →
                  </Link>
                </li>

                <li>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-primary" />
                    Comprimir PDF
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Reduce el tamaño de tus archivos PDF manteniendo la calidad.
                  </p>
                  <Link to="/wiki/compress" className="text-primary text-sm hover:underline">
                    Leer guía completa →
                  </Link>
                </li>
                
                <li>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <RotateCcw className="h-5 w-5 mr-2 text-primary" />
                    Rotar PDF
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Cambia la orientación de páginas específicas o documentos completos.
                  </p>
                  <Link to="/wiki/rotate" className="text-primary text-sm hover:underline">
                    Leer guía completa →
                  </Link>
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="bg-white shadow-subtle rounded-xl p-6"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Más Herramientas</h2>
              <ul className="space-y-4">
                <li>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Unlock className="h-5 w-5 mr-2 text-primary" />
                    Desbloquear PDF
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Elimina contraseñas y restricciones de tus documentos PDF.
                  </p>
                  <Link to="/wiki/unlock" className="text-primary text-sm hover:underline">
                    Leer guía completa →
                  </Link>
                </li>
                
                <li>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <FileCog className="h-5 w-5 mr-2 text-primary" />
                    Editar PDF
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Añade texto, imágenes y anotaciones a tus documentos PDF.
                  </p>
                  <Link to="/wiki/edit" className="text-primary text-sm hover:underline">
                    Leer guía completa →
                  </Link>
                </li>

                <li>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <FileSearch className="h-5 w-5 mr-2 text-primary" />
                    Convertir PDF
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Convierte tus PDFs a texto mediante reconocimiento OCR.
                  </p>
                  <Link to="/wiki/convert" className="text-primary text-sm hover:underline">
                    Leer guía completa →
                  </Link>
                </li>
              </ul>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          <motion.div 
            variants={fadeInUp}
            className="bg-white shadow-subtle rounded-xl p-6 mb-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Book className="h-5 w-5 mr-2 text-primary" />
              Tutorial: Comprimir un PDF
            </h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Paso 1: Seleccionar archivo</h3>
                <p className="text-sm text-muted-foreground">
                  Haz clic en "Seleccionar PDF" o arrastra y suelta tu archivo en la zona indicada.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Paso 2: Elegir nivel de compresión</h3>
                <p className="text-sm text-muted-foreground">
                  Selecciona entre compresión baja, media o alta según tus necesidades.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Paso 3: Comprimir</h3>
                <p className="text-sm text-muted-foreground">
                  Haz clic en "Comprimir PDF" y espera a que se complete el proceso.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Paso 4: Descargar</h3>
                <p className="text-sm text-muted-foreground">
                  Una vez completado, descarga tu archivo PDF comprimido.
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-sm">
              <Link to="/tools/compress" className="text-primary hover:underline">
                Ir a Comprimir PDF →
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            variants={fadeInUp}
            className="bg-white shadow-subtle rounded-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-primary" />
              Preguntas Frecuentes
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">¿Es seguro usar estas herramientas con mis documentos?</h3>
                <p className="text-sm text-muted-foreground">
                  Sí, todas nuestras herramientas funcionan directamente en tu navegador. 
                  Tus archivos nunca se suben a nuestros servidores, garantizando total privacidad.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">¿Hay límites en el tamaño de los archivos?</h3>
                <p className="text-sm text-muted-foreground">
                  El límite depende de la capacidad de tu navegador, pero generalmente 
                  puedes procesar archivos de hasta 100MB sin problemas.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">¿Cómo puedo reportar un error o solicitar una característica?</h3>
                <p className="text-sm text-muted-foreground">
                  Contáctanos a través de la sección "Acerca de" con tus comentarios o sugerencias.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Wiki;
