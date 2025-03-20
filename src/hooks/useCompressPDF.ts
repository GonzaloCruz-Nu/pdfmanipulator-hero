
import { useState } from 'react';
import { toast } from 'sonner';
import {
  standardCompression,
  canvasBasedCompression,
  calculateCompression,
  MIN_SIZE_REDUCTION
} from '@/utils/pdf/compression';

// Tipos de nivel de compresión
type CompressionLevel = 'low' | 'medium' | 'high';

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

  const compressPDF = async (file: File | null, compressionLevel: CompressionLevel) => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return;
    }

    try {
      setIsProcessing(true);
      setCompressionError(null);
      setCompressedFile(null);
      setCompressionInfo(null);
      setProgress(5);

      // Obtener bytes del archivo original
      const fileBuffer = await file.arrayBuffer();
      const fileSize = file.size;
      
      setProgress(10);
      
      // Intentar primero con la compresión basada en canvas (mejor resultado)
      console.log("Intentando compresión basada en canvas (método principal)...");
      setProgress(30);
      const canvasResult = await canvasBasedCompression(fileBuffer, compressionLevel, file.name);
      
      // Si el canvas funcionó, usar ese resultado
      if (canvasResult) {
        const canvasCompression = calculateCompression(fileSize, canvasResult.size);
        console.log("Compresión canvas completada:", canvasCompression.savedPercentage.toFixed(2) + "%");
        
        // Si la compresión basada en canvas fue efectiva
        if (canvasCompression.savedPercentage > 1) { // Reducido a 1% para ser más permisivo
          setProgress(90);
          setCompressedFile(canvasResult);
          setCompressionInfo({
            originalSize: fileSize,
            compressedSize: canvasResult.size,
            savedPercentage: canvasCompression.savedPercentage
          });
          toast.success(`PDF comprimido con éxito. Ahorro: ${canvasCompression.savedPercentage.toFixed(1)}%`);
          setProgress(100);
          setTimeout(() => setProgress(0), 500);
          setIsProcessing(false);
          return canvasResult;
        }
      }
      
      // Si el canvas no funcionó bien, intentar con compresión estándar
      console.log("Intentando compresión estándar...");
      setProgress(60);
      const standardResult = await standardCompression(fileBuffer, compressionLevel, file.name);
      
      if (standardResult) {
        const standardCompression = calculateCompression(fileSize, standardResult.size);
        console.log("Compresión estándar completada:", standardCompression.savedPercentage.toFixed(2) + "%");
        
        // Si compresión estándar fue efectiva
        if (standardCompression.savedPercentage > 0.1) { // Reducido a 0.1% para ser más permisivo
          setProgress(90);
          setCompressedFile(standardResult);
          setCompressionInfo({
            originalSize: fileSize,
            compressedSize: standardResult.size,
            savedPercentage: standardCompression.savedPercentage
          });
          toast.success(`PDF comprimido con éxito. Ahorro: ${standardCompression.savedPercentage.toFixed(1)}%`);
          setProgress(100);
          setTimeout(() => setProgress(0), 500);
          setIsProcessing(false);
          return standardResult;
        }
      }
      
      // Si llegamos aquí, ningún método logró una compresión suficiente
      setCompressionError('No se pudo comprimir significativamente el PDF. Es posible que ya esté optimizado.');
      setCompressedFile(null);
      setCompressionInfo(null);
      toast.error('No se pudo comprimir significativamente el PDF. Es posible que ya esté optimizado.');
      
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      setCompressionError('Error al procesar el PDF. Intenta con otro archivo.');
      toast.error('Error al comprimir el PDF. Intenta con otro archivo.');
    } finally {
      setIsProcessing(false);
    }

    return compressedFile;
  };

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
