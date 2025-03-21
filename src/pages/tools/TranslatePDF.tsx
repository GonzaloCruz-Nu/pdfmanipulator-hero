
import React, { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

// API Key proporcionada por CoHispania - Nota: normalmente esto debería estar en una variable de entorno segura
const OPENAI_API_KEY = "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";

const TranslatePDF = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [translationStarted, setTranslationStarted] = useState(false);
  const [useOcr, setUseOcr] = useState(true); // Por defecto, usamos OCR
  const [debugMode, setDebugMode] = useState(false);
  
  const { 
    translatePDF, 
    isProcessing, 
    progress, 
    translatedFile,
    downloadTranslatedFile,
    lastError
  } = useTranslatePDF();

  // Effect to auto-switch to results tab when translation is complete
  useEffect(() => {
    if (translationStarted && !isProcessing && translatedFile) {
      setActiveTab("result");
      setTranslationStarted(false);
      toast.success('Traducción completada con éxito');
    }
  }, [translationStarted, isProcessing, translatedFile]);

  const handleFileSelected = (files: File[]) => {
    const file = files[0] || null;
    setPdfFile(file);
    if (file) {
      // Verificar que el archivo sea realmente un PDF
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Por favor selecciona un archivo PDF válido');
        setPdfFile(null);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('El archivo es grande (>10MB). La traducción puede tardar más tiempo.');
      } else {
        toast.success(`Archivo seleccionado: ${file.name}`);
      }
      
      // Cambiar a la pestaña de vista previa
      setActiveTab("preview");
    }
  };

  const handleTranslate = async () => {
    if (!pdfFile) {
      toast.error('Por favor selecciona un archivo PDF');
      return;
    }

    try {
      setTranslationStarted(true);
      console.log("Iniciando proceso de traducción con OCR:", useOcr);
      const result = await translatePDF(pdfFile, OPENAI_API_KEY, useOcr);
      
      if (result.success && result.file) {
        console.log("Traducción completada exitosamente");
        setActiveTab("result");
        toast.success('Traducción completada con éxito');
      } else {
        console.error("Error en traducción:", result.message);
        toast.error(result.message || 'Error durante la traducción');
        setTranslationStarted(false);
      }
    } catch (error) {
      console.error('Error en la traducción:', error);
      toast.error('Error al traducir el PDF. Por favor intente con un archivo más pequeño o contacte a soporte.');
      setTranslationStarted(false);
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
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <>
                  <div className="flex items-center mb-4 space-x-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={useOcr} 
                        onChange={(e) => setUseOcr(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>Usar OCR para mejorar la extracción de texto</span>
                    </label>
                    <div className="ml-auto">
                      <label className="text-xs text-muted-foreground flex items-center space-x-1">
                        <input 
                          type="checkbox" 
                          checked={debugMode} 
                          onChange={(e) => setDebugMode(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span>Modo debug</span>
                      </label>
                    </div>
                  </div>
                  
                  {useOcr && (
                    <Alert className="mb-4">
                      <AlertDescription>
                        El modo OCR permite extraer texto de PDFs escaneados o que contienen principalmente imágenes.
                        La traducción puede tardar más tiempo, pero será más precisa.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="border rounded-lg overflow-hidden h-[500px]">
                    <PdfPreview file={pdfFile} />
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="result" className="pt-4">
              {translatedFile ? (
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
              ) : (
                <div className="text-center p-10 text-muted-foreground">
                  No hay resultados disponibles. Por favor traduzca un PDF primero.
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
              <p className="text-xs text-muted-foreground mt-2">
                {useOcr 
                  ? "Este proceso puede tardar varios minutos debido al procesamiento OCR y la traducción."
                  : "Este proceso puede tardar varios minutos dependiendo del tamaño del documento."
                }
              </p>
              
              {debugMode && lastError && (
                <div className="mt-4 p-3 bg-red-50 text-red-800 rounded text-xs">
                  <p className="font-semibold">Error:</p>
                  <pre className="overflow-auto max-h-32 whitespace-pre-wrap">{lastError}</pre>
                </div>
              )}
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
            <li>Activar el modo OCR permite extraer texto de PDFs escaneados o con imágenes.</li>
            <li>La traducción mantiene el formato, imágenes y estructura original del PDF.</li>
            <li>La traducción de documentos grandes puede consumir gran cantidad de créditos de la API.</li>
            <li>Si experimenta errores durante la traducción, intente con un PDF más pequeño o contacte con soporte.</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
};

export default TranslatePDF;
