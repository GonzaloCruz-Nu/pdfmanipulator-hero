
import { toast } from 'sonner';
import { compressPDF, calculateCompressionStats } from '@/services/pdfCompressionService';
import type { CompressionLevel, CompressionInfo } from '@/utils/pdf/compression-types';

/**
 * Procesa un único archivo PDF para compresión con alta calidad
 */
export const processPdfFile = async (
  file: File,
  compressionLevel: CompressionLevel,
  fileIndex: number, 
  totalFiles: number,
  progressCallback: (value: number) => void
): Promise<File | null> => {
  console.info(`Procesando archivo ${fileIndex+1}/${totalFiles}: ${file.name}`);
  
  // Maximum 3 attempts per file
  let compressedFile = null;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (!compressedFile && attempts < maxAttempts) {
    attempts++;
    try {
      // Compress using canvas-based method with enhanced quality
      compressedFile = await compressPDF(
        file, 
        compressionLevel, 
        fileIndex, 
        totalFiles, 
        progressCallback
      );
      
      // Verificar que el archivo comprimido sea válido y tenga un tamaño razonable
      if (compressedFile && compressedFile.size < file.size * 0.3) {
        console.warn(`Compresión excesiva detectada (${Math.round(compressedFile.size/1024)} KB vs original ${Math.round(file.size/1024)} KB). Reintentando...`);
        compressedFile = null; // Forzar reintento
        continue;
      }
      
      // Si la compresión generó un archivo demasiado pequeño (posible corrupción)
      if (compressedFile && compressedFile.size < 1000 && file.size > 10000) {
        console.warn(`Resultado de compresión sospechosamente pequeño (${compressedFile.size} bytes). Reintentando...`);
        compressedFile = null; // Forzar reintento
        continue;
      }
      
      // Validación adicional para garantizar calidad
      if (compressedFile && compressionLevel === 'low' && compressedFile.size < file.size * 0.7) {
        console.warn(`Compresión nivel bajo demasiado agresiva (${Math.round((file.size - compressedFile.size) * 100 / file.size)}% reducción). Reintentando...`);
        compressedFile = null;
        continue;
      }
      
      // Validación para nivel medio
      if (compressedFile && compressionLevel === 'medium' && compressedFile.size < file.size * 0.5) {
        console.warn(`Compresión nivel medio demasiado agresiva (${Math.round((file.size - compressedFile.size) * 100 / file.size)}% reducción). Reintentando...`);
        compressedFile = null;
        continue;
      }
      
    } catch (attemptError) {
      console.warn(`Intento ${attempts}/${maxAttempts} falló:`, attemptError);
      
      // Si es el último intento, crear una copia del original
      if (attempts === maxAttempts) {
        console.warn("Usando archivo original como último recurso");
        try {
          const buffer = await file.arrayBuffer();
          compressedFile = new File(
            [buffer],
            `${file.name.replace('.pdf', '')}_copia.pdf`,
            { type: 'application/pdf' }
          );
        } catch (copyError) {
          console.error("Error creando copia:", copyError);
        }
      }
    }
  }
  
  return compressedFile;
};

/**
 * Crea una copia del archivo original
 */
export const createFallbackCopy = async (file: File): Promise<File | null> => {
  try {
    const buffer = await file.arrayBuffer();
    return new File(
      [buffer],
      `${file.name.replace('.pdf', '')}_copia.pdf`,
      { type: 'application/pdf' }
    );
  } catch (fallbackError) {
    console.error(`No se pudo crear copia para ${file.name}:`, fallbackError);
    return null;
  }
};

/**
 * Muestra mensaje toast apropiado basado en resultados de compresión
 */
export const showCompressionResultToast = (
  compressedFiles: File[],
  originalFiles: File[],
  processingErrors: number
): void => {
  if (compressedFiles.length === 0) {
    toast.error('No se pudo procesar ningún archivo PDF. Intenta con otro nivel de compresión.');
    return;
  }
  
  if (compressedFiles.length < originalFiles.length) {
    if (processingErrors > 0) {
      toast.warning(`Se procesaron ${compressedFiles.length} de ${originalFiles.length} archivos. Algunos fueron procesados como copias.`);
    } else {
      toast.warning(`Se procesaron ${compressedFiles.length} de ${originalFiles.length} archivos.`);
    }
  } else {
    if (processingErrors > 0) {
      toast.success(`Se procesaron ${originalFiles.length} archivos. Algunos fueron procesados como copias.`);
    } else {
      toast.success(`Se procesaron ${originalFiles.length} archivos correctamente.`);
    }
  }
};
