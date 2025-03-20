
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface PdfViewerContentProps {
  pageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  fileName: string;
  currentPage: number;
}

const PdfViewerContent: React.FC<PdfViewerContentProps> = ({
  pageUrl,
  isLoading,
  error,
  fileName,
  currentPage,
}) => {
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
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (pageUrl) {
    return (
      <div className="w-full h-full flex justify-center items-center overflow-hidden">
        <img
          src={pageUrl}
          alt={`Página ${currentPage} de ${fileName}`}
          className="max-w-full max-h-full object-contain"
          style={{ 
            maxHeight: 'calc(100% - 20px)',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '4px'
          }}
        />
      </div>
    );
  }

  return null;
};

export default PdfViewerContent;
