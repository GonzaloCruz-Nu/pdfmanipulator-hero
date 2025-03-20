
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import PdfViewerContent from './pdf/PdfViewerContent';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface PdfPreviewProps {
  file: File | null;
  onClose?: () => void;
  className?: string;
  showEditor?: boolean;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ 
  file, 
  onClose, 
  className,
  showEditor = false 
}) => {
  const {
    currentPage,
    totalPages,
    pageUrl,
    isLoading,
    error,
    nextPage,
    prevPage
  } = usePdfRenderer(file);
  
  // Add state to store modified page data URL
  const [modifiedPageDataUrl, setModifiedPageDataUrl] = useState<string | null>(null);

  // Handler for saving changes
  const handleSaveChanges = (dataUrl: string) => {
    setModifiedPageDataUrl(dataUrl);
    toast.success('Cambios guardados correctamente');
  };

  if (!file) {
    return null;
  }

  // Create a simplified preview component for non-editor views
  const renderSimplePreview = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando PDF...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4 text-red-500 h-full flex flex-col items-center justify-center">
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center relative">
          {pageUrl && (
            <img
              src={pageUrl}
              alt={`Página ${currentPage} de ${totalPages}`}
              className="max-h-full max-w-full object-contain"
            />
          )}
          
          {/* Simple navigation controls */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <button 
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="bg-white bg-opacity-70 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="bg-white bg-opacity-70 px-3 py-1 rounded text-sm">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              className="bg-white bg-opacity-70 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("relative bg-white rounded-xl shadow-lg h-[500px]", className)}>
      <div className="absolute top-3 right-3 z-10">
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 p-2 hover:bg-white text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative h-full">
        {showEditor ? (
          <PdfViewerContent
            pageUrl={pageUrl}
            isLoading={isLoading}
            error={error}
            fileName={file.name}
            currentPage={currentPage}
            totalPages={totalPages}
            onNextPage={nextPage}
            onPrevPage={prevPage}
            onSaveChanges={handleSaveChanges}
          />
        ) : (
          renderSimplePreview()
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
