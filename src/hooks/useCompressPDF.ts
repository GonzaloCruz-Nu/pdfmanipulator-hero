
import { useState } from 'react';
import { toast } from 'sonner';
import {
  standardCompression,
  aggressiveCompression,
  extremeCompression,
  imageQualityCompression,
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
      setProgress(10);

      // Get original file bytes
      const fileBuffer = await file.arrayBuffer();
      const fileSize = file.size;

      // First strategy: standard compression
      setProgress(20);
      let result = await standardCompression(fileBuffer, compressionLevel, file.name);
      let compression = calculateCompression(fileSize, result?.size || fileSize);
      
      // If we don't achieve good compression, try another strategy
      if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
        setProgress(40);
        result = await aggressiveCompression(fileBuffer, compressionLevel, file.name);
        compression = calculateCompression(fileSize, result?.size || fileSize);
        
        // If still not good, try a final strategy
        if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
          setProgress(60);
          result = await extremeCompression(fileBuffer, compressionLevel, file.name);
          compression = calculateCompression(fileSize, result?.size || fileSize);
          
          // If it still doesn't work, try image quality compression
          if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
            setProgress(80);
            result = await imageQualityCompression(fileBuffer, compressionLevel, file.name);
            compression = calculateCompression(fileSize, result?.size || fileSize);
          }
        }
      }

      setProgress(90);

      // Verify final results
      if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
        setCompressionError('No se pudo comprimir más el PDF. El archivo ya está optimizado.');
        setCompressedFile(null);
        setCompressionInfo(null);
        toast.error('No se pudo reducir el tamaño del archivo. Puede que ya esté optimizado.');
      } else {
        // If we managed to compress, save the result
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
