
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Cpu, Zap } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

const About = () => {
  return (
    <Layout>
      <Header />
      
      <div className="py-12">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Acerca de PDF Local Studio</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Una aplicación web local para manipular archivos PDF sin necesidad de servicios externos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-subtle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="rounded-full bg-primary/10 p-3 inline-block mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-3">Privacidad Total</h2>
            <p className="text-muted-foreground">
              Tus archivos nunca salen de tu dispositivo. Todo el procesamiento ocurre localmente 
              en tu navegador, garantizando la máxima privacidad y seguridad.
            </p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-xl p-6 shadow-subtle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="rounded-full bg-primary/10 p-3 inline-block mb-4">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-3">Tecnología Avanzada</h2>
            <p className="text-muted-foreground">
              Utilizamos las APIs más modernas del navegador y bibliotecas JavaScript optimizadas
              para ofrecer un rendimiento excepcional sin necesidad de servidores.
            </p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-xl p-6 shadow-subtle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="rounded-full bg-primary/10 p-3 inline-block mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-3">Rápido y Eficiente</h2>
            <p className="text-muted-foreground">
              Diseñado para ser ligero y rápido. No hay tiempos de carga de servidor ni limitaciones
              de tamaño de archivo típicas de los servicios en línea.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="bg-white rounded-xl p-8 shadow-glass-lg mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold mb-4">Compartir en red local</h2>
          <p className="text-muted-foreground mb-4">
            Puedes compartir esta aplicación con otras personas en tu red local siguiendo estos pasos:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
            <li>Clona o descarga el repositorio en tu equipo</li>
            <li>Instala un servidor web local como <code>http-server</code> con npm: <code>npm install -g http-server</code></li>
            <li>Navega hasta la carpeta del proyecto y ejecuta: <code>http-server -p 8080</code></li>
            <li>La aplicación estará disponible en <code>http://TU_IP_LOCAL:8080</code> para cualquier dispositivo en tu red</li>
            <li>Comparte esta dirección con tus colegas para que puedan acceder a la aplicación</li>
          </ol>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-8 shadow-glass-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold mb-4">Limitaciones y consideraciones</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>El rendimiento depende de la capacidad de procesamiento del dispositivo del usuario</li>
            <li>Archivos muy grandes ({'>'}100MB) pueden ralentizar el navegador</li>
            <li>Algunas operaciones complejas pueden consumir mucha memoria</li>
            <li>La compatibilidad puede variar según el navegador (recomendamos Chrome o Firefox actualizados)</li>
            <li>Sin conexión a internet, no se podrán cargar bibliotecas externas como PDF.js si no están cacheadas</li>
          </ul>
        </motion.div>
      </div>
    </Layout>
  );
};

export default About;
