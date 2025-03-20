
import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';

interface UnlockResult {
  success: boolean;
  unlockedFile: File | null;
  message: string;
}

export const useUnlockPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [unlockedFile, setUnlockedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Attempt to unlock a password-protected PDF
   */
  const unlockPDF = async (file: File | null, password: string): Promise<UnlockResult> => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return { success: false, unlockedFile: null, message: 'No se ha seleccionado archivo' };
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setErrorMessage(null);
      setUnlockedFile(null);

      // Leer archivo
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);

      setProgress(30);

      // Intentar cargar el PDF con la contraseña
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(fileBytes, { 
          password,
          updateMetadata: false // Preservar metadatos originales
        });
        setProgress(60);
      } catch (error) {
        console.error('Error al cargar el PDF con contraseña:', error);
        setErrorMessage('Contraseña incorrecta o archivo PDF no encriptado');
        toast.error('Contraseña incorrecta o archivo PDF no está encriptado');
        return { 
          success: false, 
          unlockedFile: null, 
          message: 'Contraseña incorrecta o archivo PDF no está encriptado' 
        };
      }

      // Crear una nueva copia del PDF sin protección
      const unlockedPdfBytes = await pdfDoc.save({
        useObjectStreams: true
      });
      
      setProgress(90);

      // Crear un nuevo archivo
      const unlockedFile = new File(
        [unlockedPdfBytes],
        `desbloqueado_${file.name}`,
        { type: 'application/pdf' }
      );

      setUnlockedFile(unlockedFile);
      setProgress(100);
      toast.success('PDF desbloqueado correctamente');

      return { 
        success: true, 
        unlockedFile, 
        message: 'PDF desbloqueado correctamente' 
      };

    } catch (error) {
      console.error('Error al desbloquear el PDF:', error);
      setErrorMessage('Error al procesar el PDF. Verifica que el archivo sea válido.');
      toast.error('Error al desbloquear el PDF');
      
      return { 
        success: false, 
        unlockedFile: null, 
        message: 'Error al procesar el PDF. Verifica que el archivo sea válido.' 
      };
    } finally {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  /**
   * Descargar el PDF desbloqueado
   */
  const downloadUnlockedFile = () => {
    if (!unlockedFile) return;
    
    const url = URL.createObjectURL(unlockedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = unlockedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF desbloqueado descargado con éxito');
  };

  return {
    unlockPDF,
    isProcessing,
    progress,
    unlockedFile,
    errorMessage,
    downloadUnlockedFile
  };
};
