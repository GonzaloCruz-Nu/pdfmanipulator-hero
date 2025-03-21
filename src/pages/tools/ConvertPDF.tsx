
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { useSimpleConvertPDF } from '@/hooks/useSimpleConvertPDF';
import { Progress } from '@/components/ui/progress';
import PreviewPanel from '@/components/convert-pdf/PreviewPanel';
import ConversionHeader from '@/components/convert-pdf/ConversionHeader';
import { Copy, Download, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const ConvertPDF = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {
    extractTextFromPDFWithOCR,
    isProcessing,
    progress,
    extractedText,
    copyToClipboard,
    downloadAsTextFile
  } = useSimpleConvertPDF();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleProcessPDF = async () => {
    if (!selectedFile) return;
    await extractTextFromPDFWithOCR(selectedFile);
  };

  return (
    <Layout>
      <Header />
      
      <div className="container px-4 py-8 mx-auto">
        <ConversionHeader />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">1. Selecciona un PDF</h2>
              <FileUpload
                onFilesSelected={handleFileSelected}
                acceptedFileTypes={[".pdf"]}
                maxFiles={1}
                maxSize={15}
                disabled={isProcessing}
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">2. Extraer texto</h2>
              <Button 
                onClick={handleProcessPDF} 
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" /> 
                {isProcessing ? 'Procesando...' : 'Extraer texto del PDF'}
              </Button>
              
              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">{progress}% completado</p>
                </div>
              )}
            </Card>

            {extractedText && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">3. Obtener el texto extraído</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copiar al portapapeles
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadAsTextFile}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" /> Descargar como TXT
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {selectedFile ? (
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Vista previa</TabsTrigger>
                  <TabsTrigger value="extracted" disabled={!extractedText}>Texto extraído</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <PreviewPanel file={selectedFile} />
                </TabsContent>
                <TabsContent value="extracted" className="mt-4">
                  {extractedText ? (
                    <Card className="h-[500px] p-4">
                      <ScrollArea className="h-full">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {extractedText}
                        </pre>
                      </ScrollArea>
                    </Card>
                  ) : (
                    <Card className="h-[500px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        Procesa el PDF para ver el texto extraído
                      </p>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="mb-2">Selecciona un archivo PDF para comenzar</p>
                  <p className="text-sm">Soportamos archivos de hasta 15MB</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConvertPDF;
