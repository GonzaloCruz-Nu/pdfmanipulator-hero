
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import FileUpload from '@/components/FileUpload';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { rotatePdfPage } from '@/utils/pdf/rotatePdf';
import { toast } from 'sonner';
import PdfThumbnailSelector from '@/components/pdf/rotate/PdfThumbnailSelector';
import PdfPreviewSection from '@/components/pdf/rotate/PdfPreviewSection';
import SaveButton from '@/components/pdf/rotate/SaveButton';

const RotatePDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rotationAngles, setRotationAngles] = useState<{ [key: number]: number }>({});
  const [processingRotation, setProcessingRotation] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [generatingThumbnails, setGeneratingThumbnails] = useState(false);
  const [isPageSelectionEnabled, setIsPageSelectionEnabled] = useState(false);
  
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
    reloadCurrentPage,
    renderThumbnail
  } = usePdfRenderer(file);

  // Track when PDF is fully loaded and thumbnails are generated
  useEffect(() => {
    if (!pdfDocument || !file) {
      setIsPageSelectionEnabled(false);
      return;
    }
    
    const generateThumbnails = async () => {
      setGeneratingThumbnails(true);
      setIsPageSelectionEnabled(false);
      const thumbs: string[] = [];
      try {
        console.log("Comenzando a generar miniaturas...");
        for (let i = 1; i <= totalPages; i++) {
          const thumb = await renderThumbnail(i);
          if (thumb) thumbs.push(thumb);
        }
        setThumbnails(thumbs);
        console.log(`Miniaturas generadas: ${thumbs.length} de ${totalPages}`);
      } catch (error) {
        console.error('Error generando miniaturas:', error);
        toast.error('Error al generar las miniaturas del PDF');
      } finally {
        setGeneratingThumbnails(false);
        setIsPageSelectionEnabled(true);
        console.log("Selección de páginas habilitada");
      }
    };
    
    if (pdfDocument && totalPages > 0) {
      generateThumbnails();
    }
  }, [pdfDocument, totalPages, file, renderThumbnail]);

  // Reset selection state when file changes
  const handleFileChange = (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      setFile(uploadedFiles[0]);
      setRotationAngles({});
      setSelectedPages([]);
      setThumbnails([]);
      setShowSelectionMode(false);
      setIsPageSelectionEnabled(false);
      setGeneratingThumbnails(false);
    }
  };

  const handleRotate = (direction: 'clockwise' | 'counterclockwise') => {
    if (!file || !pdfDocument) return;
    
    const pagesToRotate = selectedPages.length > 0 ? selectedPages : [currentPage];
    const newRotationAngles = { ...rotationAngles };
    
    pagesToRotate.forEach(page => {
      const currentAngle = rotationAngles[page] || 0;
      const newAngle = direction === 'clockwise' 
        ? (currentAngle + 90) % 360 
        : (currentAngle - 90 + 360) % 360;
      
      newRotationAngles[page] = newAngle;
    });
    
    setRotationAngles(newRotationAngles);
    
    if (selectedPages.length === 0 || selectedPages.includes(currentPage)) {
      reloadCurrentPage(newRotationAngles[currentPage] || 0);
    }
  };

  const handleResetRotation = () => {
    if (!file || !pdfDocument) return;
    
    const pagesToReset = selectedPages.length > 0 ? selectedPages : [currentPage];
    const newRotationAngles = { ...rotationAngles };
    
    pagesToReset.forEach(page => {
      delete newRotationAngles[page];
    });
    
    setRotationAngles(newRotationAngles);
    
    if (selectedPages.length === 0 || selectedPages.includes(currentPage)) {
      reloadCurrentPage(0);
    }
  };

  const handleSaveRotations = async () => {
    if (!file || !pdfDocument || Object.keys(rotationAngles).length === 0) return;
    
    try {
      setProcessingRotation(true);
      toast.info("Procesando rotaciones, espere un momento...");
      
      await rotatePdfPage(file, rotationAngles);
      
      toast.success('PDF rotado correctamente. Descarga completada.');
    } catch (error) {
      console.error('Error al rotar PDF:', error);
      toast.error('Error al rotar PDF. Inténtalo de nuevo.');
    } finally {
      setProcessingRotation(false);
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    if (!isPageSelectionEnabled) return;
    
    setSelectedPages(prev => {
      if (prev.includes(pageNumber)) {
        return prev.filter(p => p !== pageNumber);
      } else {
        return [...prev, pageNumber];
      }
    });
  };

  const selectAllPages = () => {
    if (!isPageSelectionEnabled) return;
    
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(allPages);
  };

  const clearPageSelection = () => {
    if (!isPageSelectionEnabled) return;
    
    setSelectedPages([]);
  };

  const toggleSelectionMode = () => {
    if (generatingThumbnails || thumbnails.length === 0) return;
    
    setShowSelectionMode(prev => !prev);
    if (showSelectionMode) {
      setSelectedPages([]);
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Rotar PDF</h1>
          <p className="text-muted-foreground">
            Rota páginas individuales o múltiples en cualquier documento PDF. 
            Los cambios se procesan localmente en tu navegador.
          </p>
        </div>

        {!file ? (
          <Card className="p-6 max-w-xl mx-auto">
            <FileUpload
              onFilesSelected={handleFileChange}
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
                <button 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => setFile(null)}
                >
                  Cambiar archivo
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {showSelectionMode && (
                  <PdfThumbnailSelector 
                    thumbnails={thumbnails}
                    selectedPages={selectedPages}
                    rotationAngles={rotationAngles}
                    isPageSelectionEnabled={isPageSelectionEnabled}
                    generatingThumbnails={generatingThumbnails}
                    isLoading={isLoading}
                    totalPages={totalPages}
                    togglePageSelection={togglePageSelection}
                    selectAllPages={selectAllPages}
                    clearPageSelection={clearPageSelection}
                  />
                )}
                
                <PdfPreviewSection 
                  file={file}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  selectedPages={selectedPages}
                  rotationAngles={rotationAngles}
                  isLoading={isLoading}
                  handleRotate={handleRotate}
                  handleResetRotation={handleResetRotation}
                  toggleSelectionMode={toggleSelectionMode}
                  showSelectionMode={showSelectionMode}
                  thumbnails={thumbnails}
                  generatingThumbnails={generatingThumbnails}
                />
              </div>
              
              <SaveButton 
                onSave={handleSaveRotations}
                disabled={isLoading}
                processing={processingRotation}
                rotationCount={Object.keys(rotationAngles).length}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RotatePDF;
