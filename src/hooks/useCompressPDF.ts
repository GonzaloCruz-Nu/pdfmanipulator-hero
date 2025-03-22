
import { useState } from 'react';
import { toast } from 'sonner';
import { COMPRESSION_FACTORS, MIN_SIZE_REDUCTION } from '@/utils/pdf/compression-constants';
import { calculateCompression } from '@/utils/pdf/compression-utils';
import { compressPDFWithCanvas, CompressionLevel } from '@/utils/pdf/compression-processor';

interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

export const useCompressPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);

  // Función principal para comprimir un PDF
  const compressPDF = async (file: File | null, compressionLevel: CompressionLevel) => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return;
    }

    try {
      // Inicializar estado
      setIsProcessing(true);
      setCompressionError(null);
      setCompressedFile(null);
      setCompressionInfo(null);
      setProgress(5);
      
      // Obtener tamaño original
      const fileSize = file.size;
      
      // Comprimir usando el método basado en canvas con seguimiento de progreso
      const compressedFile = await compressPDFWithCanvas(file, compressionLevel, setProgress);
      
      // Asegurar que progreso llega a 100 siempre
      setProgress(100);
      
      if (compressedFile) {
        const compressionResult = calculateCompression(fileSize, compressedFile.size);
        
        // Para nivel bajo, aceptamos el resultado incluso si el tamaño no se reduce significativamente
        // o incluso si aumenta ligeramente, para evitar errores de usuario
        if (compressionLevel === 'low' || compressionResult.savedPercentage > 0) {
          setCompressedFile(compressedFile);
          setCompressionInfo(compressionResult);
          
          // Mensaje personalizado según resultado
          if (compressionResult.savedPercentage <= 0) {
            toast.info('PDF procesado sin reducción de tamaño significativa.');
          } else {
            toast.success(`PDF comprimido con éxito. Ahorro: ${compressionResult.savedPercentage.toFixed(1)}%`);
          }
        } else {
          setCompressionError('No se pudo comprimir significativamente el PDF. Es posible que ya esté optimizado.');
          toast.error('No se pudo comprimir significativamente el PDF.');
        }
      } else {
        setCompressionError('Error al comprimir el PDF. Intenta con otro archivo o nivel de compresión.');
        toast.error('Error al comprimir el PDF.');
      }
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      setCompressionError('Error al procesar el PDF. Intenta con otro archivo o nivel de compresión.');
      toast.error('Error al comprimir el PDF.');
    } finally {
      // Asegurar que se completa el progreso incluso en caso de error
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  // Función para descargar el archivo comprimido
  const downloadCompressedFile = () => {
    if (!compressedFile) return;
    
    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF descargado con éxito');
  };

  return {
    compressPDF,
    isProcessing,
    progress,
    compressionInfo,
    compressionError,
    compressedFile,
    downloadCompressedFile
  };
};
