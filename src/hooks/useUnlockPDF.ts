
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
  const unlockPDF = async (file: File | null, password?: string): Promise<UnlockResult> => {
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

      // Intentar cargar el PDF con o sin contraseña
      let pdfDoc;
      try {
        // Primera tentativa: cargar sin contraseña
        pdfDoc = await PDFDocument.load(fileBytes, { 
          updateMetadata: false
        });
        setProgress(50);
      } catch (initialError) {
        console.log('PDF probablemente protegido, intentando con contraseña...');
        
        // Si no se proporciona contraseña, intentamos métodos alternativos
        if (!password) {
          // Método alternativo: intentar crear un nuevo documento y copiar páginas
          try {
            const newPdfDoc = await PDFDocument.create();
            const sourcePdf = await PDFDocument.load(fileBytes, { 
              ignoreEncryption: true 
            });
            
            const pageCount = sourcePdf.getPageCount();
            if (pageCount === 0) {
              throw new Error('No se pudieron extraer páginas del PDF protegido');
            }
            
            // Copiar todas las páginas al nuevo documento
            const pages = await newPdfDoc.copyPages(sourcePdf, sourcePdf.getPageIndices());
            pages.forEach(page => newPdfDoc.addPage(page));
            
            pdfDoc = newPdfDoc;
            setProgress(50);
          } catch (alternativeError) {
            console.error('Error con método alternativo:', alternativeError);
            
            if (password === undefined) {
              setErrorMessage('Este PDF está protegido. Por favor, introduce una contraseña');
              toast.error('Este PDF requiere una contraseña');
              return { 
                success: false, 
                unlockedFile: null, 
                message: 'Este PDF requiere una contraseña' 
              };
            } else {
              throw new Error('No se pudo desbloquear el PDF con los métodos disponibles');
            }
          }
        } else {
          // Intentar con la contraseña proporcionada
          try {
            pdfDoc = await PDFDocument.load(fileBytes, { 
              password,
              updateMetadata: false
            });
            setProgress(50);
          } catch (passwordError) {
            console.error('Error al intentar con contraseña:', passwordError);
            setErrorMessage('Contraseña incorrecta');
            toast.error('Contraseña incorrecta');
            return { 
              success: false, 
              unlockedFile: null, 
              message: 'Contraseña incorrecta' 
            };
          }
        }
      }

      setProgress(70);

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
