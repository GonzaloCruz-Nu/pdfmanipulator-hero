
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { COMPRESSION_FACTORS } from '@/utils/pdf/compression-constants';
import { renderPageToCanvas, isWasmSupported } from '@/utils/pdf/pdfRenderUtils';
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
    
    // Usar el nuevo procesador canvas-processor optimizado para máxima calidad
    const result = await compressPDFWithCanvas(file, level, currentIndex, totalCount, onProgress);
    
    // Si el archivo resultante es más grande que el original en niveles bajo/medio
    // simplemente devolver el original para evitar aumentos de tamaño
    if (result && (level === 'low' || level === 'medium') && result.size > file.size * 1.1) {
      console.warn(`El archivo comprimido es más grande que el original (${(result.size/1024).toFixed(2)}KB vs ${(file.size/1024).toFixed(2)}KB). Devolviendo archivo original.`);
      return new File(
        [await file.arrayBuffer()],
        `${file.name.replace('.pdf', '')}_optimizado.pdf`,
        { type: 'application/pdf' }
      );
    }
    
    return result;
  } catch (error) {
    console.error('Error compressing PDF with canvas:', error);
    if (onProgress) {
      onProgress(100);
    }
    return null;
  }
}

/**
 * Calculates compression statistics
 */
export const calculateCompressionStats = (originalSize: number, compressedSize: number) => {
  const savedPercentage = Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10;
  return {
    originalSize,
    compressedSize,
    savedPercentage
  };
};
