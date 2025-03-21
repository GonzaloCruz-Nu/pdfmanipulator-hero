
import { useState, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface UseCensorPDFProps {
  file: File | null;
}

export const useCensorPDF = ({ file }: UseCensorPDFProps = { file: null }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [censoredFile, setCensoredFile] = useState<Blob | null>(null);
  const [activePage, setActivePage] = useState(1);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  
  // Function to apply redactions to the PDF
  const applyRedactions = async () => {
    if (!file || !canvasRef.current) {
      toast.error('No hay documentos para censurar');
      return;
    }

    try {
      setIsProcessing(true);
      toast.info('Aplicando censuras al PDF...');

      // Get the current canvas with redaction areas
      const canvas = canvasRef.current;
      
      // Ensure all objects are rendered properly before capturing
      canvas.renderAll();
      
      // Create an image of the page with applied redactions
      const censoredPageDataUrl = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.95
      });
      
      // Log for debugging
      console.log(`Generated censored page image for page ${activePage}`);
      
      // Load the original file as ArrayBuffer
      const originalPdfBytes = await file.arrayBuffer();
      
      // Load the PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      
      // Get the current page
      const pages = pdfDoc.getPages();
      const pageIndex = activePage - 1;
      
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`La página ${activePage} no existe en el documento`);
      }
      
      const page = pages[pageIndex];
      
      // Extract the base64 part from the data URL
      const imgData = censoredPageDataUrl.split(',')[1];
      const imgBytes = Uint8Array.from(atob(imgData), c => c.charCodeAt(0));
      
      // Embed the censored image in the document
      const img = await pdfDoc.embedJpg(imgBytes);
      
      // Get page dimensions
      const { width, height } = page.getSize();
      
      // Overwrite the original page with the censored image
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      
      console.log(`Successfully applied censor to page ${activePage}`);
      
      // Serialize the modified PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create Blob with the PDF bytes
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Save the censored PDF
      setCensoredFile(blob);
      
      toast.success('PDF censurado correctamente');
    } catch (error) {
      console.error('Error al censurar el PDF:', error);
      toast.error('Error al censurar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  const downloadCensoredPDF = () => {
    if (!censoredFile || !file) {
      toast.error('No hay PDF censurado para descargar');
      return;
    }
    
    const fileName = file.name.replace('.pdf', '_censurado.pdf');
    saveAs(censoredFile, fileName);
    toast.success('PDF censurado descargado');
  };
  
  const resetCensor = () => {
    setCensoredFile(null);
    if (canvasRef.current) {
      try {
        // Keep only the background image (PDF)
        const bgImage = canvasRef.current.backgroundImage;
        canvasRef.current.clear();
        
        if (bgImage) {
          canvasRef.current.setBackgroundImage(bgImage, canvasRef.current.renderAll.bind(canvasRef.current));
        }
        
        canvasRef.current.renderAll();
        toast.info('Censuras eliminadas');
      } catch (error) {
        console.error('Error al resetear censuras:', error);
      }
    }
  };

  // Safe canvas cleanup with proper error handling
  const cleanupCanvas = useCallback(() => {
    console.log("Executing canvas cleanup in useCensorPDF hook");
    
    if (!canvasRef.current) {
      console.log("No canvas to clean up");
      return;
    }
    
    try {
      console.log("Starting canvas cleanup process");
      
      // First remove all event listeners
      canvasRef.current.off();
      
      // Check if canvas is in the DOM before disposing
      if (canvasRef.current.lowerCanvasEl && canvasRef.current.lowerCanvasEl.parentNode) {
        const canvasElement = canvasRef.current.lowerCanvasEl;
        console.log("Canvas is in DOM, proceeding with disposal");
        
        try {
          // We need to be extremely careful about the disposal process
          canvasRef.current.dispose();
          console.log("Canvas disposed successfully");
        } catch (error) {
          console.error("Error disposing canvas:", error);
          // Try to manually remove it from DOM if dispose fails
          try {
            if (canvasElement.parentNode) {
              canvasElement.parentNode.removeChild(canvasElement);
              console.log("Canvas element manually removed from DOM");
            }
          } catch (removeError) {
            console.error("Error manually removing canvas from DOM:", removeError);
          }
        }
      } else {
        console.log("Canvas element not found in DOM or already detached, skipping disposal");
      }
      
      // Always null the reference
      canvasRef.current = null;
      console.log("Canvas reference cleared");
    } catch (error) {
      console.error("Error during canvas cleanup:", error);
      // Still null the reference even if errors occur
      canvasRef.current = null;
    }
  }, []);

  return {
    isProcessing,
    censoredFile,
    activePage,
    setActivePage,
    canvasRef,
    applyRedactions,
    downloadCensoredPDF,
    resetCensor,
    cleanupCanvas
  };
};
