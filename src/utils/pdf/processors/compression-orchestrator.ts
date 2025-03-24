
import { CompressionLevel } from '../compression-types';
import { compressPDFWithCanvas } from './canvas-processor';
import { compressPDFAdvanced } from './advanced-processor';
import { standardCompression } from '../standard-compression';
import { PDFDocument } from 'pdf-lib';

/**
 * Comprime un PDF utilizando el método más apropiado según el nivel de compresión
 * @param file Archivo PDF a comprimir
 * @param compressionLevel Nivel de compresión deseado
 * @param fileIndex Índice del archivo (para procesamiento múltiple)
 * @param totalFiles Total de archivos (para procesamiento múltiple)
 * @param progressCallback Función de callback para reportar progreso
 * @returns Archivo PDF comprimido o null si falla
 */
export async function compressPDF(
  file: File,
  compressionLevel: CompressionLevel = 'medium',
  fileIndex: number = 0,
  totalFiles: number = 1,
  progressCallback: (progress: number) => void = () => {}
): Promise<File | null> {
  console.info(`Orquestando compresión de PDF '${file.name}' (${Math.round(file.size/1024)}KB) con nivel ${compressionLevel}`);
  
  // Initialize progress
  progressCallback(5);
  
  try {
    let result = null;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (!result && attempts < maxAttempts) {
      attempts++;
      try {
        // First attempt with canvas processor which is the most reliable
        result = await compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
        
        // Validate compression result
        if (result && Math.abs(result.size - file.size) / file.size < 0.05) {
          console.warn(`Compression attempt ${attempts} produced insufficient compression (${result.size} vs ${file.size}). Trying alternative method...`);
          result = null; // Reset for next method
        }
      } catch (attemptError) {
        console.error(`Compression attempt ${attempts} failed:`, attemptError);
        result = null;
      }
      
      // If first method failed, try standard compression
      if (!result && attempts === 1) {
        try {
          const fileBuffer = await file.arrayBuffer();
          result = await standardCompression(fileBuffer, compressionLevel, file.name);
          progressCallback(70);
          
          // Check if we got actual compression
          if (result && Math.abs(result.size - file.size) / file.size < 0.05) {
            console.warn(`Standard compression produced insufficient compression. Trying next method...`);
            result = null;
          }
        } catch (standardError) {
          console.error("Standard compression failed:", standardError);
        }
      }
      
      // If second method failed and high compression is requested, try advanced processor
      if (!result && attempts === 2 && compressionLevel === 'high') {
        try {
          result = await compressPDFAdvanced(file, compressionLevel, progressCallback);
        } catch (advancedError) {
          console.error("Advanced compression failed:", advancedError);
        }
      }
    }
    
    // Final fallback - create a copy with minimal optimization
    if (!result) {
      console.warn("All compression methods failed, creating minimally optimized copy...");
      try {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        
        // Basic metadata cleanup
        pdfDoc.setProducer(`PDF Optimizer - Minimal compression`);
        pdfDoc.setCreator(`PDF Optimizer v1.0`);
        
        // Save with minimal optimization
        const bytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false
        });
        
        result = new File(
          [bytes],
          `${file.name.replace('.pdf', '')}_procesado.pdf`,
          { type: 'application/pdf' }
        );
      } catch (fallbackError) {
        console.error("Fallback compression failed:", fallbackError);
        // Last resort - return a copy of the original
        result = new File(
          [await file.arrayBuffer()],
          `${file.name.replace('.pdf', '')}_copia.pdf`,
          { type: 'application/pdf' }
        );
      }
    }
    
    // Ensure progress completion
    progressCallback(100);
    return result;
  } catch (error) {
    console.error('Error en el orquestador de compresión:', error);
    progressCallback(100);
    
    // Last resort - return a copy of the original
    try {
      return new File(
        [await file.arrayBuffer()],
        `${file.name.replace('.pdf', '')}_copia.pdf`,
        { type: 'application/pdf' }
      );
    } catch (finalError) {
      console.error("Failed to create copy:", finalError);
      return null;
    }
  }
}
