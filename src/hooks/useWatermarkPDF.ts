
import { useState } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { toast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';

interface WatermarkOptions {
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  angle: number;
}

// Helper to convert hex color to RGB values
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0.5, g: 0.5, b: 0.5 }; // Default gray if invalid hex
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  };
};

export const useWatermarkPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watermarkedFile, setWatermarkedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setWatermarkedFile(null);
    setErrorMessage(null);
    setProgress(0);
  };

  const applyWatermark = async (file: File, options: WatermarkOptions) => {
    try {
      setIsProcessing(true);
      resetState();
      setProgress(10);

      // Check if we have text for the watermark
      if (!options.text) {
        throw new Error('Debes proporcionar un texto para la marca de agua');
      }

      // Read the file as an ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      setProgress(30);

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(fileBuffer);
      setProgress(50);

      // Get pages
      const pages = pdfDoc.getPages();
      const { r, g, b } = hexToRgb(options.color);
      
      // Embed the font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Apply watermark to each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Draw the watermark
        page.drawText(options.text, {
          x: width / 2,
          y: height / 2,
          font,
          size: options.fontSize,
          color: rgb(r, g, b),
          opacity: options.opacity,
          rotate: degrees(options.angle),
          xSkew: degrees(0),
          ySkew: degrees(0),
        });
        
        setProgress(50 + Math.floor((i / pages.length) * 40));
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      setProgress(90);

      // Create a new File object
      const watermarkedPdfFile = new File(
        [pdfBytes], 
        `${file.name.replace(/\.pdf$/i, '')}_watermark.pdf`, 
        { type: 'application/pdf' }
      );
      
      setWatermarkedFile(watermarkedPdfFile);
      setProgress(100);
      
      toast({
        title: "PDF procesado con éxito",
        description: "Tu documento ha sido procesado con la marca de agua",
      });

      return { success: true, file: watermarkedPdfFile };
    } catch (error) {
      console.error('Error al procesar el PDF:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al procesar el PDF';
      setErrorMessage(errorMsg);
      
      toast({
        variant: "destructive",
        title: "Error al procesar el PDF",
        description: errorMsg,
      });
      
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadWatermarkedFile = () => {
    if (watermarkedFile) {
      saveAs(watermarkedFile, watermarkedFile.name);
      
      toast({
        title: "Descarga iniciada",
        description: "Tu PDF con marca de agua se está descargando",
      });
    }
  };

  return {
    applyWatermark,
    isProcessing,
    progress,
    watermarkedFile,
    errorMessage,
    downloadWatermarkedFile,
    resetState
  };
};
