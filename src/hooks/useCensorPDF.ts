
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
      // Mantener solo la imagen de fondo (PDF)
      const bgImage = canvasRef.current.backgroundImage;
      canvasRef.current.clear();
      
      if (bgImage) {
        canvasRef.current.setBackgroundImage(bgImage, canvasRef.current.renderAll.bind(canvasRef.current));
      }
      
      canvasRef.current.renderAll();
    }
    toast.info('Censuras eliminadas');
  };

  // Improved safe canvas cleanup
  const cleanupCanvas = useCallback(() => {
    try {
      if (canvasRef.current) {
        // Remove all event listeners first
        canvasRef.current.off();
        
        // Check if the canvas has a lower canvas element before disposing
        // This prevents the "Cannot read properties of undefined (reading 'removeChild')" error
        if (canvasRef.current.lowerCanvasEl && canvasRef.current.lowerCanvasEl.parentNode) {
          canvasRef.current.dispose();
        } else {
          // If the canvas element is already detached, just clean up our reference
          console.log("Canvas element already detached, skipping dispose call");
        }
        
        canvasRef.current = null;
        console.log("Canvas limpiado correctamente");
      }
    } catch (error) {
      console.error("Error al limpiar el canvas:", error);
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
