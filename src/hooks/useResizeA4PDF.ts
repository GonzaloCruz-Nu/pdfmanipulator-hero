
import { useState } from 'react';
import { toast } from 'sonner';
import { resizePdfToA4Format } from '@/utils/pdf/resizePdf';

export const useResizeA4PDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resizedFile, setResizedFile] = useState<File | null>(null);
  const [resizeError, setResizeError] = useState<string | null>(null);

  const resizePdfToA4 = async (file: File) => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return;
    }

    try {
      // Reset state
      setIsProcessing(true);
      setResizeError(null);
      setResizedFile(null);
      setProgress(5);

      // Process the PDF
      const result = await resizePdfToA4Format(file, (progressValue) => {
        setProgress(progressValue);
      });

      // Set progress to 100% when done
      setProgress(100);

      if (result) {
        setResizedFile(result);
        toast.success('PDF ajustado a tamaño A4 correctamente');
      } else {
        setResizeError('No se pudo ajustar el PDF. Intenta con otro archivo.');
        toast.error('Error al ajustar el PDF.');
      }
    } catch (error) {
      console.error('Error al ajustar PDF a A4:', error);
      setResizeError(`Error al procesar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      toast.error('Error al ajustar el PDF.');
    } finally {
      // Ensure progress completes even if there's an error
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  const downloadResizedFile = () => {
    if (!resizedFile) return;
    
    const url = URL.createObjectURL(resizedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = resizedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF ajustado descargado con éxito');
  };

  return {
    resizePdfToA4,
    isProcessing,
    progress,
    resizedFile,
    resizeError,
    downloadResizedFile
  };
};
