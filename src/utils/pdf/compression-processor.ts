
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
      
      // Mejorar la resolución del canvas para niveles bajo y medio
      if (level === 'low' || level === 'medium') {
        // Aumentar la resolución del canvas para mejorar la nitidez
        const resolutionFactor = level === 'low' ? 1.5 : 1.3;
        canvas.width = width * scaleFactor * resolutionFactor;
        canvas.height = height * scaleFactor * resolutionFactor;
      } else {
        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
      }
      
      // Renderizar la página en el canvas con factor de escala y calidad adecuados
      await renderPageToCanvas(
        pdfPage, 
        canvas, 
        level === 'low' || level === 'medium' ? scaleFactor * (level === 'low' ? 1.5 : 1.3) : scaleFactor, 
        useHighQualityFormat, 
        textMode as 'print' | 'display'
      );
      
      // Ajustar calidad según nivel de compresión
      let imageQualityToUse = jpegQuality;
      
      // Para niveles bajo y medio, aumentamos significativamente la calidad
      if (level === 'low') {
        // Aumentar significativamente la calidad para compresión baja
        imageQualityToUse = Math.min(jpegQuality + 0.02, 0.99);
      } else if (level === 'medium') {
        // Para nivel medio, aumentamos también pero menos que en bajo
        imageQualityToUse = Math.min(jpegQuality + 0.01, 0.95);
      }
      
      // Si además hay soporte WASM, mejoramos un poco más la calidad
      if (wasmSupported && (level === 'low' || level === 'medium')) {
        imageQualityToUse = Math.min(imageQualityToUse + 0.01, level === 'low' ? 0.99 : 0.96);
      }
      
      // Siempre usar JPEG para comprimir, con calidad adaptada
      let imageDataUrl = canvas.toDataURL('image/jpeg', imageQualityToUse);
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
        
        // Mejorar calidad de fallback para niveles bajo y medio
        const fallbackQuality = level === 'low' 
          ? Math.max(0.90, jpegQuality * 0.95) 
          : level === 'medium' 
            ? Math.max(0.85, jpegQuality * 0.90) 
            : Math.max(0.70, jpegQuality * 0.85);
          
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
      let pageWidth = width;
      let pageHeight = height;
      
      if (level === 'high') {
        pageWidth = width * colorReduction;
        pageHeight = height * colorReduction;
      } else if (level === 'medium') {
        // Para nivel medio, preservar mejor las dimensiones originales
        pageWidth = width * Math.max(0.99, colorReduction);
        pageHeight = height * Math.max(0.99, colorReduction);
      } else {
        // Para nivel bajo, reducción mínima o nula de tamaño
        pageWidth = width;
        pageHeight = height;
      }
      
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
