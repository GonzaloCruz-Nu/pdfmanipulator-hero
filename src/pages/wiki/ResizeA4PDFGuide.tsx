
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, FileType, Ruler, Settings, Download, HelpCircle, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ResizeA4PDFGuide = () => {
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
      
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <motion.div 
          className="text-center mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Guía: Ajustar PDF a tamaño A4</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aprende a convertir documentos PDF de distintos tamaños al formato estándar A4
          </p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Sección de introducción */}
          <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">¿Qué es el ajuste a tamaño A4?</h2>
            <p className="mb-4">
              La herramienta de ajuste a tamaño A4 permite redimensionar documentos PDF de diversos tamaños 
              (como A3, A2, o personalizados) al formato estándar internacional A4 (210 × 297 mm), manteniendo 
              la proporción y legibilidad del contenido.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Características principales:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Conversión automática de cualquier tamaño de PDF al formato A4</li>
                <li>Preservación de la relación de aspecto del contenido original</li>
                <li>Procesamiento local (sin subir archivos a servidores)</li>
                <li>Vista previa antes y después de la conversión</li>
                <li>Optimización para documentos técnicos, planos y diagramas</li>
              </ul>
            </div>
          </motion.div>

          {/* Paso a paso guía */}
          <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Paso a paso: Cómo ajustar un PDF a tamaño A4</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileType className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Paso 1: Seleccionar archivo</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Haz clic en la zona de carga o arrastra tu archivo PDF al área indicada. 
                    La herramienta acepta archivos PDF de cualquier tamaño.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Ruler className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Paso 2: Iniciar el ajuste</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Una vez cargado el archivo, haz clic en el botón "Ajustar a A4" para iniciar el proceso de conversión.
                    Opcionalmente, puedes previsualizar el archivo original antes de procesarlo.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Paso 3: Procesamiento</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    La herramienta procesará automáticamente tu documento, ajustando el contenido al tamaño A4 mientras 
                    mantiene la proporción original. Un indicador de progreso mostrará el avance del proceso.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Paso 4: Descargar el resultado</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Una vez completado el ajuste, podrás previsualizar el resultado y descargarlo como un nuevo archivo PDF 
                    optimizado para el tamaño A4, ideal para impresión o compartir.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                to="/tools/resize-a4" 
                className="inline-flex items-center text-primary hover:underline"
              >
                Ir a la herramienta Ajustar a A4
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Explicación técnica */}
          <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Información técnica</h2>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Dimensiones del formato A4</h3>
              <div className="flex flex-col md:flex-row md:items-center justify-center gap-4 mb-4">
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium">Tamaño A4</p>
                  <p className="text-xl font-bold mt-1">210 × 297 mm</p>
                </div>
                <ArrowDown className="hidden md:block h-8 w-8 text-muted-foreground rotate-90 md:rotate-0" />
                <ArrowDown className="block md:hidden h-8 w-8 text-muted-foreground" />
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium">En puntos (PDF)</p>
                  <p className="text-xl font-bold mt-1">595 × 842 pts</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                El estándar A4 es parte de la serie ISO 216, ampliamente utilizado en todo el mundo excepto 
                en América del Norte. Es el formato ideal para documentos profesionales, académicos e institucionales.
              </p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Proceso de ajuste</h3>
              <p className="text-sm text-muted-foreground">
                El proceso mantiene la relación de aspecto original, escalando el contenido para que se ajuste 
                completamente dentro de los límites del formato A4. Esto asegura que no se corte ninguna parte 
                del documento original, aunque puede resultar en márgenes blancos si la relación de aspecto 
                difiere significativamente.
              </p>
            </div>
          </motion.div>

          {/* Preguntas frecuentes */}
          <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
            <div className="flex items-center mb-4">
              <HelpCircle className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-xl font-bold">Preguntas frecuentes</h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  ¿Se perderá calidad al ajustar mi documento a tamaño A4?
                </AccordionTrigger>
                <AccordionContent>
                  No, la herramienta está diseñada para preservar la calidad del documento original. El proceso 
                  utiliza técnicas de renderizado optimizadas para mantener la nitidez del texto y las imágenes. 
                  Sin embargo, si reduces un documento muy grande (A0, A1) a tamaño A4, algunos detalles muy 
                  pequeños podrían ser menos legibles debido a la reducción de escala.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  ¿Qué tamaños de PDF puedo convertir a A4?
                </AccordionTrigger>
                <AccordionContent>
                  La herramienta puede procesar documentos PDF de cualquier tamaño, incluyendo formatos estándar 
                  como A3, A2, A1, A0, así como tamaños personalizados o formatos estadounidenses como Letter 
                  o Legal. Funciona tanto para reducir documentos grandes como para aumentar documentos pequeños.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  ¿Se conservará el texto seleccionable en el PDF resultante?
                </AccordionTrigger>
                <AccordionContent>
                  El proceso de ajuste a A4 utiliza un método de renderizado que convierte el contenido a imágenes 
                  para asegurar la fidelidad visual. Esto significa que el texto seleccionable en el documento 
                  original no se conservará como texto en el documento ajustado. Sin embargo, esto garantiza 
                  que la apariencia visual sea exactamente la misma independientemente de las fuentes o elementos 
                  gráficos utilizados.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  ¿Mis archivos son subidos a algún servidor durante el proceso?
                </AccordionTrigger>
                <AccordionContent>
                  No. Todo el procesamiento se realiza localmente en tu navegador. Tus documentos nunca abandonan 
                  tu dispositivo, lo que garantiza total privacidad y seguridad. Esto también significa que puedes 
                  utilizar la herramienta sin conexión a internet una vez que la página ha cargado.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>
                  ¿Hay un límite en el tamaño de archivo que puedo procesar?
                </AccordionTrigger>
                <AccordionContent>
                  El límite depende principalmente de la capacidad de tu dispositivo y navegador. En general, 
                  la herramienta puede manejar archivos de hasta 100MB, pero archivos muy grandes podrían 
                  ralentizar el proceso o requerir más recursos de tu sistema.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>

          {/* Consejos y trucos */}
          <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Consejos y mejores prácticas</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Para planos técnicos y diagramas</h3>
                <p className="text-sm text-muted-foreground">
                  Al ajustar planos de ingeniería o arquitectura, verifica que las escalas indicadas ya no sean 
                  precisas en el documento resultante. Considera añadir una nota sobre la escala original y el ajuste realizado.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Optimización para impresión</h3>
                <p className="text-sm text-muted-foreground">
                  Si el documento original contiene colores, considera convertirlo a escala de grises antes de ajustarlo 
                  si planeas imprimirlo en blanco y negro, para mejorar el contraste y la legibilidad.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">Documentos con múltiples páginas</h3>
                <p className="text-sm text-muted-foreground">
                  La herramienta procesa todas las páginas del documento, ajustando cada una individualmente. 
                  Si algunas páginas ya están en formato A4, estas mantendrán sus dimensiones originales.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Necesitas ajustar un documento a tamaño A4?
            </p>
            <Link 
              to="/tools/resize-a4" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ir a la herramienta Ajustar a A4
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ResizeA4PDFGuide;
