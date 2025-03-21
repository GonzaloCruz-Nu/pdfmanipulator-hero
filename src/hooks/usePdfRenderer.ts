
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
  renderPage: (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, rotation?: number) => Promise<void>;
  renderThumbnail: (pageNum: number, rotation?: number) => Promise<string | null>;
  nextPage: () => void;
  prevPage: () => void;
  reloadCurrentPage: (rotation?: number) => void;
}

export const usePdfRenderer = (file: File | null): UsePdfRendererReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRotation, setCurrentRotation] = useState<number>(0);

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
        
        // Revoke previous URL if exists
        if (pageUrl) {
          URL.revokeObjectURL(pageUrl);
        }
        
        console.log("Loading PDF file:", file.name);
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);
        setPdfDocument(pdf);
        
        // Load first page
        await renderPage(pdf, 1);
        
        console.log("PDF loaded successfully with", pdf.numPages, "pages");
      } catch (error) {
        console.error('Error loading PDF:', error);
        setError('The PDF file could not be loaded. The file may be damaged.');
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
      if (pageUrl) {
        URL.revokeObjectURL(pageUrl);
      }
    };
  }, [file]);

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, rotation = 0) => {
    try {
      console.log("Rendering page", pageNum, "with rotation", rotation);
      setIsLoading(true);
      setCurrentRotation(rotation);
      
      // Get the page
      const page = await pdf.getPage(pageNum);
      const scale = 1.5;
      
      // Apply rotation to viewport
      const viewport = page.getViewport({ scale, rotation });

      // Create a canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get 2D context from canvas');
      }

      // Set dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Set page URL and update current page
      const newPageUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPageUrl(newPageUrl);
      setCurrentPage(pageNum);
      
      console.log("Page", pageNum, "rendered successfully with rotation", rotation);
    } catch (error) {
      console.error('Error rendering page:', error);
      setError('Could not render the PDF page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Nueva función para renderizar miniaturas de páginas
  const renderThumbnail = async (pageNum: number, rotation = 0): Promise<string | null> => {
    try {
      if (!pdfDocument) return null;
      
      // Get the page
      const page = await pdfDocument.getPage(pageNum);
      const scale = 0.2; // Smaller scale for thumbnails
      
      // Apply rotation to viewport
      const viewport = page.getViewport({ scale, rotation });

      // Create a canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get 2D context from canvas');
      }

      // Set dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Return the thumbnail as data URL
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.error('Error rendering thumbnail:', error);
      return null;
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages && pdfDocument) {
      renderPage(pdfDocument, currentPage + 1, currentRotation);
    }
  };

  const prevPage = () => {
    if (currentPage > 1 && pdfDocument) {
      renderPage(pdfDocument, currentPage - 1, currentRotation);
    }
  };
  
  const reloadCurrentPage = (rotation = 0) => {
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage, rotation);
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
    renderThumbnail,
    nextPage,
    prevPage,
    reloadCurrentPage
  };
};
