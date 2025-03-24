
import { PDFDocument } from 'pdf-lib';
import { CompressionLevel } from '../compression-types';
import { compressPDFWithCanvas } from './canvas-processor';

/**
 * Intenta estrategias alternativas para nivel bajo de compresión
 * @param compressedBytes Bytes del PDF comprimido
 * @param originalFileName Nombre de archivo original
 * @param originalFileSize Tamaño del archivo original
 * @returns Archivo comprimido o null
 */
export async function tryLowCompressionAlternatives(
  compressedBytes: Uint8Array,
  originalFileName: string,
  originalFileSize: number
): Promise<File | null> {
  const compressedFileName = originalFileName.replace('.pdf', `_comprimido_low.pdf`);
  const compressedFile = new File(
    [compressedBytes], 
    compressedFileName, 
    {
      type: 'application/pdf',
      lastModified: new Date().getTime(),
    }
  );
  
  // Verificar si logramos reducción
  if (compressedFile.size < originalFileSize * 0.98) {
    console.info(`Segundo intento exitoso para nivel bajo: ${(compressedFile.size/1024/1024).toFixed(2)} MB (${((originalFileSize - compressedFile.size) / originalFileSize * 100).toFixed(1)}% reducción)`);
    return compressedFile;
  }
  
  // Si no logramos compresión, usar estrategia alternativa
  try {
    console.info(`Intentando estrategia alternativa para nivel bajo...`);
    const existingPdfDoc = await PDFDocument.load(compressedBytes);
    
    const forcedLowBytes = await existingPdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 20
    });
    
    const forcedLowFile = new File(
      [forcedLowBytes], 
      compressedFileName, 
      {
        type: 'application/pdf',
        lastModified: new Date().getTime(),
      }
    );
    
    if (forcedLowFile.size < originalFileSize * 0.98) {
      console.info(`Estrategia alternativa exitosa para nivel bajo`);
      return forcedLowFile;
    }
  } catch (forcedError) {
    console.error('Error en estrategia alternativa para nivel bajo:', forcedError);
  }
  
  return null;
}

/**
 * Intenta estrategias alternativas para nivel medio de compresión
 * @param originalFile Archivo original
 * @param fileIndex Índice del archivo
 * @param totalFiles Total de archivos
 * @param progressCallback Función de callback para reportar progreso
 * @returns Archivo comprimido o null
 */
export async function tryMediumCompressionAlternatives(
  originalFile: File,
  fileIndex: number,
  totalFiles: number,
  progressCallback: (progress: number) => void
): Promise<File | null> {
  try {
    // Usar compresión alta pero con mayor calidad
    const mediumRetriedResult = await compressPDFWithCanvas(
      originalFile,
      'high', // Usar nivel alto
      fileIndex,
      totalFiles,
      progressCallback
    );
    
    if (mediumRetriedResult && mediumRetriedResult.size < originalFile.size * 0.9) {
      console.info(`Nueva estrategia exitosa para nivel medio: ${(mediumRetriedResult.size/1024/1024).toFixed(2)} MB (${((originalFile.size - mediumRetriedResult.size) / originalFile.size * 100).toFixed(1)}% reducción)`);
      
      // Renombrar para mantener coherencia
      return new File(
        [await mediumRetriedResult.arrayBuffer()],
        originalFile.name.replace('.pdf', `_comprimido_medio.pdf`),
        { type: 'application/pdf' }
      );
    }
  } catch (mediumRetryError) {
    console.error('Error en segundo intento para nivel medio:', mediumRetryError);
  }
  
  return null;
}

/**
 * Intenta estrategias extremas para nivel alto de compresión
 * @param originalBuffer Buffer del archivo original
 * @param originalFile Archivo original
 * @returns Archivo comprimido o null
 */
export async function tryHighCompressionAlternatives(
  originalBuffer: ArrayBuffer,
  originalFile: File
): Promise<File | null> {
  try {
    const { ultimateCompression } = await import('../ultimate-compression');
    const extremeResult = await ultimateCompression(originalBuffer, 'high', originalFile.name);
    
    if (extremeResult && extremeResult.size < originalFile.size * 0.75) {
      console.info(`Compresión extrema exitosa: ${(extremeResult.size/1024/1024).toFixed(2)} MB (${((originalFile.size - extremeResult.size) / originalFile.size * 100).toFixed(1)}% reducción)`);
      return extremeResult;
    }
  } catch (extremeError) {
    console.error('Error en compresión extrema:', extremeError);
  }
  
  return null;
}
