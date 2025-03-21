
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { useTranslatePDF } from '@/hooks/useTranslatePDF';

// API Key proporcionada por CoHispania - Nota: normalmente esto debería estar en una variable de entorno segura
const OPENAI_API_KEY = "your_openai_api_key_here"; // Replace this with your actual OpenAI API key

const TranslatePDF = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { 
    translatePDF, 
    isProcessing, 
    progress, 
    translatedFile,
    downloadTranslatedFile
  } = useTranslatePDF();

  const handleFileSelected = (files: File[]) => {
    const file = files[0] || null;
    setPdfFile(file);
    if (file) {
      toast.success(`Archivo seleccionado: ${file.name}`);
    }
  };

  const handleTranslate = async () => {
    if (!pdfFile) {
      toast.error('Por favor selecciona un archivo PDF');
      return;
    }

    try {
      await translatePDF(pdfFile, OPENAI_API_KEY);
    } catch (error) {
      console.error('Error en la traducción:', error);
      toast.error('Error al traducir el PDF');
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <Layout>
      <Header />
      
      <motion.div 
        className="container py-8"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 rounded-full bg-primary/10">
            <Languages className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Traducir PDF de Español a Inglés</h1>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-subtle mb-6">
          <p className="text-muted-foreground mb-4">
            Esta herramienta utiliza la API de OpenAI para traducir documentos PDF del español al inglés,
            manteniendo el formato original en la medida de lo posible.
          </p>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Subir PDF</TabsTrigger>
              <TabsTrigger value="preview" disabled={!pdfFile}>Vista previa</TabsTrigger>
              <TabsTrigger value="result" disabled={!translatedFile}>Resultado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="pt-4">
              <FileUpload
                onFilesSelected={handleFileSelected}
                accept="application/pdf"
                multiple={false}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="pt-4">
              {pdfFile && (
                <div className="border rounded-lg overflow-hidden h-[500px]">
                  <PdfPreview file={pdfFile} />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="result" className="pt-4">
              {translatedFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{translatedFile.name}</p>
                    <Button onClick={downloadTranslatedFile}>
                      Descargar traducción
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden h-[500px]">
                    <PdfPreview file={translatedFile} />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {isProcessing ? (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Traduciendo documento...</span>
                <span className="text-sm">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="mt-6">
              <Button 
                onClick={handleTranslate} 
                disabled={!pdfFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Procesando...' : 'Traducir PDF'}
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-subtle">
          <h2 className="text-lg font-medium mb-4">Notas importantes</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>La calidad de la traducción depende del contenido y la estructura del PDF.</li>
            <li>PDFs con texto escaneado o de baja calidad pueden no traducirse correctamente.</li>
            <li>Se mantendrá el formato original en la medida de lo posible.</li>
            <li>La traducción de documentos grandes puede consumir gran cantidad de créditos de la API.</li>
            <li>La herramienta funciona mejor con PDFs que contienen texto reconocible digitalmente.</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
};

export default TranslatePDF;
