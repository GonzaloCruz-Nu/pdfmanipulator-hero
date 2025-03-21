
import { useState, useRef } from 'react';
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
  
  // Función para aplicar censura al PDF
  const applyRedactions = async () => {
    if (!file || !canvasRef.current) {
      toast.error('No hay documentos para censurar');
      return;
    }

    try {
      setIsProcessing(true);

      // Obtenemos el canvas actual con las áreas de censura
      const canvas = canvasRef.current;
      
      // Crear una imagen de la página con las censuras aplicadas
      const censoredPageDataUrl = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.95
      });
      
      // Cargar el archivo original como ArrayBuffer
      const originalPdfBytes = await file.arrayBuffer();
      
      // Cargar el PDF con pdf-lib
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      
      // Obtener la página actual
      const pages = pdfDoc.getPages();
      const pageIndex = activePage - 1;
      
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`La página ${activePage} no existe en el documento`);
      }
      
      const page = pages[pageIndex];
      
      // Extraer la parte base64 del data URL
      const imgData = censoredPageDataUrl.split(',')[1];
      const imgBytes = Uint8Array.from(atob(imgData), c => c.charCodeAt(0));
      
      // Incorporar la imagen censurada en el documento
      const img = await pdfDoc.embedJpg(imgBytes);
      
      // Obtener dimensiones de la página
      const { width, height } = page.getSize();
      
      // Sobrescribir la página original con la imagen censurada
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      
      // Serializar el PDF modificado
      const pdfBytes = await pdfDoc.save();
      
      // Crear Blob con los bytes del PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Guardar el PDF censurado
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

  return {
    isProcessing,
    censoredFile,
    activePage,
    setActivePage,
    canvasRef,
    applyRedactions,
    downloadCensoredPDF,
    resetCensor
  };
};
