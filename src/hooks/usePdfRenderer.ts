
import { useState, useEffect, useCallback } from 'react';
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
  renderPage: (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, rotation?: number) => Promise<string | null>;
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
  const [isChangingPage, setIsChangingPage] = useState(false);

  // Clean up previous PDF document and resources
  const cleanupPdf = useCallback(() => {
    if (pdfDocument) {
      console.log("Cleaning up PDF document");
      try {
        pdfDocument.destroy();
      } catch (error) {
        console.error("Error destroying PDF document:", error);
      }
    }
    if (pageUrl) {
      try {
        URL.revokeObjectURL(pageUrl);
      } catch (error) {
        console.error("Error revoking URL:", error);
      }
    }
  }, [pdfDocument, pageUrl]);

  // Effect to load PDF when file changes
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
        
        // Clean up previous resources
        cleanupPdf();
        
        console.log("Loading PDF file:", file.name);
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);
        setPdfDocument(pdf);
        
        // Load first page
        const pageUrlResult = await renderPage(pdf, 1);
        if (pageUrlResult) {
          setPageUrl(pageUrlResult);
          setCurrentPage(1);
        }
        
        console.log("PDF loaded successfully with", pdf.numPages, "pages");
      } catch (error) {
        console.error('Error loading PDF:', error);
        setError('The PDF file could not be loaded. The file may be damaged.');
        setPdfDocument(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
    
    // Cleanup on unmount or file change
    return cleanupPdf;
  }, [file]);

  // Enhanced renderPage function that returns the pageUrl for more flexibility
  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, rotation = 0): Promise<string | null> => {
    if (!pdf) {
      console.error("No PDF document available");
      return null;
    }
    
    try {
      console.log("Rendering page", pageNum, "with rotation", rotation);
      setIsChangingPage(true);
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
      
      // Create page URL
      const newPageUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      console.log("Page", pageNum, "rendered successfully with rotation", rotation);
      return newPageUrl;
    } catch (error) {
      console.error('Error rendering page:', error);
      setError('Could not render the PDF page.');
      return null;
    } finally {
      // Small delay to ensure UI updates properly
      setTimeout(() => {
        setIsLoading(false);
        setIsChangingPage(false);
      }, 150);
    }
  };

  // Render thumbnail of pages
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

  const nextPage = async () => {
    if (isLoading || isChangingPage) {
      console.log("Page change in progress, ignoring request");
      return;
    }
    
    if (currentPage < totalPages && pdfDocument) {
      const nextPageNum = currentPage + 1;
      
      try {
        const newPageUrl = await renderPage(pdfDocument, nextPageNum, currentRotation);
        if (newPageUrl) {
          // Small timeout to ensure state updates happen in the right order
          setTimeout(() => {
            setPageUrl(newPageUrl);
            setCurrentPage(nextPageNum);
            console.log(`Page changed to ${nextPageNum}`);
          }, 50);
        }
      } catch (error) {
        console.error("Error changing to next page:", error);
        setIsLoading(false);
        setIsChangingPage(false);
      }
    }
  };

  const prevPage = async () => {
    if (isLoading || isChangingPage) {
      console.log("Page change in progress, ignoring request");
      return;
    }
    
    if (currentPage > 1 && pdfDocument) {
      const prevPageNum = currentPage - 1;
      
      try {
        const newPageUrl = await renderPage(pdfDocument, prevPageNum, currentRotation);
        if (newPageUrl) {
          // Small timeout to ensure state updates happen in the right order
          setTimeout(() => {
            setPageUrl(newPageUrl);
            setCurrentPage(prevPageNum);
            console.log(`Page changed to ${prevPageNum}`);
          }, 50);
        }
      } catch (error) {
        console.error("Error changing to previous page:", error);
        setIsLoading(false);
        setIsChangingPage(false);
      }
    }
  };
  
  const reloadCurrentPage = async (rotation = currentRotation) => {
    if (isLoading || isChangingPage) {
      console.log("Page reload in progress, ignoring request");
      return;
    }
    
    if (pdfDocument) {
      try {
        const newPageUrl = await renderPage(pdfDocument, currentPage, rotation);
        if (newPageUrl) {
          setTimeout(() => {
            setPageUrl(newPageUrl);
          }, 50);
        }
      } catch (error) {
        console.error("Error reloading current page:", error);
        setIsLoading(false);
        setIsChangingPage(false);
      }
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
