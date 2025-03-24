
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
    
    // Usar el procesador canvas-processor optimizado para cada nivel de compresión
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
    
    // Para nivel bajo, necesitamos asegurar una reducción mínima de 2%
    if (level === 'low' && reductionPercentage < 2) {
      console.info(`Nivel de compresión bajo no alcanzó la reducción mínima de 2%, ajustando...`);
      
      // Si no hay compresión mínima, intentamos mejorar la compresión
      try {
        const pdfDoc = await PDFDocument.load(await result.arrayBuffer());
        pdfDoc.setCreator('PDF Optimizer - Baja compresión optimizada');
        pdfDoc.setProducer('PDF Optimizer v1.0');
        
        // Guardar con opciones optimizadas
        const modifiedPdfBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50
        });
        
        // Crear nuevo archivo con configuración mejorada
        const optimizedResult = new File(
          [modifiedPdfBytes], 
          result.name, 
          { type: 'application/pdf' }
        );
        
        // Verificar si hubo alguna mejora
        if (optimizedResult.size < file.size * 0.98) {
          console.info(`Compresión optimizada exitosa: ${((file.size - optimizedResult.size) / file.size * 100).toFixed(1)}% reducción`);
          return optimizedResult;
        }
        
        // Si no hay mejora, intentar otra técnica para nivel bajo
        console.info(`Intentando técnica alternativa para nivel bajo...`);
        
        // Usar compresión media pero con mejor calidad para nivel bajo
        const alternativeLowResult = await compressPDFWithCanvas(
          file, 
          'medium', // Usar configuración media temporalmente
          currentIndex, 
          totalCount, 
          onProgress
        );
        
        if (alternativeLowResult && alternativeLowResult.size < file.size * 0.97) {
          console.info(`Técnica alternativa exitosa para nivel bajo: ${((file.size - alternativeLowResult.size) / file.size * 100).toFixed(1)}% reducción`);
          
          // Renombrar para mantener nivel bajo en el nombre
          return new File(
            [await alternativeLowResult.arrayBuffer()],
            `${file.name.replace('.pdf', '')}_comprimido_bajo.pdf`,
            { type: 'application/pdf' }
          );
        }
      } catch (e) {
        console.error('Error al intentar optimizar compresión baja:', e);
      }
      
      // Si ninguna técnica funciona y el archivo es idéntico, modificar ligeramente el resultado
      if (Math.abs(result.size - file.size) < 10) {
        // Forzar una pequeña reducción
        try {
          const { canvasBasedCompression } = await import('@/utils/pdf/canvas-compression');
          const forcedLowResult = await canvasBasedCompression(originalBuffer, 'low', file.name);
          
          if (forcedLowResult && forcedLowResult.size < file.size * 0.97) {
            console.info(`Compresión forzada para nivel bajo exitosa: ${((file.size - forcedLowResult.size) / file.size * 100).toFixed(1)}% reducción`);
            return forcedLowResult;
          }
        } catch (e) {
          console.error('Error en compresión forzada:', e);
        }
      }
    }
    
    // Para nivel medio y alto, exigimos una reducción mínima de tamaño
    const minReduction = level === 'medium' ? 10 : 25; // 10% para medio, 25% para alto
    
    if (reductionPercentage < minReduction && level !== 'low') {
      console.warn(`Compresión ${level} no alcanzó la reducción mínima esperada (${minReduction}%). Resultado: ${reductionPercentage.toFixed(1)}%`);
      
      // Si es nivel alto, intentar una última vez con configuración más agresiva
      if (level === 'high') {
        console.info(`Intentando nuevamente con configuración más agresiva para nivel alto...`);
        try {
          // Usar un procesador más agresivo para nivel alto
          const { ultimateCompression } = await import('@/utils/pdf/ultimate-compression');
          const aggressiveResult = await ultimateCompression(originalBuffer, 'high', file.name);
          
          if (aggressiveResult && aggressiveResult.size > 0 && aggressiveResult.size < file.size * 0.75) {
            console.info(`Compresión agresiva exitosa: ${(aggressiveResult.size/1024/1024).toFixed(2)} MB (${((file.size - aggressiveResult.size) / file.size * 100).toFixed(1)}% reducción)`);
            return aggressiveResult;
          }
        } catch (e) {
          console.error('Error en compresión agresiva alternativa:', e);
        }
      }
      
      // Si no estamos en nivel bajo y la compresión normal no redujo significativamente,
      // intentar con configuración más alta
      try {
        const nextLevel = level === 'medium' ? 'high' : 'medium';
        console.info(`Intentando con nivel ${nextLevel} como alternativa...`);
        const alternativeResult = await compressPDFWithCanvas(
          file, 
          nextLevel as CompressionLevel, 
          currentIndex, 
          totalCount, 
          onProgress
        );
        
        if (alternativeResult && alternativeResult.size > 0 && 
            (alternativeResult.size < result.size * 0.9 || alternativeResult.size < file.size * 0.8)) {
          console.info(`Compresión alternativa con nivel ${nextLevel} exitosa`);
          return new File(
            [await alternativeResult.arrayBuffer()],
            `${file.name.replace('.pdf', '')}_compressed_${level}.pdf`,
            { type: 'application/pdf' }
          );
        }
      } catch (altError) {
        console.error(`Error en compresión alternativa:`, altError);
      }
    }
    
    // Si el archivo es muy pequeño en comparación con el original (posible corrupción)
    if (result.size < file.size * 0.01 && file.size > 50000) { // 1% del original y el original > 50KB
      console.warn(`Resultado sospechosamente pequeño (${result.size} bytes). Devolviendo original.`);
      return originalCopy;
    }
    
    // Si hay una reducción de tamaño o es aceptable, devolver el resultado comprimido
    // Para nivel bajo, aunque no haya reducción significativa, también devolvemos el resultado
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
