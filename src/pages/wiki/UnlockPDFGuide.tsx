
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Unlock, LockOpen, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

const UnlockPDFGuide = () => {
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
              <Unlock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Desbloquear PDFs - Guía Completa</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aprende a eliminar contraseñas y restricciones de tus documentos PDF de forma segura y eficiente.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="bg-white shadow-subtle rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">¿Qué es el desbloqueo de PDFs?</h2>
              <p className="text-muted-foreground mb-4">
                El desbloqueo de PDFs es un proceso que permite eliminar las restricciones de seguridad de un 
                documento PDF, como contraseñas de apertura o permisos que limitan la impresión, copia o edición. 
                Esta función es útil cuando necesitas trabajar con documentos protegidos a los que tienes acceso legítimo.
              </p>
              <p className="text-muted-foreground">
                PDFmanager te permite desbloquear dos tipos de protecciones:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Contraseña de usuario (apertura):</span>
                    <span className="text-muted-foreground"> La que se requiere para abrir el documento. Necesitarás conocer esta contraseña.</span>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">•</span>
                  <div>
                    <span className="font-medium">Restricciones de permisos:</span>
                    <span className="text-muted-foreground"> Limitaciones para imprimir, copiar texto o editar el documento. Estas se pueden eliminar sin conocer la contraseña original.</span>
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
                    Puedes seleccionar cualquier archivo PDF protegido que desees desbloquear.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">2. Identifica el tipo de protección</h3>
                  <p className="text-sm text-muted-foreground">
                    La herramienta detectará automáticamente el tipo de protección del documento:
                    contraseña de apertura, restricciones de permisos, o ambas.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">3. Introduce la contraseña (si es necesario)</h3>
                  <p className="text-sm text-muted-foreground">
                    Si el PDF está protegido con una contraseña de usuario (apertura), deberás 
                    introducirla en el campo correspondiente. Si solo tiene restricciones de permisos, 
                    este paso no será necesario.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">4. Desbloquea el PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón "Desbloquear PDF" para iniciar el proceso.
                    Verás una barra de progreso indicando el avance de la operación.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">5. Verifica el resultado</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez completado el proceso, podrás previsualizar el documento desbloqueado
                    para asegurarte de que se han eliminado todas las restricciones correctamente.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-medium mb-2">6. Descarga el PDF desbloqueado</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en "Descargar PDF desbloqueado" para guardar el documento sin restricciones
                    en tu dispositivo.
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
                    <span className="font-medium text-foreground">Usa contraseñas exactas:</span> Asegúrate de introducir la contraseña correctamente, respetando mayúsculas y minúsculas.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Comprueba todos los permisos:</span> Después de desbloquear, verifica que puedes realizar todas las acciones que necesitas (imprimir, copiar, editar).
                  </p>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Renombra el archivo:</span> Guarda el archivo desbloqueado con un nombre diferente para mantener también la versión original.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Limitaciones:</span> Algunos PDFs con cifrado avanzado pueden no ser desbloqueables con esta herramienta. En esos casos, se mostrará un mensaje indicándolo.
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
                    El desbloqueo de PDFs en PDFmanager se realiza completamente en tu navegador, lo que significa 
                    que tus archivos y contraseñas nunca abandonan tu dispositivo. Esto garantiza la máxima 
                    privacidad y seguridad. Recuerda usar esta herramienta solo con documentos a los que tengas 
                    acceso legítimo y respetando los derechos de autor.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <Link 
                to="/tools/unlock" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <LockOpen className="h-5 w-5 mr-2" />
                Ir a Desbloquear PDFs
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default UnlockPDFGuide;
