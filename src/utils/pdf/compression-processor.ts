import { PDFDocument, PDFPage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { COMPRESSION_FACTORS } from './compression-constants';
import { compressImageWithResmush } from './resmush-service';
import { renderPageToCanvas } from './pdf-renderer';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Tipo para niveles de compresión
export type CompressionLevel = 'low' | 'medium' | 'high';

/**
 * Comprime un PDF utilizando técnicas de renderizado en canvas
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
    // Obtener configuración de compresión según nivel
    const {
      imageQuality,
      scaleFactor,
      useHighQualityFormat,
      preserveTextQuality,
      textMode,
      resmushQuality
    } = COMPRESSION_FACTORS[compressionLevel];
    
    // Reportar inicio de procesamiento
    progressCallback(5);
    console.info(`Iniciando compresión de PDF con nivel ${compressionLevel}`);
    
    // Cargar el archivo como ArrayBuffer
    const fileArrayBuffer = await file.arrayBuffer();
    
    // Cargar el documento PDF con pdf.js
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(fileArrayBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.8.162/cmaps/',
      cMapPacked: true,
      useSystemFonts: true,
      useWorkerFetch: true,
      disableFontFace: false,
      isEvalSupported: true,
    });
    
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    
    // Crear nuevo documento PDF con pdf-lib
    const newPdfDoc = await PDFDocument.create();
    
    // Procesar cada página
    for (let i = 0; i < numPages; i++) {
      // Calcular y reportar progreso
      const pageProgress = 10 + Math.floor((i / numPages) * 80);
      progressCallback(pageProgress);
      
      console.info(`Procesando página ${i + 1}/${numPages}`);
      
      // Obtener página actual
      const page = await pdfDoc.getPage(i + 1);
      
      // Crear canvas para renderizar la página
      const canvas = document.createElement('canvas');
      
      // Renderizar página en el canvas con configuraciones de calidad
      await renderPageToCanvas(
        page,
        canvas,
        scaleFactor,
        useHighQualityFormat,
        preserveTextQuality ? 'print' : 'display'
      );
      
      // Comprimir la imagen del canvas usando reSmush.it
      const canvasBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob([]));
        }, 'image/jpeg', imageQuality);
      });
      
      // Usar el Blob en lugar del canvas directamente
      const compressedImageUrl = await compressImageWithResmush(
        canvasBlob,
        { quality: resmushQuality }
      );
      
      // Cargar la imagen comprimida
      const compressedImageResponse = await fetch(compressedImageUrl);
      const compressedImageBlob = await compressedImageResponse.blob();
      const compressedImageArrayBuffer = await compressedImageBlob.arrayBuffer();
      
      // Incrustar la imagen en el nuevo PDF
      const jpgImage = await newPdfDoc.embedJpg(new Uint8Array(compressedImageArrayBuffer));
      
      // Obtener dimensiones originales de la página
      const { width, height } = page.getViewport({ scale: 1.0 });
      
      // Añadir nueva página con las dimensiones originales
      const newPage = newPdfDoc.addPage([width, height]);
      
      // Dibujar la imagen comprimida en la nueva página
      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
    }
    
    // Guardar el documento comprimido
    progressCallback(95);
    const compressedPdfBytes = await newPdfDoc.save();
    
    // Crear nuevo archivo con el PDF comprimido
    const compressedFileName = file.name.replace('.pdf', '_comprimido.pdf');
    const compressedFile = new File([compressedPdfBytes], compressedFileName, {
      type: 'application/pdf',
      lastModified: new Date().getTime(),
    });
    
    // Reportar finalización
    progressCallback(100);
    console.info(`Compresión completada: ${file.size} bytes -> ${compressedFile.size} bytes`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir PDF:', error);
    return null;
  }
}

/**
 * Comprime un PDF utilizando técnicas avanzadas de optimización
 * @param file Archivo PDF a comprimir
 * @param compressionLevel Nivel de compresión deseado
 * @param progressCallback Función de callback para reportar progreso
 * @returns Archivo PDF comprimido o null si falla
 */
export async function compressPDFAdvanced(
  file: File,
  compressionLevel: CompressionLevel,
  progressCallback: (progress: number) => void = () => {}
): Promise<File | null> {
  try {
    // Obtener configuración de compresión según nivel
    const {
      imageQuality,
      scaleFactor,
      useHighQualityFormat,
      preserveTextQuality,
      textMode,
      resmushQuality
    } = COMPRESSION_FACTORS[compressionLevel];
    
    // Reportar inicio de procesamiento
    progressCallback(5);
    console.info(`Iniciando compresión avanzada de PDF con nivel ${compressionLevel}`);
    
    // Cargar el archivo como ArrayBuffer
    const fileArrayBuffer = await file.arrayBuffer();
    
    // Cargar el documento PDF con pdf-lib
    const pdfDoc = await PDFDocument.load(fileArrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    
    // Eliminar metadatos para reducir tamaño
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    
    // Obtener todas las páginas
    const pages = pdfDoc.getPages();
    const numPages = pages.length;
    
    // Procesar cada página para optimizar imágenes
    for (let i = 0; i < numPages; i++) {
      // Calcular y reportar progreso
      const pageProgress = 10 + Math.floor((i / numPages) * 80);
      progressCallback(pageProgress);
      
      console.info(`Procesando página ${i + 1}/${numPages}`);
      
      // Aquí iría la lógica para optimizar cada página
      // Pero como pdf-lib no permite acceder directamente a las imágenes,
      // esta implementación es limitada
    }
    
    // Guardar el documento con opciones de compresión
    progressCallback(95);
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100
    });
    
    // Crear nuevo archivo con el PDF comprimido
    const compressedFileName = file.name.replace('.pdf', '_comprimido.pdf');
    const compressedFile = new File([compressedPdfBytes], compressedFileName, {
      type: 'application/pdf',
      lastModified: new Date().getTime(),
    });
    
    // Reportar finalización
    progressCallback(100);
    console.info(`Compresión avanzada completada: ${file.size} bytes -> ${compressedFile.size} bytes`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error en compresión avanzada de PDF:', error);
    return null;
  }
}

/**
 * Comprime un PDF utilizando el método más adecuado según el nivel de compresión
 * @param file Archivo PDF a comprimir
 * @param compressionLevel Nivel de compresión deseado
 * @param fileIndex Índice del archivo (para procesamiento múltiple)
 * @param totalFiles Total de archivos (para procesamiento múltiple)
 * @param progressCallback Función de callback para reportar progreso
 * @returns Archivo PDF comprimido o null si falla
 */
export async function compressPDF(
  file: File,
  compressionLevel: CompressionLevel,
  fileIndex: number = 0,
  totalFiles: number = 1,
  progressCallback: (progress: number) => void = () => {}
): Promise<File | null> {
  // Para alta compresión, usar el método basado en canvas
  if (compressionLevel === "high") {
    return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
  } 
  // Para compresión media, intentar primero el método avanzado y si falla usar canvas
  else if (compressionLevel === "medium") {
    try {
      const result = await compressPDFAdvanced(file, compressionLevel, progressCallback);
      if (result && result.size < file.size) {
        return result;
      }
      console.info("Método avanzado no logró reducir el tamaño, intentando con canvas...");
      return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    } catch (error) {
      console.error("Error en método avanzado, usando canvas como fallback:", error);
      return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    }
  } 
  // Para baja compresión, usar el método avanzado que preserva mejor la calidad
  else {
    try {
      const result = await compressPDFAdvanced(file, compressionLevel, progressCallback);
      if (result && result.size < file.size) {
        return result;
      }
      console.info("Método avanzado no logró reducir el tamaño, intentando con canvas de alta calidad...");
      return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    } catch (error) {
      console.error("Error en método avanzado, usando canvas como fallback:", error);
      return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    }
  }
}
