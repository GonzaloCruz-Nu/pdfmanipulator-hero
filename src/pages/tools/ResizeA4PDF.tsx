
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { useResizeA4PDF } from '@/hooks/useResizeA4PDF';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowDown, Download, FileWarning } from 'lucide-react';

const ResizeA4PDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { 
    resizePdfToA4, 
    isProcessing, 
    progress, 
    resizedFile, 
    downloadResizedFile,
    resizeError
  } = useResizeA4PDF();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setShowPreview(false);
    }
  };

  const handleResize = async () => {
    if (file) {
      await resizePdfToA4(file);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  return (
    <Layout>
      <Header />
      <div className="container max-w-5xl mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Ajustar PDF a tamaño A4</h1>
          <p className="text-muted-foreground">
            Convierte documentos de formatos A3, A2 u otros tamaños al estándar A4 para impresión o archivo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Selecciona el PDF</CardTitle>
              <CardDescription>
                Sube el documento que deseas ajustar a formato A4
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
                disabled={isProcessing}
                infoText="Arrastra aquí tu PDF o haz clic para seleccionarlo"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Ajustar a formato A4</CardTitle>
              <CardDescription>
                El documento se redimensionará manteniendo las proporciones
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
              {file && !resizedFile && !isProcessing && (
                <>
                  <Button 
                    onClick={handleResize} 
                    className="w-full"
                    disabled={!file || isProcessing}
                  >
                    Ajustar a A4
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handlePreview} 
                    className="w-full"
                    disabled={!file}
                  >
                    Previsualizar Original
                  </Button>
                </>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Procesando... {progress.toFixed(0)}%
                  </p>
                </div>
              )}

              {resizeError && (
                <Alert variant="destructive">
                  <FileWarning className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{resizeError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {resizedFile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. Descargar PDF Ajustado</CardTitle>
              <CardDescription>
                Tu documento ha sido redimensionado correctamente al formato A4
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <div className="bg-muted/50 p-4 rounded-lg text-center w-full">
                <p className="text-sm">
                  El documento ha sido ajustado a tamaño A4 correctamente
                </p>
                <div className="mt-2 flex items-center justify-center gap-2 text-muted-foreground">
                  <ArrowDown className="h-4 w-4" />
                  <span>Formato A4 (210 × 297 mm)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <Button 
                  onClick={downloadResizedFile} 
                  className="w-full" 
                  variant="default"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF Ajustado
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePreview} 
                  className="w-full"
                >
                  Previsualizar Resultado
                </Button>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              El procesamiento se realiza localmente en tu navegador. Ningún archivo es subido a servidores externos.
            </CardFooter>
          </Card>
        )}

        {showPreview && (
          <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-medium">Previsualización de PDF</h3>
                <Button variant="outline" size="sm" onClick={handleClosePreview}>
                  Cerrar
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <PdfPreview 
                  file={resizedFile || file} 
                  onClose={handleClosePreview}
                  className="h-[70vh]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResizeA4PDF;
