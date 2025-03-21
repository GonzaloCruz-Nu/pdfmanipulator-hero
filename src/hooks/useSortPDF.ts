
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';

// Ensure PDF.js worker is configured
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface UseSortPDFReturn {
  file: File | null;
  setFile: (file: File | null) => void;
  isProcessing: boolean;
  sortedFile: File | null;
  progress: number;
  error: string | null;
  pageOrder: number[];
  setPageOrder: (order: number[]) => void;
  totalPages: number;
  thumbnails: string[];
  isGeneratingThumbnails: boolean;
  sortPages: () => Promise<void>;
  movePageUp: (index: number) => void;
  movePageDown: (index: number) => void;
  resetPageOrder: () => void;
}

const useSortPDF = (): UseSortPDFReturn => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortedFile, setSortedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);

  useEffect(() => {
    if (!file) {
      // Reset state when file is removed
      setSortedFile(null);
      setPageOrder([]);
      setThumbnails([]);
      setTotalPages(0);
      setError(null);
      return;
    }

    // Initialize page order and generate thumbnails
    const loadPdf = async () => {
      try {
        setError(null);
        setIsGeneratingThumbnails(true);
        setThumbnails([]);

        // Load the PDF document
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        // Set total pages
        const pageCount = pdf.numPages;
        setTotalPages(pageCount);
        
        // Initialize page order
        const initialOrder = Array.from({ length: pageCount }, (_, i) => i + 1);
        setPageOrder(initialOrder);

        // Generate thumbnails
        const newThumbnails: string[] = [];
        
        for (let i = 1; i <= pageCount; i++) {
          // Get the page
          const page = await pdf.getPage(i);
          const scale = 0.2; // Small scale for thumbnails
          
          // Apply rotation to viewport
          const viewport = page.getViewport({ scale });

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
          
          // Add thumbnail to array
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.5);
          newThumbnails.push(thumbnailUrl);
          
          // Update progress
          setProgress(Math.round((i / pageCount) * 100));
        }
        
        setThumbnails(newThumbnails);
        
        // Cleanup
        URL.revokeObjectURL(fileUrl);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setError('Error al cargar el PDF. El archivo puede estar dañado o no ser accesible.');
      } finally {
        setIsGeneratingThumbnails(false);
      }
    };

    loadPdf();
  }, [file]);

  const sortPages = async () => {
    if (!file || pageOrder.length === 0) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      
      // Load the original PDF
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const newPdfDoc = await PDFDocument.create();
      
      // Copy pages in the specified order
      for (let i = 0; i < pageOrder.length; i++) {
        // pageOrder contains page numbers (starting at 1), but PDF-lib uses zero-based indexing
        const pageIndex = pageOrder[i] - 1;
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
        newPdfDoc.addPage(copiedPage);
        
        // Update progress
        setProgress(Math.round((i / pageOrder.length) * 100));
      }
      
      // Save the reordered PDF
      const modifiedPdfBytes = await newPdfDoc.save();
      const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const modifiedPdfFile = new File([modifiedPdfBlob], `reordered_${file.name}`, { type: 'application/pdf' });
      
      setSortedFile(modifiedPdfFile);
      toast.success('PDF reordenado correctamente');
    } catch (error) {
      console.error('Error sorting PDF:', error);
      setError('Error al ordenar el PDF. Por favor, inténtalo de nuevo con otro archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const movePageUp = (index: number) => {
    if (index <= 0 || index >= pageOrder.length) return;
    
    const newOrder = [...pageOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setPageOrder(newOrder);
  };

  const movePageDown = (index: number) => {
    if (index < 0 || index >= pageOrder.length - 1) return;
    
    const newOrder = [...pageOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setPageOrder(newOrder);
  };

  const resetPageOrder = () => {
    const initialOrder = Array.from({ length: totalPages }, (_, i) => i + 1);
    setPageOrder(initialOrder);
  };

  return {
    file,
    setFile,
    isProcessing,
    sortedFile,
    progress,
    error,
    pageOrder,
    setPageOrder,
    totalPages,
    thumbnails,
    isGeneratingThumbnails,
    sortPages,
    movePageUp,
    movePageDown,
    resetPageOrder,
  };
};

export default useSortPDF;
