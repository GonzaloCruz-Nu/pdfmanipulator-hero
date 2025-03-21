
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Files, FileSearch, Upload, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/FileUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ComparePDF = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [comparisonResults, setComparisonResults] = useState<any>(null);

  const handleFile1Selected = (files: File[]) => {
    if (files.length > 0) {
      setFile1(files[0]);
    }
  };

  const handleFile2Selected = (files: File[]) => {
    if (files.length > 0) {
      setFile2(files[0]);
    }
  };

  const handleCompare = () => {
    if (!file1 || !file2) {
      toast.error('Debes seleccionar dos archivos PDF para comparar');
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setComparisonResults(null);
    
    // Simulación del proceso de comparación
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(Math.min(currentProgress, 95));
      
      if (currentProgress >= 95) {
        clearInterval(interval);
      }
    }, 200);
    
    // Simulación de resultados después de 3 segundos
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      
      // Datos de ejemplo para la demostración
      setComparisonResults({
        totalPages: 10,
        matchingPages: 7,
        differences: [
          { page: 2, type: 'texto', description: 'Texto modificado en párrafo principal' },
          { page: 4, type: 'imagen', description: 'Imagen reemplazada' },
          { page: 8, type: 'formato', description: 'Cambio en márgenes y espaciado' },
        ]
      });
      
      toast.success('Comparación completada');
      setIsProcessing(false);
    }, 3000);
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
              <Files className="h-8 w-8 text-naranja" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Comparar PDFs</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Compara dos documentos PDF para encontrar diferencias de contenido, texto e imágenes.
            Ideal para verificar versiones de documentos legales, contratos o informes.
          </p>
        </motion.div>

        <Alert className="mb-8 max-w-3xl mx-auto">
          <Files className="h-4 w-4" />
          <AlertTitle>Herramienta en desarrollo</AlertTitle>
          <AlertDescription>
            Esta funcionalidad está en fase de desarrollo. El proceso de comparación mostrado es una simulación con datos de ejemplo.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upload">1. Subir PDFs</TabsTrigger>
                    <TabsTrigger value="compare" disabled={!file1 || !file2}>2. Comparar</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-medium mb-2">Primer documento PDF (original)</h3>
                        <FileUpload 
                          onFilesSelected={handleFile1Selected}
                          multiple={false}
                          accept=".pdf"
                          disabled={isProcessing}
                        />
                        {file1 && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm flex items-center">
                            <FileSearch className="h-4 w-4 mr-2 flex-shrink-0" />
                            {file1.name} ({(file1.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium mb-2">Segundo documento PDF (nueva versión)</h3>
                        <FileUpload 
                          onFilesSelected={handleFile2Selected}
                          multiple={false}
                          accept=".pdf"
                          disabled={isProcessing}
                        />
                        {file2 && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm flex items-center">
                            <FileSearch className="h-4 w-4 mr-2 flex-shrink-0" />
                            {file2.name} ({(file2.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleCompare}
                        disabled={!file1 || !file2 || isProcessing}
                      >
                        <Files className="mr-2 h-4 w-4" />
                        {isProcessing ? 'Comparando...' : 'Comparar documentos'}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="compare">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Proceso de comparación</h3>
                      
                      {isProcessing ? (
                        <div className="space-y-2">
                          <Progress value={progress} />
                          <p className="text-xs text-center text-muted-foreground">
                            {progress}% completado
                          </p>
                          <p className="text-sm">
                            Analizando y comparando documentos...
                          </p>
                        </div>
                      ) : comparisonResults ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted rounded-lg text-center">
                              <p className="text-xs text-muted-foreground">Total de páginas</p>
                              <p className="text-3xl font-bold">{comparisonResults.totalPages}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg text-center">
                              <p className="text-xs text-muted-foreground">Páginas coincidentes</p>
                              <p className="text-3xl font-bold">{comparisonResults.matchingPages}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Diferencias encontradas:</h4>
                            {comparisonResults.differences.map((diff: any, index: number) => (
                              <div key={index} className="border-l-2 border-primary pl-3 py-1 mb-2">
                                <p className="text-sm">
                                  <span className="font-medium">Página {diff.page}:</span>{' '}
                                  {diff.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Tipo: {diff.type}
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          <Button className="w-full" disabled>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver informe detallado
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center p-6">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            Selecciona dos PDFs y haz clic en "Comparar documentos"
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Vista de diferencias</h2>
                
                <div className="h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center p-6">
                    <Files className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      La visualización de diferencias estará disponible pronto
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Esta función permitirá ver diferencias en tiempo real entre los documentos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ComparePDF;
