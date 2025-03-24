
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { COMPRESSION_FACTORS } from '@/utils/pdf/compression-constants';
import { isWasmSupported } from '@/utils/pdf/pdfRenderUtils';
import { compressPDFWithCanvas } from '@/utils/pdf/processors/canvas-processor';

// Types of compression
export type CompressionLevel = 'low' | 'medium' | 'high';

/**
 * Compresses a PDF file using canvas rendering and image recompression techniques
 */
export async function compressPDF(
  file: File,
  level: CompressionLevel,
  currentIndex: number,
  totalCount: number,
  onProgress?: (progress: number) => void
): Promise<File | null> {
  try {
    console.info(`Iniciando compresión avanzada para nivel: ${level}`);
    
    // Verificar que el archivo sea válido antes de procesar
    if (!file || file.size === 0) {
      console.error('Archivo PDF inválido o vacío');
      throw new Error('Archivo PDF inválido o vacío');
    }
    
    // Crear una copia del buffer original para casos de fallback
    const originalBuffer = await file.arrayBuffer();
    const originalCopy = new File(
      [originalBuffer],
      `${file.name.replace('.pdf', '')}_original.pdf`,
      { type: 'application/pdf' }
    );
    
    // Asegurarnos que el progreso inicia
    if (onProgress) onProgress(5);
    
    // Usar el procesador canvas-processor optimizado para máxima calidad
    let result = await compressPDFWithCanvas(file, level, currentIndex, totalCount, onProgress);
    
    // Verificar que el resultado no sea null o tenga tamaño 0
    if (!result || result.size === 0) {
      console.warn(`La compresión falló o devolvió un archivo vacío. Devolviendo copia del archivo original.`);
      return originalCopy;
    }
    
    // Calcular porcentaje de reducción para evaluar si valió la pena
    const sizeDifference = file.size - result.size;
    const reductionPercentage = (sizeDifference / file.size) * 100;
    console.info(`Reducción de tamaño: ${reductionPercentage.toFixed(2)}% (${(sizeDifference/1024/1024).toFixed(2)} MB)`);
    
    // Si el archivo resultante es más grande que el original o tiene un tamaño muy pequeño (posible error),
    // considerar devolver el original para evitar problemas
    if (result.size > file.size * 1.3 || result.size < 1024) { // Menos de 1KB es sospechoso
      console.warn(`El archivo comprimido tiene un tamaño problemático: ${(result.size/1024).toFixed(2)}KB vs ${(file.size/1024).toFixed(2)}KB original.`);
      
      // Para nivel alto, intentar una última vez con configuración diferente
      if (level === 'high') {
        console.info(`Intentando nuevamente con configuración alternativa para nivel alto...`);
        try {
          const { ultimateCompression } = await import('@/utils/pdf/ultimate-compression');
          const ultimateResult = await ultimateCompression(originalBuffer, 'high', file.name);
          
          if (ultimateResult && ultimateResult.size > 1024 && ultimateResult.size < file.size) {
            console.info(`Compresión alternativa exitosa: ${(ultimateResult.size/1024/1024).toFixed(2)} MB`);
            return ultimateResult;
          }
        } catch (altError) {
          console.error('Error en compresión alternativa:', altError);
        }
      }
      
      // Si todos los intentos fallan, devolver el original
      console.warn(`Devolviendo archivo original después de intentos fallidos.`);
      return originalCopy;
    }
    
    // Si el archivo es muy pequeño en comparación con el original (posible corrupción)
    if (result.size < file.size * 0.01 && file.size > 50000) { // 1% del original y el original > 50KB
      console.warn(`Resultado sospechosamente pequeño (${result.size} bytes). Devolviendo original.`);
      return originalCopy;
    }
    
    // Si hay una reducción de tamaño o es aceptable, devolver el resultado comprimido
    return result;
  } catch (error) {
    console.error('Error compressing PDF with canvas:', error);
    if (onProgress) {
      onProgress(100);
    }
    
    try {
      // Último recurso: intentar devolver el archivo original
      const buffer = await file.arrayBuffer();
      return new File(
        [buffer],
        `${file.name.replace('.pdf', '')}_original.pdf`,
        { type: 'application/pdf' }
      );
    } catch (fallbackError) {
      console.error('Error en fallback final:', fallbackError);
      return null;
    }
  }
}

/**
 * Calculates compression statistics
 */
export const calculateCompressionStats = (originalSize: number, compressedSize: number) => {
  // Prevenir división por cero y resultados absurdos
  if (originalSize <= 0) return { originalSize, compressedSize, savedPercentage: 0 };
  
  // Calcular el porcentaje con un decimal y evitar resultados del 100% si el tamaño no es realmente cero
  const savedPercentage = Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10;
  
  // Si el compressedSize es extremadamente bajo pero no cero, puede indicar un error
  if (compressedSize < 1000 && originalSize > 50000) {
    console.warn(`Estadísticas sospechosas: ${originalSize} -> ${compressedSize} bytes. Posible error.`);
  }
  
  return {
    originalSize,
    compressedSize,
    savedPercentage
  };
};
