
import React, { useState } from 'react';
import { Undo2, RotateCw, RotateCcw, Save } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { rotatePdfPage } from '@/utils/pdf/rotatePdf';
import { toast } from 'sonner';

const RotatePDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rotationAngles, setRotationAngles] = useState<{ [key: number]: number }>({});
  const [processingRotation, setProcessingRotation] = useState(false);
  
  const {
    currentPage,
    totalPages,
    pageUrl,
    pdfDocument,
    isLoading,
    error,
    renderPage,
    nextPage,
    prevPage,
    reloadCurrentPage
  } = usePdfRenderer(file);

  const handleFileChange = (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      setFile(uploadedFiles[0]);
      setRotationAngles({});
    }
  };

  const handleRotate = (direction: 'clockwise' | 'counterclockwise') => {
    if (!file || !pdfDocument) return;
    
    // Calculate new rotation angle (add or subtract 90 degrees)
    const currentAngle = rotationAngles[currentPage] || 0;
    const newAngle = direction === 'clockwise' 
      ? (currentAngle + 90) % 360 
      : (currentAngle - 90 + 360) % 360;
    
    // Update rotation angles state
    setRotationAngles(prev => ({
      ...prev,
      [currentPage]: newAngle
    }));
    
    // Apply rotation to preview
    reloadCurrentPage(newAngle);
  };

  const handleResetRotation = () => {
    if (!file || !pdfDocument) return;
    
    // Reset rotation for current page
    setRotationAngles(prev => {
      const newAngles = { ...prev };
      delete newAngles[currentPage];
      return newAngles;
    });
    
    // Reload current page without rotation
    reloadCurrentPage(0);
  };

  const handleSaveRotations = async () => {
    if (!file || !pdfDocument || Object.keys(rotationAngles).length === 0) return;
    
    try {
      setProcessingRotation(true);
      toast.info("Procesando rotaciones, espere un momento...");
      
      // Save rotated PDF
      await rotatePdfPage(file, rotationAngles);
      
      toast.success('PDF rotado correctamente. Descarga completada.');
    } catch (error) {
      console.error('Error al rotar PDF:', error);
      toast.error('Error al rotar PDF. Inténtalo de nuevo.');
    } finally {
      setProcessingRotation(false);
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Rotar PDF</h1>
          <p className="text-muted-foreground">
            Rota páginas individuales en cualquier documento PDF. 
            Los cambios se procesan localmente en tu navegador.
          </p>
        </div>

        {!file ? (
          <Card className="p-6 max-w-xl mx-auto">
            <FileUpload
              onFilesAdded={handleFileChange}
              maxFiles={1}
              maxSize={100}
              accept=".pdf"
              infoText="Arrastra un archivo PDF o haz clic para seleccionarlo"
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{file.name}</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setFile(null)}
                >
                  Cambiar archivo
                </Button>
              </div>
              
              <div className="relative">
                <PdfPreview file={file} className="h-[600px]" />
                
                {/* Rotation tools overlay */}
                <div className="absolute top-12 right-4 flex flex-col gap-2 z-20">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={() => handleRotate('counterclockwise')}
                    disabled={isLoading}
                    title="Rotar 90° a la izquierda"
                  >
                    <RotateCcw />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={() => handleRotate('clockwise')}
                    disabled={isLoading}
                    title="Rotar 90° a la derecha"
                  >
                    <RotateCw />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={handleResetRotation}
                    disabled={isLoading || !(rotationAngles[currentPage] !== undefined)}
                    title="Restablecer rotación"
                  >
                    <Undo2 />
                  </Button>
                </div>
                
                {/* Page info */}
                <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                  <div className="bg-white px-4 py-2 rounded-full shadow text-sm">
                    Página {currentPage} de {totalPages}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div>
                  {Object.keys(rotationAngles).length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(rotationAngles).length} {Object.keys(rotationAngles).length === 1 ? 'página rotada' : 'páginas rotadas'}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleSaveRotations}
                  disabled={isLoading || processingRotation || Object.keys(rotationAngles).length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RotatePDF;
