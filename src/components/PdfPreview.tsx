
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { cn } from '@/lib/utils';

// Configuración de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.8.162/pdf.worker.min.js';

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

  useEffect(() => {
    if (!file) {
      setPageUrl(null);
      return;
    }

    const loadPdf = async () => {
      const fileUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      
      try {
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);
        
        // Carga la primera página
        renderPage(pdf, 1);
      } catch (error) {
        console.error('Error al cargar el PDF:', error);
      }
    };

    loadPdf();
  }, [file]);

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
    try {
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
      
      setPageUrl(canvas.toDataURL());
      setCurrentPage(pageNum);
    } catch (error) {
      console.error('Error al renderizar la página:', error);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages && file) {
      const fileUrl = URL.createObjectURL(file);
      pdfjsLib.getDocument(fileUrl).promise.then(pdf => {
        renderPage(pdf, currentPage + 1);
      });
    }
  };

  const prevPage = () => {
    if (currentPage > 1 && file) {
      const fileUrl = URL.createObjectURL(file);
      pdfjsLib.getDocument(fileUrl).promise.then(pdf => {
        renderPage(pdf, currentPage - 1);
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!file || !pageUrl) {
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
          {pageUrl && (
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
              disabled={currentPage <= 1}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
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
