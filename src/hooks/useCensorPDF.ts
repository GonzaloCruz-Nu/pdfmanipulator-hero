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
    if (!file) {
      toast.error('No hay documentos para censurar');
      return;
    }

    console.log("Canvas reference when applying redactions:", canvasRef.current);
    
    if (!canvasRef.current) {
      console.error("Canvas reference is null when trying to apply redactions");
      toast.error('Error al aplicar censuras: No se pudo acceder al lienzo');
      return;
    }

    try {
      setIsProcessing(true);
      toast.info('Aplicando censuras al PDF...');

      // Get the current canvas with redaction areas
      const canvas = canvasRef.current;
      
      // Log canvas objects to see if we have any censoring rectangles
      console.log("Canvas objects to apply:", canvas.getObjects().length);
      
      // Make sure all redaction objects are visible and rendered
      canvas.forEachObject(obj => {
        obj.visible = true;
      });
      
      // Ensure all objects are rendered properly before capturing
      canvas.renderAll();
      
      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
    
    try {
      const fileName = file.name.replace('.pdf', '_censurado.pdf');
      saveAs(censoredFile, fileName);
      toast.success('PDF censurado descargado');
    } catch (error) {
      console.error('Error al descargar el PDF censurado:', error);
      toast.error('Error al descargar el PDF censurado');
    }
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

  // Update canvas reference
  const setCanvasReference = useCallback((canvas: fabric.Canvas | null) => {
    console.log("Setting canvas reference in useCensorPDF", canvas ? "canvas provided" : "null canvas");
    canvasRef.current = canvas;
  }, []);

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
      
      // Clear any objects from the canvas
      canvasRef.current.clear();
      
      // Null out the reference
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
    setCanvasReference,
    applyRedactions,
    downloadCensoredPDF,
    resetCensor,
    cleanupCanvas
  };
};
