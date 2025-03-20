
import { useState } from 'react';
import { toast } from 'sonner';
import {
  standardCompression,
  aggressiveCompression,
  extremeCompression,
  imageQualityCompression,
  ultimateCompression,
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
      setProgress(10);

      // Get original file bytes
      const fileBuffer = await file.arrayBuffer();
      const fileSize = file.size;
      
      setProgress(15);
      
      // Array para contener todos los resultados de compresión
      const compressionResults: Array<{method: string; result: File | null; compression: {savedPercentage: number; compressedSize: number}}> = [];
      
      // 1. Primera estrategia: compresión estándar
      console.log("Intentando compresión estándar...");
      let result = await standardCompression(fileBuffer, compressionLevel, file.name);
      let compression = calculateCompression(fileSize, result?.size || fileSize);
      compressionResults.push({
        method: 'standard',
        result,
        compression
      });
      
      setProgress(30);
      
      // 2. Estrategia agresiva
      console.log("Intentando compresión agresiva...");
      result = await aggressiveCompression(fileBuffer, compressionLevel, file.name);
      compression = calculateCompression(fileSize, result?.size || fileSize);
      compressionResults.push({
        method: 'aggressive',
        result,
        compression
      });
      
      setProgress(45);
      
      // 3. Estrategia extrema
      console.log("Intentando compresión extrema...");
      result = await extremeCompression(fileBuffer, compressionLevel, file.name);
      compression = calculateCompression(fileSize, result?.size || fileSize);
      compressionResults.push({
        method: 'extreme',
        result,
        compression
      });
      
      setProgress(60);
      
      // 4. Estrategia de calidad de imagen
      console.log("Intentando compresión de calidad de imagen...");
      result = await imageQualityCompression(fileBuffer, compressionLevel, file.name);
      compression = calculateCompression(fileSize, result?.size || fileSize);
      compressionResults.push({
        method: 'imageQuality',
        result,
        compression
      });
      
      setProgress(75);
      
      // 5. Estrategia última
      console.log("Intentando compresión última...");
      result = await ultimateCompression(fileBuffer, compressionLevel, file.name);
      compression = calculateCompression(fileSize, result?.size || fileSize);
      compressionResults.push({
        method: 'ultimate',
        result,
        compression
      });
      
      setProgress(85);
      
      // Ordenar resultados por mayor porcentaje de compresión
      compressionResults.sort((a, b) => 
        b.compression.savedPercentage - a.compression.savedPercentage
      );
      
      // Seleccionar el mejor resultado (con mayor compresión)
      const bestResult = compressionResults[0];
      console.log("Mejor resultado:", bestResult.method, "con", bestResult.compression.savedPercentage.toFixed(2) + "%");
      
      setProgress(90);

      // Verificar si el mejor resultado es aceptable (más de 0.1% de compresión)
      if (!bestResult.result) {
        setCompressionError('No se pudo comprimir el PDF. Intenta con otro archivo.');
        setCompressedFile(null);
        setCompressionInfo(null);
        toast.error('Error al comprimir el PDF. Intenta con otro archivo.');
      } 
      else if (bestResult.compression.savedPercentage <= 0.1) {
        setCompressionError('No se pudo reducir significativamente el tamaño del archivo. Puede que ya esté optimizado.');
        setCompressedFile(null);
        setCompressionInfo(null);
        toast.error('No se pudo comprimir el archivo PDF.');
      } 
      else {
        // Guardamos el mejor resultado
        setCompressedFile(bestResult.result);
        setCompressionInfo({
          originalSize: fileSize,
          compressedSize: bestResult.compression.compressedSize,
          savedPercentage: bestResult.compression.savedPercentage
        });
        toast.success(`PDF comprimido con éxito. Ahorro: ${bestResult.compression.savedPercentage.toFixed(1)}%`);
      }
      
      setProgress(100);
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      setCompressionError('Error al procesar el PDF. Intenta con otro archivo.');
      toast.error('Error al comprimir el PDF. Intenta con otro archivo.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
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
