
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { CompressionLevel } from '../compression-types';
import { COMPRESSION_FACTORS } from '../compression-constants';
import { loadPdfDocumentFromArray } from './render-utils';
import { processPage } from './page-processor';
import { getPdfSaveOptions } from './canvas-config';
import { 
  tryLowCompressionAlternatives, 
  tryMediumCompressionAlternatives, 
  tryHighCompressionAlternatives 
} from './fallback-strategies';

/**
 * Comprime un PDF utilizando técnicas de renderizado en canvas con calidad optimizada
 * @param file Archivo PDF a comprimir
 * @param compressionLevel Nivel de compresión deseado
 * @param fileIndex Índice del archivo (para procesamiento múltiple)
 * @param totalFiles Total de archivos (para procesamiento múltiple)
 * @param progressCallback Función de callback para reportar progreso
 * @returns Archivo PDF comprimido o null si falla
 */
export async function compressPDFWithCanvas(
  file: File,
  compressionLevel: CompressionLevel,
  fileIndex: number = 0,
  totalFiles: number = 1,
  progressCallback: (progress: number) => void = () => {}
): Promise<File | null> {
  try {
    // Guardar una copia del archivo original para casos de fallback
    const originalFileBuffer = await file.arrayBuffer();
    
    // Reportar inicio de procesamiento
    progressCallback(5);
    console.info(`Iniciando compresión de PDF con nivel ${compressionLevel} - Archivo: ${file.name} (${Math.round(file.size/1024)} KB)`);
    
    // Verificar que el archivo no esté vacío
    if (file.size === 0) {
      console.error('Archivo PDF vacío');
      throw new Error('Archivo PDF vacío');
    }
    
    try {
      // Cargar el documento PDF
      const pdfDoc = await loadPdfDocumentFromArray(originalFileBuffer);
      if (!pdfDoc) {
        throw new Error('No se pudo cargar el documento PDF');
      }
      
      const numPages = pdfDoc.numPages;
      if (numPages === 0) {
        throw new Error('El PDF no contiene páginas');
      }
      
      console.info(`PDF cargado. Número de páginas: ${numPages}`);
      
      // Crear nuevo documento PDF con pdf-lib
      const newPdfDoc = await PDFDocument.create();
      
      // Añadir metadatos distintos según nivel para garantizar diferencias
      if (compressionLevel === 'low') {
        newPdfDoc.setCreator(`PDF Optimizer - Nivel ${compressionLevel} (optimización ligera)`);
        newPdfDoc.setProducer(`CompresorPDF v2.1 - CALIDAD ALTA`);
        newPdfDoc.setSubject('Compresión ligera para mantener calidad');
      } else if (compressionLevel === 'medium') {
        newPdfDoc.setCreator(`PDF Optimizer - Nivel ${compressionLevel} (reducción significativa)`);
        newPdfDoc.setProducer(`CompresorPDF v2.1 - EQUILIBRADO`);
        newPdfDoc.setSubject('Compresión equilibrada para ahorro de espacio');
      } else {
        newPdfDoc.setCreator(`PDF Optimizer - Nivel ${compressionLevel} (máxima compresión)`);
        newPdfDoc.setProducer(`CompresorPDF v2.1 - MÁXIMA COMPRESIÓN`);
        newPdfDoc.setSubject('Compresión agresiva para mínimo tamaño');
      }
      
      // Procesar cada página aplicando el nivel de compresión correspondiente
      let successfulPages = 0;
      for (let i = 0; i < numPages; i++) {
        // Calcular y reportar progreso
        const pageProgress = 10 + Math.floor((i / numPages) * 80);
        progressCallback(pageProgress);
        
        console.info(`Procesando página ${i + 1}/${numPages} con nivel de compresión ${compressionLevel}`);
        
        const pageProcessed = await processPage(pdfDoc, newPdfDoc, i, compressionLevel);
        if (pageProcessed) {
          successfulPages++;
        }
      }
      
      // Si no se procesó ninguna página correctamente, devolver el archivo original
      if (newPdfDoc.getPageCount() === 0) {
        console.error("No se pudo procesar ninguna página correctamente");
        return new File(
          [originalFileBuffer],
          `${file.name.replace('.pdf', '')}_original.pdf`,
          { type: 'application/pdf' }
        );
      }
      
      // Guardar el documento comprimido con opciones optimizadas según nivel
      progressCallback(95);
      console.info("Guardando documento comprimido con opciones optimizadas...");
      
      // Obtener opciones de guardado según nivel
      const saveOptions = getPdfSaveOptions(compressionLevel);
      
      console.info(`Guardando con objectsPerTick: ${saveOptions.objectsPerTick} para nivel ${compressionLevel}`);
      
      let compressedPdfBytes;
      try {
        compressedPdfBytes = await newPdfDoc.save(saveOptions);
        
        // Verificar que el resultado no esté vacío
        if (!compressedPdfBytes || compressedPdfBytes.length === 0) {
          throw new Error('Documento PDF comprimido vacío');
        }
      } catch (saveError) {
        console.error('Error al guardar PDF comprimido:', saveError);
        throw saveError;
      }
      
      // Crear nuevo archivo con el PDF comprimido
      const compressedFileName = file.name.replace('.pdf', `_comprimido_${compressionLevel}.pdf`);
      const compressedFile = new File(
        [compressedPdfBytes], 
        compressedFileName, 
        {
          type: 'application/pdf',
          lastModified: new Date().getTime(),
        }
      );
      
      // Verificar que el archivo comprimido no esté vacío
      if (compressedFile.size === 0) {
        console.error('Archivo comprimido vacío después de guardar');
        return new File(
          [originalFileBuffer],
          `${file.name.replace('.pdf', '')}_original.pdf`,
          { type: 'application/pdf' }
        );
      }
      
      // Para nivel bajo, si el archivo es mayor que el original, intentar nueva compresión
      if (compressionLevel === 'low' && compressedFile.size >= file.size * 0.98) {
        console.warn(`Archivo comprimido en nivel bajo no logró reducción mínima. Intentando ajuste...`);
        
        // Crear un nuevo documento con configuración ligeramente más agresiva
        const lowRetriedDoc = await PDFDocument.create();
        lowRetriedDoc.setCreator(`PDF Optimizer - Nivel ${compressionLevel} (segundo intento)`);
        lowRetriedDoc.setProducer(`CompresorPDF v2.1 - CALIDAD OPTIMIZADA`);
        
        // Copiar páginas del documento comprimido
        const existingPdfDoc = await PDFDocument.load(compressedPdfBytes);
        const copiedPages = await lowRetriedDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
        
        for (const page of copiedPages) {
          lowRetriedDoc.addPage(page);
        }
        
        // Guardar con configuración optimizada para nivel bajo
        const retriedBytes = await lowRetriedDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 40
        });
        
        const retriedFile = new File(
          [retriedBytes], 
          compressedFileName, 
          {
            type: 'application/pdf',
            lastModified: new Date().getTime(),
          }
        );
        
        // Verificar si logramos reducción
        if (retriedFile.size < file.size * 0.98) {
          console.info(`Segundo intento exitoso para nivel bajo: ${(retriedFile.size/1024/1024).toFixed(2)} MB (${((file.size - retriedFile.size) / file.size * 100).toFixed(1)}% reducción)`);
          return retriedFile;
        }
        
        // Intentar estrategias alternativas para nivel bajo
        const alternativeResult = await tryLowCompressionAlternatives(
          compressedPdfBytes,
          compressedFileName,
          file.size
        );
        
        if (alternativeResult) {
          return alternativeResult;
        }
      }
      
      // Para nivel medio, si el archivo es sustancialmente mayor, intentar nueva estrategia
      if (compressionLevel === 'medium' && compressedFile.size >= file.size * 0.95) {
        console.warn(`Archivo comprimido en nivel medio no logró reducción suficiente. Intentando ajuste...`);
        
        const mediumAlternativeResult = await tryMediumCompressionAlternatives(
          file,
          fileIndex,
          totalFiles,
          progressCallback
        );
        
        if (mediumAlternativeResult) {
          return mediumAlternativeResult;
        }
      }
      
      // Para nivel alto, verificar si el archivo es anormalmente grande e intentar compresión extrema
      if (compressionLevel === 'high' && compressedFile.size > file.size * 0.9) {
        console.warn(`Compresión alta no logró reducción suficiente. Intentando compresión extrema...`);
        
        const highAlternativeResult = await tryHighCompressionAlternatives(
          originalFileBuffer,
          file
        );
        
        if (highAlternativeResult) {
          return highAlternativeResult;
        }
      }
      
      // Si el archivo es muy pequeño en comparación con el original (posible error)
      if (compressedFile.size < file.size * 0.01 && file.size > 50000) {
        console.warn(`Resultado sospechosamente pequeño (${compressedFile.size} bytes vs original ${file.size} bytes). Devolviendo original.`);
        return new File(
          [originalFileBuffer],
          `${file.name.replace('.pdf', '')}_original.pdf`,
          { type: 'application/pdf' }
        );
      }
      
      // Reportar finalización y estadísticas
      progressCallback(100);
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(2);
      
      console.info(`Compresión ${compressionLevel} completada: ${originalSize} MB -> ${compressedSize} MB (${compressionRatio}% reducción)`);
      
      return compressedFile;
    } catch (pdfError) {
      console.error('Error al procesar el PDF:', pdfError);
      
      // FALLBACK DE EMERGENCIA: Si todo falló, devolver una copia del original
      return new File(
        [originalFileBuffer],
        `${file.name.replace('.pdf', '')}_original.pdf`,
        { type: 'application/pdf' }
      );
    }
  } catch (error) {
    console.error('Error general al comprimir PDF:', error);
    // Último intento: devolver null para que el nivel superior maneje el error
    return null;
  }
}
