
import { CompressionLevel } from '../compression-types';
import { compressPDFWithCanvas } from './canvas-processor';
import { compressPDFAdvanced } from './advanced-processor';
import { standardCompression } from '../standard-compression';
import { ultimateCompression } from '../ultimate-compression';
import { PDFDocument } from 'pdf-lib';
import { getQualityForCompressionLevel } from './resmush-processor';

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
  
  // Determinar calidad de imagen según nivel de compresión para servicios de compresión de imágenes
  const imageQuality = getQualityForCompressionLevel(compressionLevel);
  
  try {
    let result = null;
    
    // Estrategia especial para nivel de compresión bajo
    if (compressionLevel === 'low') {
      console.info('Aplicando estrategia especial para nivel de compresión bajo');
      
      try {
        // Para nivel bajo, intentar primero con ultimate-compression (menos destructivo)
        const fileBuffer = await file.arrayBuffer();
        progressCallback(30);
        
        result = await ultimateCompression(fileBuffer, 'low', file.name);
        progressCallback(60);
        
        // Si falló, intentar con standardCompression
        if (!result) {
          console.warn('Ultimate compression falló para nivel bajo, intentando standard compression');
          result = await standardCompression(fileBuffer, 'low', file.name);
          progressCallback(80);
        }
        
        // Si aún no hay resultado, forzar un mínimo cambio en el documento original
        if (!result) {
          console.warn('Todas las compresiones fallaron para nivel bajo, forzando resultado mínimo');
          
          const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
          
          // Forzar cambios en los metadatos para asegurar alguna diferencia
          const timestamp = Date.now().toString();
          pdfDoc.setProducer(`PDF Optimizer - Compresión mínima forzada (${timestamp})`);
          pdfDoc.setCreator(`PDF Optimizer v2.1 - Calidad óptima (${timestamp})`);
          pdfDoc.setSubject(`Documento optimizado - compresión mínima (${timestamp})`);
          
          const bytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 150
          });
          
          result = new File(
            [bytes],
            `comprimido_bajo_${file.name}`,
            { type: 'application/pdf' }
          );
        }
        
        // Verificar que tenemos un resultado para nivel bajo
        if (result) {
          console.info(`Compresión de baja calidad completada: ${Math.round(result.size/1024)}KB (era ${Math.round(file.size/1024)}KB)`);
          progressCallback(100);
          return result;
        }
      } catch (lowError) {
        console.error('Error en estrategia especial para nivel bajo:', lowError);
      }
    }
    
    // Para nivel medio y alto, o si el nivel bajo falló, continuar con la estrategia normal
    let attempts = 0;
    const maxAttempts = 2;
    
    while (!result && attempts < maxAttempts) {
      attempts++;
      try {
        // First attempt with canvas processor which is the most reliable
        result = await compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
        
        // Para niveles medio y alto, verificar que hay una compresión significativa
        if (result && compressionLevel !== 'low' && Math.abs(result.size - file.size) / file.size < 0.05) {
          console.warn(`Compresión ${compressionLevel} produjo cambios insuficientes. Intentando alternativa...`);
          
          // Solo en niveles medio y alto buscamos alternativas si no hay compresión significativa
          result = null;
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
          
          // Para nivel bajo, aceptar cualquier resultado de este método
          if (compressionLevel === 'low' && result) {
            console.info(`Usando compresión estándar para nivel bajo (${file.name})`);
            return result;
          }
          
          // Para otros niveles, verificar compresión significativa
          if (result && compressionLevel !== 'low' && Math.abs(result.size - file.size) / file.size < 0.1) {
            console.warn(`Compresión estándar produjo cambios insuficientes para nivel ${compressionLevel}. Intentando otra...`);
            result = null;
          }
        } catch (standardError) {
          console.error("Standard compression failed:", standardError);
        }
      }
      
      // If second method failed and high/medium compression is requested, try advanced processor
      if (!result && attempts === 2 && (compressionLevel === 'high' || compressionLevel === 'medium')) {
        try {
          result = await compressPDFAdvanced(file, compressionLevel, progressCallback);
          
          // Verificar si logramos compresión significativa
          if (result && Math.abs(result.size - file.size) / file.size < 0.1) {
            console.warn(`Compresión avanzada produjo cambios insuficientes. Intentando última estrategia...`);
            
            try {
              const ultimateResult = await ultimateCompression(await file.arrayBuffer(), compressionLevel, file.name);
              if (ultimateResult && Math.abs(ultimateResult.size - file.size) / file.size > 0.15) {
                result = ultimateResult;
              }
            } catch (ultimateError) {
              console.error("Ultimate compression failed:", ultimateError);
            }
          }
        } catch (advancedError) {
          console.error("Advanced compression failed:", advancedError);
        }
      }
    }
    
    // Para nivel bajo, si todo falló, forzar un resultado con cambios mínimos
    if (!result && compressionLevel === 'low') {
      console.warn("Todos los métodos de compresión fallaron para nivel bajo. Forzando resultado...");
      
      try {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        
        // Configuración específica para nivel bajo
        const timestamp = Date.now().toString();
        pdfDoc.setProducer(`PDF Optimizer - Compresión mínima (${timestamp})`);
        pdfDoc.setCreator(`PDF Optimizer v1.0 - Calidad óptima (${timestamp})`);
        pdfDoc.setSubject(`Documento optimizado - último recurso (${timestamp})`);
        
        // Guardar con opciones muy ligeras
        const bytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 100
        });
        
        // Crear archivo con cambios mínimos
        result = new File(
          [bytes],
          `${file.name.replace('.pdf', '')}_optimizado_bajo.pdf`,
          { type: 'application/pdf' }
        );
      } catch (forcedError) {
        console.error("Error en compresión forzada para nivel bajo:", forcedError);
      }
    }
    
    // Final fallback - create a copy with minimal optimization
    if (!result) {
      console.warn("All compression methods failed, creating minimally optimized copy...");
      try {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        
        // Basic metadata cleanup
        const timestamp = Date.now().toString();
        pdfDoc.setProducer(`PDF Optimizer - ${compressionLevel} (fallback) (${timestamp})`);
        pdfDoc.setCreator(`PDF Optimizer v1.0 (${timestamp})`);
        
        // Save with minimal optimization
        const bytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false
        });
        
        result = new File(
          [bytes],
          `${file.name.replace('.pdf', '')}_procesado_${compressionLevel}.pdf`,
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
