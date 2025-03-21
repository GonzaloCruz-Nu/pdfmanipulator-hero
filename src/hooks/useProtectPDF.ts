
import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { toast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';

interface ProtectionOptions {
  userPassword?: string;
  ownerPassword?: string;
  canPrint?: boolean;
  canCopy?: boolean;
  canModify?: boolean;
}

export const useProtectPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [protectedFile, setProtectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setProtectedFile(null);
    setErrorMessage(null);
    setProgress(0);
  };

  const protectPDF = async (file: File, options: ProtectionOptions) => {
    try {
      setIsProcessing(true);
      resetState();
      setProgress(10);

      // Check if we have at least one password
      if (!options.userPassword && !options.ownerPassword) {
        throw new Error('Debes proporcionar al menos una contraseña');
      }

      // Read the file as an ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      setProgress(30);

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(fileBuffer);
      setProgress(50);

      // NOTA: Temporalmente eliminada la funcionalidad de encriptación
      // hasta resolver el problema con la API de pdf-lib
      
      setProgress(70);

      // Save the PDF without encryption for now
      const pdfBytes = await pdfDoc.save();
      setProgress(90);

      // Create a new File object
      const processedPdfFile = new File(
        [pdfBytes], 
        `${file.name.replace(/\.pdf$/i, '')}_procesado.pdf`, 
        { type: 'application/pdf' }
      );
      
      setProtectedFile(processedPdfFile);
      setProgress(100);
      
      toast({
        title: "PDF procesado con éxito",
        description: "Tu documento ha sido procesado (nota: sin protección por el momento)",
      });

      return { success: true, file: processedPdfFile };
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

  const downloadProtectedFile = () => {
    if (protectedFile) {
      saveAs(protectedFile, protectedFile.name);
      
      toast({
        title: "Descarga iniciada",
        description: "Tu PDF procesado se está descargando",
      });
    }
  };

  return {
    protectPDF,
    isProcessing,
    progress,
    protectedFile,
    errorMessage,
    downloadProtectedFile,
    resetState
  };
};
