
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker is configured
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface UsePdfRendererReturn {
  currentPage: number;
  totalPages: number;
  pageUrl: string | null;
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  isLoading: boolean;
  error: string | null;
  renderPage: (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
}

export const usePdfRenderer = (file: File | null): UsePdfRendererReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
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

  return {
    currentPage,
    totalPages,
    pageUrl,
    pdfDocument,
    isLoading,
    error,
    renderPage,
    nextPage,
    prevPage
  };
};
