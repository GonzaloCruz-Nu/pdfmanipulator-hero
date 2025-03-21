
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Stamp, CheckCircle, HelpCircle, ArrowRight, List, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

const WatermarkPDFGuide = () => {
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
      
      <div className="container py-12 max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Guía: Añadir Marca de Agua a PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aprende a proteger tus documentos añadiendo marcas de agua personalizadas a tus archivos PDF.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <motion.div 
              className="bg-white shadow-subtle rounded-xl p-6 mb-6"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <div className="flex items-center mb-4">
                <Stamp className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-xl font-bold">¿Qué es una marca de agua en PDF?</h2>
              </div>
              
              <p className="mb-4">
                Una marca de agua es un texto o imagen superpuesto en las páginas de un documento PDF que 
                indica propiedad, estado o confidencialidad. Las marcas de agua son útiles para:
              </p>
              
              <ul className="space-y-2 mb-4 list-disc pl-6 text-muted-foreground">
                <li>Proteger documentos contra el uso no autorizado</li>
                <li>Indicar el estado del documento (como "BORRADOR" o "CONFIDENCIAL")</li>
                <li>Mostrar información de copyright o propiedad</li>
                <li>Añadir información de identificación a documentos compartidos</li>
              </ul>
              
              <p>
                Nuestra herramienta te permite añadir fácilmente texto como marca de agua personalizable 
                a cualquier documento PDF, permitiéndote controlar el color, opacidad, tamaño y ángulo.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white shadow-subtle rounded-xl p-6 mb-6"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center mb-4">
                <List className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-xl font-bold">Paso a paso: Añadir marca de agua</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Selecciona el archivo PDF</h3>
                    <p className="text-muted-foreground text-sm">
                      Haz clic en la zona de selección de archivos o arrastra y suelta tu documento PDF.
                      Recuerda que el procesamiento se realiza en tu navegador, por lo que tus archivos
                      nunca se suben a servidores externos.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Configura el texto de la marca de agua</h3>
                    <p className="text-muted-foreground text-sm">
                      Escribe el texto que deseas usar como marca de agua. Puedes usar textos como "CONFIDENCIAL",
                      "BORRADOR", "NO COPIAR", tu nombre o cualquier otro texto relevante para tu documento.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Personaliza la apariencia</h3>
                    <p className="text-muted-foreground text-sm">
                      Ajusta el color, opacidad, tamaño y ángulo de la marca de agua. Para documentos oficiales,
                      se recomienda usar una opacidad del 30-40% para no obstaculizar la lectura del contenido.
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Color:</span> Elige entre colores predefinidos o personaliza
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Opacidad:</span> Ajusta la transparencia (10-100%)
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Tamaño:</span> Define el tamaño del texto (12-72px)
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Ángulo:</span> Rota el texto (0-360 grados)
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Aplica la marca de agua</h3>
                    <p className="text-muted-foreground text-sm">
                      Haz clic en "Aplicar marca de agua" y espera a que se procese tu documento. El tiempo
                      de procesamiento dependerá del tamaño de tu PDF y de la capacidad de tu dispositivo.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Previsualiza y descarga</h3>
                    <p className="text-muted-foreground text-sm">
                      Una vez completado el procesamiento, podrás previsualizar el resultado y descargar tu PDF
                      con la marca de agua aplicada a todas las páginas del documento.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white shadow-subtle rounded-xl p-6"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-xl font-bold">Preguntas frecuentes</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">¿Es seguro usar esta herramienta?</h3>
                  <p className="text-muted-foreground text-sm">
                    Sí, todo el procesamiento se realiza localmente en tu navegador. Tus archivos PDF nunca
                    se envían a nuestros servidores, garantizando total privacidad y seguridad.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">¿Hay límite de tamaño para los archivos?</h3>
                  <p className="text-muted-foreground text-sm">
                    La herramienta puede procesar archivos de hasta 100MB, aunque el rendimiento puede variar
                    dependiendo de la capacidad de tu dispositivo.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">¿Puedo añadir imágenes como marca de agua?</h3>
                  <p className="text-muted-foreground text-sm">
                    Actualmente, nuestra herramienta solo permite añadir texto como marca de agua. La 
                    funcionalidad para añadir imágenes está en desarrollo.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">¿Puedo colocar la marca de agua en posiciones específicas?</h3>
                  <p className="text-muted-foreground text-sm">
                    En la versión actual, la marca de agua se coloca en el centro de cada página. Estamos 
                    trabajando para añadir opciones de posicionamiento personalizado en futuras actualizaciones.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="md:col-span-1">
            <motion.div 
              className="bg-white shadow-subtle rounded-xl p-6 mb-6 sticky top-24"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-lg font-bold">Consejos útiles</h2>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Opacidad óptima:</strong> Usa entre 30-40% para mantener la legibilidad del documento.
                  </span>
                </li>
                
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Tamaño efectivo:</strong> Para un texto que cubra gran parte de la página, usa 36-48px.
                  </span>
                </li>
                
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Ángulo diagonal:</strong> Un ángulo de 45° suele funcionar bien para marcas de agua.
                  </span>
                </li>
                
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Colores recomendados:</strong> El gris es discreto. Para mayor visibilidad, usa rojo para documentos confidenciales.
                  </span>
                </li>
                
                <li className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Ten en cuenta que algunas impresoras pueden no reproducir fielmente las marcas de agua con baja opacidad.
                  </span>
                </li>
              </ul>
              
              <Separator className="my-4" />
              
              <div className="flex justify-center">
                <Link 
                  to="/tools/watermark"
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
                >
                  <Stamp className="h-4 w-4 mr-2" />
                  Ir a la herramienta
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WatermarkPDFGuide;
