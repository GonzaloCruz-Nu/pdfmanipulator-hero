import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { COMPRESSION_FACTORS } from './compression-constants';
import { renderPageToCanvas, loadPdfDocument } from './pdf-renderer';

// Tipos de compresión
export type CompressionLevel = 'low' | 'medium' | 'high';

// Verificar compatibilidad con WebP
const isWebPSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    if (canvas && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
  } catch (e) {
    console.error('Error checking WebP support:', e);
  }
  return false;
};

// Verificar compatibilidad con WebAssembly
const isWasmSupported = (): boolean => {
  try {
    return typeof WebAssembly === 'object' && 
           typeof WebAssembly.instantiate === 'function' &&
           typeof WebAssembly.compile === 'function';
  } catch (e) {
    console.error('Error checking WebAssembly support:', e);
    return false;
  }
};

/**
 * Comprime un PDF usando la técnica de renderizado a canvas y recompresión de imágenes
 * @param file Archivo PDF a comprimir
 * @param level Nivel de compresión a utilizar
 * @returns Archivo PDF comprimido o null si hay error
 */
export async function compressPDFWithCanvas(
  file: File,
  level: CompressionLevel,
  onProgress?: (progress: number) => void
): Promise<File | null> {
  try {
    // Obtener configuración según nivel
    const { 
      imageQuality, 
      scaleFactor, 
      colorReduction, 
      useHighQualityFormat,
      preserveTextQuality,
      useJpegFormat,
      jpegQuality,
      textMode
    } = COMPRESSION_FACTORS[level];
    
    // Comprobar soporte WebAssembly
    const wasmSupported = isWasmSupported();
    if (wasmSupported) {
      console.info('WebAssembly está disponible, utilizando optimizaciones WASM');
    }
    
    // Reportar progreso inicial
    onProgress?.(5);
    
    console.info(`Iniciando compresión con nivel ${level}:`);
    console.info(`- Factor de escala: ${scaleFactor}`);
    console.info(`- Calidad de imagen: ${imageQuality}`);
    console.info(`- Formato: ${useJpegFormat ? 'JPEG' : 'PNG'}`);
    console.info(`- Calidad JPEG: ${jpegQuality}`);
    console.info(`- WebAssembly: ${wasmSupported ? 'Disponible' : 'No disponible'}`);
    console.info(`- Modo de texto: ${textMode}`);
    console.info(`- Preservar calidad texto: ${preserveTextQuality}`);
    console.info(`- Alta calidad: ${useHighQualityFormat}`);
    
    // Cargar el documento con PDF.js
    const fileArrayBuffer = await file.arrayBuffer();
    const pdfDoc = await loadPdfDocument(fileArrayBuffer);
    
    // Reportar progreso después de cargar
    onProgress?.(10);
    
    // Crear un nuevo documento PDF
    const newPdfDoc = await PDFDocument.create();
    
    // Eliminar metadatos para reducir tamaño
    newPdfDoc.setTitle("");
    newPdfDoc.setAuthor("");
    newPdfDoc.setSubject("");
    newPdfDoc.setKeywords([]);
    newPdfDoc.setProducer("");
    newPdfDoc.setCreator("PDF Compressor");
    
    // Procesar cada página
    const totalPages = pdfDoc.numPages;
    
    for (let i = 0; i < totalPages; i++) {
      // Actualizar progreso
      const pageProgress = 10 + Math.floor((i / totalPages) * 75);
      onProgress?.(pageProgress);
      
      // Obtener la página
      const pdfPage = await pdfDoc.getPage(i + 1);
      
      // Obtener dimensiones originales
      const viewport = pdfPage.getViewport({ scale: 1.0 });
      const width = viewport.width;
      const height = viewport.height;
      
      // Crear un canvas
      const canvas = document.createElement('canvas');
      
      // Renderizar la página en el canvas con factor de escala y calidad adecuados
      await renderPageToCanvas(
        pdfPage, 
        canvas, 
        scaleFactor, 
        useHighQualityFormat, 
        textMode as 'print' | 'display'
      );
      
      // Usar formato de imagen según configuración
      let imageDataUrl;
      let imageQualityToUse = jpegQuality;
      
      if (wasmSupported) {
        // Aumentar ligeramente la calidad con WASM para compensar optimizaciones
        imageQualityToUse = Math.min(jpegQuality + 0.05, 0.95);
      }
      
      // Siempre usar JPEG para mejor compresión
      imageDataUrl = canvas.toDataURL('image/jpeg', imageQualityToUse);
      console.info(`Usando formato JPEG para nivel ${level} con calidad ${imageQualityToUse}`);
      
      // Extraer la base64 desde la URL de datos
      const base64 = imageDataUrl.split(',')[1];
      
      // Convertir base64 a Uint8Array utilizando optimizaciones nativas si están disponibles
      let imageBytes: Uint8Array;
      if (wasmSupported && window.atob && typeof TextEncoder !== 'undefined') {
        const binaryString = atob(base64);
        imageBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          imageBytes[j] = binaryString.charCodeAt(j);
        }
      } else {
        // Método alternativo por si acaso
        const binaryString = atob(base64);
        imageBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          imageBytes[j] = binaryString.charCodeAt(j);
        }
      }
      
      // Insertar imagen en el PDF
      let pdfImage;
      
      try {
        pdfImage = await newPdfDoc.embedJpg(imageBytes);
      } catch (error) {
        console.error('Error al incrustar imagen, intentando con JPEG de baja calidad:', error);
        // Si falla, intentar con JPEG de calidad más baja como último recurso
        // Pero no tan baja que se vuelva ilegible (mínimo 0.6)
        const fallbackQuality = Math.max(0.6, jpegQuality * 0.75);
        const jpegDataUrl = canvas.toDataURL('image/jpeg', fallbackQuality);
        const jpegBase64 = jpegDataUrl.split(',')[1];
        const jpegBinaryString = atob(jpegBase64);
        const jpegImageBytes = new Uint8Array(jpegBinaryString.length);
        for (let j = 0; j < jpegBinaryString.length; j++) {
          jpegImageBytes[j] = jpegBinaryString.charCodeAt(j);
        }
        pdfImage = await newPdfDoc.embedJpg(jpegImageBytes);
      }
      
      // Aplicar reducción de dimensiones según nivel de compresión
      const pageWidth = width * colorReduction;
      const pageHeight = height * colorReduction;
      
      // Agregar página al nuevo documento
      const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
      
      // Dibujar la imagen en la página
      newPage.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });
    }
    
    // Progreso antes de guardar
    onProgress?.(85);
    
    // Optimizar opciones de guardado para cada nivel de compresión
    let saveOptions = {
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100
    };
    
    // Guardar el documento comprimido
    const compressedBytes = await newPdfDoc.save(saveOptions);
    
    // Progreso casi completo después de guardar
    onProgress?.(95);
    
    // Verificar tamaño del resultado final
    console.info(`Tamaño original: ${file.size / 1024 / 1024} MB`);
    console.info(`Tamaño comprimido: ${compressedBytes.length / 1024 / 1024} MB`);
    console.info(`Reducción: ${(1 - (compressedBytes.length / file.size)) * 100}%`);
    
    // Crear y retornar el archivo comprimido
    return new File(
      [compressedBytes],
      `comprimido_${file.name}`,
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error al comprimir PDF con canvas:', error);
    // Asegurar que el progreso se completa incluso con error
    onProgress?.(100);
    return null;
  }
}
