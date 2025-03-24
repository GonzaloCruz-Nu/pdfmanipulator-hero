
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import PdfPreview from '@/components/PdfPreview';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { rotatePdfPage } from '@/utils/pdf/rotatePdf';
import { toast } from 'sonner';

// Import the refactored components
import PdfThumbnailSelector from '@/components/rotate-pdf/PdfThumbnailSelector';
import RotationControls from '@/components/rotate-pdf/RotationControls';
import PageInfo from '@/components/rotate-pdf/PageInfo';
import SaveControls from '@/components/rotate-pdf/SaveControls';
import RotatePdfUpload from '@/components/rotate-pdf/RotatePdfUpload';

const RotatePDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rotationAngles, setRotationAngles] = useState<{ [key: number]: number }>({});
  const [processingRotation, setProcessingRotation] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  
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

  // Effect to generate thumbnails when PDF loads
  useEffect(() => {
    if (!pdfDocument || !file) return;
    
    const generateThumbnails = async () => {
      const thumbs: string[] = [];
      for (let i = 1; i <= totalPages; i++) {
        const thumb = await renderThumbnail(i);
        if (thumb) thumbs.push(thumb);
      }
      setThumbnails(thumbs);
    };
    
    generateThumbnails();
  }, [pdfDocument, totalPages, file, renderThumbnail]);

  const handleFileChange = (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      setFile(uploadedFiles[0]);
      setRotationAngles({});
      setSelectedPages([]);
      setThumbnails([]);
      setShowSelectionMode(false);
    }
  };

  const handleRotate = (direction: 'clockwise' | 'counterclockwise') => {
    if (!file || !pdfDocument) return;
    
    const pagesToRotate = selectedPages.length > 0 ? selectedPages : [currentPage];
    const newRotationAngles = { ...rotationAngles };
    
    pagesToRotate.forEach(page => {
      // Calculate new rotation angle (add or subtract 90 degrees)
      const currentAngle = rotationAngles[page] || 0;
      const newAngle = direction === 'clockwise' 
        ? (currentAngle + 90) % 360 
        : (currentAngle - 90 + 360) % 360;
      
      // Update rotation angles state
      newRotationAngles[page] = newAngle;
    });
    
    setRotationAngles(newRotationAngles);
    
    // Apply rotation to preview if we're only viewing the current page
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
    
    // Reload current page without rotation if appropriate
    if (selectedPages.length === 0 || selectedPages.includes(currentPage)) {
      reloadCurrentPage(0);
    }
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

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNumber)) {
        return prev.filter(p => p !== pageNumber);
      } else {
        return [...prev, pageNumber];
      }
    });
  };

  const selectAllPages = () => {
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(allPages);
  };

  const clearPageSelection = () => {
    setSelectedPages([]);
  };

  const toggleSelectionMode = () => {
    setShowSelectionMode(prev => !prev);
    if (showSelectionMode) {
      // Clear selection when exiting selection mode
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
          <RotatePdfUpload 
            file={file}
            handleFileChange={handleFileChange}
            setFile={setFile}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <RotatePdfUpload 
                file={file}
                handleFileChange={handleFileChange}
                setFile={setFile}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Sidebar with thumbnails and page selection */}
                {showSelectionMode && (
                  <PdfThumbnailSelector
                    thumbnails={thumbnails}
                    selectedPages={selectedPages}
                    rotationAngles={rotationAngles}
                    togglePageSelection={togglePageSelection}
                    selectAllPages={selectAllPages}
                    clearPageSelection={clearPageSelection}
                  />
                )}
                
                {/* PDF preview */}
                <div className={`relative ${showSelectionMode ? 'md:col-span-3' : 'md:col-span-4'}`}>
                  <PdfPreview file={file} className="h-[600px]" />
                  
                  {/* Rotation tools overlay */}
                  <RotationControls
                    isLoading={isLoading}
                    handleRotate={handleRotate}
                    handleResetRotation={handleResetRotation}
                    toggleSelectionMode={toggleSelectionMode}
                    showSelectionMode={showSelectionMode}
                    hasRotation={Object.keys(rotationAngles).length > 0}
                    currentPage={currentPage}
                    selectedPages={selectedPages}
                    rotationAngles={rotationAngles}
                    thumbnailsExist={thumbnails.length > 0}
                  />
                  
                  {/* Page info */}
                  <PageInfo
                    currentPage={currentPage}
                    totalPages={totalPages}
                    selectedPages={selectedPages}
                  />
                </div>
              </div>
              
              <SaveControls
                rotationAngles={rotationAngles}
                processingRotation={processingRotation}
                isLoading={isLoading}
                handleSaveRotations={handleSaveRotations}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RotatePDF;
