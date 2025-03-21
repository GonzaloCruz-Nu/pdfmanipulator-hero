
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, File, Download, Image } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/FileUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

const ExtractImagesPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const { toast: uiToast } = useToast();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setExtractedImages([]);
    }
  };

  const handleExtractImages = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    // Simulación de extracción
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(Math.min(currentProgress, 95));
      
      if (currentProgress >= 95) {
        clearInterval(interval);
      }
    }, 200);
    
    try {
      // Aquí se implementaría la lógica real de extracción de imágenes
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        
        // Imágenes de muestra para la demostración
        setExtractedImages([
          'https://placekitten.com/300/200',
          'https://placekitten.com/301/201',
          'https://placekitten.com/302/202',
          'https://placekitten.com/300/203',
        ]);
        
        toast.success('Imágenes extraídas correctamente');
        setIsProcessing(false);
      }, 2500);
      
    } catch (error) {
      clearInterval(interval);
      console.error('Error al extraer imágenes:', error);
      uiToast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron extraer las imágenes del PDF."
      });
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    toast.info('Esta función estará disponible próximamente');
  };

  return (
    <Layout>
      <Header />
      
      <div className="container py-8 max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="bg-naranja/10 p-3 rounded-full">
              <ImagePlus className="h-8 w-8 text-naranja" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Extraer Imágenes de PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Extrae todas las imágenes contenidas en un documento PDF de forma rápida y sencilla.
            Ideal para recuperar fotografías, diagramas o ilustraciones de tus archivos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Selecciona un PDF</h2>
                <FileUpload 
                  onFilesSelected={handleFileSelected}
                  multiple={false}
                  accept=".pdf"
                  disabled={isProcessing}
                />
                
                {file && (
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-muted rounded-md flex items-center">
                      <File className="h-5 w-5 mr-2 flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleExtractImages}
                      disabled={isProcessing}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {isProcessing ? 'Procesando...' : 'Extraer imágenes'}
                    </Button>
                    
                    {isProcessing && (
                      <div className="space-y-2">
                        <Progress value={progress} />
                        <p className="text-xs text-center text-muted-foreground">
                          {progress}% completado
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {extractedImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6"
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Imágenes extraídas</h2>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDownloadAll}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar todas
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      Se han encontrado {extractedImages.length} imágenes en el documento.
                    </p>
                    
                    <Alert className="mb-4">
                      <AlertDescription>
                        Esta es una demostración. Las imágenes mostradas son de ejemplo y no provienen del PDF.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Vista previa</h2>
                
                {extractedImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {extractedImages.map((src, index) => (
                      <div 
                        key={index} 
                        className="border rounded-md overflow-hidden bg-background"
                      >
                        <div className="aspect-square relative">
                          <img 
                            src={src} 
                            alt={`Imagen ${index + 1}`} 
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-2 border-t bg-muted/50">
                          <p className="text-xs truncate">imagen_{index + 1}.jpg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center p-6">
                      <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Extrae imágenes de un PDF para verlas aquí
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ExtractImagesPDF;
