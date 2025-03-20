
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

      // Primera estrategia: compresión estándar
      setProgress(15);
      console.log("Intentando compresión estándar...");
      let result = await standardCompression(fileBuffer, compressionLevel, file.name);
      let compression = calculateCompression(fileSize, result?.size || fileSize);
      
      // Si no logramos buena compresión, probamos otra estrategia
      if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
        setProgress(30);
        console.log("Intentando compresión agresiva...");
        result = await aggressiveCompression(fileBuffer, compressionLevel, file.name);
        compression = calculateCompression(fileSize, result?.size || fileSize);
        
        // Si aún no es buena, probamos otra estrategia
        if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
          setProgress(45);
          console.log("Intentando compresión extrema...");
          result = await extremeCompression(fileBuffer, compressionLevel, file.name);
          compression = calculateCompression(fileSize, result?.size || fileSize);
          
          // Si todavía no funciona, probamos compresión de calidad de imagen
          if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
            setProgress(60);
            console.log("Intentando compresión de calidad de imagen...");
            result = await imageQualityCompression(fileBuffer, compressionLevel, file.name);
            compression = calculateCompression(fileSize, result?.size || fileSize);
            
            // Si aún no funciona, intentamos la compresión máxima
            if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
              setProgress(75);
              console.log("Intentando compresión última...");
              result = await ultimateCompression(fileBuffer, compressionLevel, file.name);
              compression = calculateCompression(fileSize, result?.size || fileSize);
            }
          }
        }
      }

      setProgress(90);

      // Verificar resultados finales con un umbral más bajo
      if (!result) {
        setCompressionError('No se pudo comprimir el PDF. Intenta con otro archivo.');
        setCompressedFile(null);
        setCompressionInfo(null);
        toast.error('Error al comprimir el PDF. Intenta con otro archivo.');
      } 
      else if (compression.savedPercentage <= 0) { // Solo si es exactamente 0 o negativo
        setCompressionError('No se pudo reducir el tamaño del archivo. Puede que ya esté optimizado.');
        setCompressedFile(null);
        setCompressionInfo(null);
        toast.error('No se pudo reducir el tamaño del archivo.');
      } 
      else {
        // Si logramos comprimir, guardamos el resultado
        setCompressedFile(result);
        setCompressionInfo(compression);
        toast.success(`PDF comprimido con éxito. Ahorro: ${compression.savedPercentage.toFixed(1)}%`);
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
