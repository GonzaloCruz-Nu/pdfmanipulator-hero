
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Languages, Info, Construction } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TranslatePDF = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedFile, setTranslatedFile] = useState<File | null>(null);

  // Effect to auto-switch to results tab when translation is complete
  useEffect(() => {
    if (!isProcessing && translatedFile) {
      setActiveTab("result");
      toast.success('Traducción completada con éxito');
    }
  }, [isProcessing, translatedFile]);

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
      
      toast.success(`Archivo seleccionado: ${file.name}`);
      
      // Cambiar a la pestaña de vista previa
      setActiveTab("preview");
    }
  };

  const handleTranslate = async () => {
    if (!pdfFile) {
      toast.error('Por favor selecciona un archivo PDF');
      return;
    }

    // Esta función es un simulacro mientras se implementa la funcionalidad real
    setIsProcessing(true);
    setProgress(0);
    
    // Simular progreso
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 300);
    
    // Simular finalización después de 5 segundos
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setIsProcessing(false);
      toast.info('Funcionalidad en mantenimiento. Estamos trabajando para mejorarla.');
      
      // No establecemos translatedFile para que no aparezca un resultado
    }, 3000);
  };

  const downloadTranslatedFile = () => {
    if (!translatedFile) {
      toast.error('No hay archivo para descargar');
      return;
    }
    
    // Lógica de descarga (simulada por ahora)
    toast.success('Archivo descargado correctamente');
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
        
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <Construction className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Esta herramienta se encuentra temporalmente en mantenimiento. Estamos trabajando para mejorar sus funcionalidades y rendimiento. 
            Disculpe las molestias.
          </AlertDescription>
        </Alert>
        
        <div className="bg-white rounded-xl p-6 shadow-subtle mb-6">
          <p className="text-muted-foreground mb-4">
            Esta herramienta utiliza inteligencia artificial para traducir documentos PDF del español al inglés,
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
                Este proceso puede tardar varios minutos dependiendo del tamaño del documento.
              </p>
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
            <li>Para mejores resultados, asegúrese que el PDF contenga texto seleccionable.</li>
            <li>Documentos escaneados o con imágenes pueden requerir procesamiento OCR previo.</li>
            <li>La herramienta mantiene imágenes, tablas y otros elementos no textuales sin cambios.</li>
            <li>El tiempo de procesamiento varía según el tamaño y complejidad del documento.</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
};

export default TranslatePDF;
