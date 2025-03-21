
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
      
      // Create an image of the page with applied redactions
      const censoredPageDataUrl = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.95
      });
      
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
    if (!censoredFile || !file) return;
    
    const fileName = file.name.replace('.pdf', '_censurado.pdf');
    saveAs(censoredFile, fileName);
    toast.success('PDF censurado descargado');
  };
  
  const resetCensor = () => {
    setCensoredFile(null);
    if (canvasRef.current) {
      try {
        // Maintain only the background image (PDF)
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

  // Improved safe canvas cleanup with proper error handling
  const cleanupCanvas = useCallback(() => {
    try {
      if (canvasRef.current) {
        console.log("Iniciando limpieza del canvas...");
        
        // First, safely remove all event listeners
        try {
          canvasRef.current.off();
        } catch (error) {
          console.error("Error al remover eventos del canvas:", error);
        }
        
        // Then try to dispose the canvas if it's still in the DOM
        try {
          if (canvasRef.current.lowerCanvasEl) {
            const canvasElement = canvasRef.current.lowerCanvasEl;
            // Safer check for DOM attachment
            if (document.body.contains(canvasElement) || canvasElement.parentNode) {
              console.log("Canvas está en el DOM, disponiéndolo correctamente");
              canvasRef.current.dispose();
            } else {
              console.log("Canvas ya no está en el DOM, omitiendo dispose");
            }
          }
        } catch (error) {
          console.error("Error durante el dispose del canvas:", error);
        }
        
        // Always clear the reference
        canvasRef.current = null;
        console.log("Canvas limpiado correctamente");
      }
    } catch (error) {
      console.error("Error al limpiar el canvas:", error);
      // Ensure reference is cleared even if there's an error
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
