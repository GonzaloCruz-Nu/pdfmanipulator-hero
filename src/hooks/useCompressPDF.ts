
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
      
      console.log("Iniciando compresión GhostScript-like con canvas...");
      setProgress(30);
      
      // Intentar la compresión agresiva basada en canvas (GhostScript-like)
      const canvasResult = await canvasBasedCompression(fileBuffer, compressionLevel, file.name);
      
      // Si el método canvas funcionó
      if (canvasResult) {
        const canvasCompression = calculateCompression(fileSize, canvasResult.size);
        console.log("Compresión GhostScript-like completada:", canvasCompression.savedPercentage.toFixed(2) + "%");
        
        // Aceptar cualquier reducción de tamaño, sin importar cuán pequeña sea
        if (canvasCompression.savedPercentage > 0) {
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
        } else {
          console.log("La compresión GhostScript-like no redujo el tamaño, intentando método estándar...");
        }
      }
      
      // Si el canvas no funcionó, intentar con método estándar
      setProgress(60);
      console.log("Intentando compresión estándar...");
      const standardResult = await standardCompression(fileBuffer, compressionLevel, file.name);
      
      if (standardResult) {
        const standardCompression = calculateCompression(fileSize, standardResult.size);
        console.log("Compresión estándar completada:", standardCompression.savedPercentage.toFixed(2) + "%");
        
        // Aceptar cualquier reducción de tamaño
        if (standardCompression.savedPercentage > 0) {
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
      
      // Si ningún método logró comprimir el archivo
      setCompressionError('No se pudo comprimir el PDF. El archivo ya está altamente optimizado o contiene elementos que no pueden comprimirse más.');
      setCompressedFile(null);
      setCompressionInfo(null);
      toast.error('No se pudo comprimir el PDF. El archivo ya está altamente optimizado.');
      
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      setCompressionError('Error al procesar el PDF. Intenta con otro archivo o nivel de compresión.');
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
