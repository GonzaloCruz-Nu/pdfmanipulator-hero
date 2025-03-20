
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { cn } from '@/lib/utils';

// Configuración de PDF.js - Aseguramos que el worker coincida con la versión de la API
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfPreviewProps {
  file: File | null;
  onClose?: () => void;
  className?: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ file, onClose, className }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPageUrl(null);
      setPdfDocument(null);
      return;
    }

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Revocar URL anterior si existe
        if (pageUrl) {
          URL.revokeObjectURL(pageUrl);
        }
        
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);
        setPdfDocument(pdf);
        
        // Carga la primera página
        renderPage(pdf, 1);
      } catch (error) {
        console.error('Error al cargar el PDF:', error);
        setError('No se pudo cargar el PDF. El archivo podría estar dañado.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
    
    // Cleanup on unmount
    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [file]);

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
    try {
      setIsLoading(true);
      
      const page = await pdf.getPage(pageNum);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('No se pudo obtener el contexto 2D del canvas');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Use high quality JPEG for better compression while maintaining readability
      setPageUrl(canvas.toDataURL('image/jpeg', 0.9));
      setCurrentPage(pageNum);
    } catch (error) {
      console.error('Error al renderizar la página:', error);
      setError('No se pudo renderizar la página del PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages && pdfDocument) {
      renderPage(pdfDocument, currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1 && pdfDocument) {
      renderPage(pdfDocument, currentPage - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!file) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl shadow-glass-lg transition-all duration-300",
        isFullscreen ? "fixed inset-4 z-50" : "h-[400px]",
        className
      )}
    >
      <div className="absolute top-3 right-3 flex space-x-2 z-10">
        <button
          onClick={toggleFullscreen}
          className="rounded-full p-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando PDF...</p>
            </div>
          )}
          
          {error && !isLoading && (
            <div className="text-center p-4 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          )}
          
          {pageUrl && !isLoading && !error && (
            <img
              src={pageUrl}
              alt={`Página ${currentPage} de ${file.name}`}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        <div className="p-3 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {file.name} - Página {currentPage} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || isLoading}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages || isLoading}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
