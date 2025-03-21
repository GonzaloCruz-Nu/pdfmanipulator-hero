
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

      // Set the permissions based on options
      const permissions = {
        printing: options.canPrint ? 'highResolution' : 'none',
        modifying: options.canModify,
        copying: options.canCopy,
        annotating: options.canModify, // Usually linked with modifying
        fillingForms: options.canModify, // Usually linked with modifying
        contentAccessibility: true, // Usually keep this enabled for accessibility
        documentAssembly: options.canModify // Usually linked with modifying
      };
      
      // Encrypt the document with the provided passwords and permissions
      pdfDoc.encrypt({
        userPassword: options.userPassword,
        ownerPassword: options.ownerPassword || options.userPassword, // Use user password as owner if not provided
        permissions,
      });
      
      setProgress(70);

      // Save the encrypted PDF
      const pdfBytes = await pdfDoc.save();
      setProgress(90);

      // Create a new File object from the encrypted PDF
      const protectedPdfFile = new File(
        [pdfBytes], 
        `${file.name.replace(/\.pdf$/i, '')}_protegido.pdf`, 
        { type: 'application/pdf' }
      );
      
      setProtectedFile(protectedPdfFile);
      setProgress(100);
      
      toast({
        title: "PDF protegido con éxito",
        description: "Tu documento ha sido protegido con contraseña",
      });

      return { success: true, file: protectedPdfFile };
    } catch (error) {
      console.error('Error al proteger el PDF:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al proteger el PDF';
      setErrorMessage(errorMsg);
      
      toast({
        variant: "destructive",
        title: "Error al proteger el PDF",
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
        description: "Tu PDF protegido se está descargando",
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
