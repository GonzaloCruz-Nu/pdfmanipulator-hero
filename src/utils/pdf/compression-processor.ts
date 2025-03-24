import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { COMPRESSION_FACTORS } from './compression-constants';
import { renderPageToCanvas, loadPdfDocument } from './pdf-renderer';
import { compressImageWithResmush, downloadCompressedImage } from './resmush-service';

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
 * con reSmush.it para niveles bajo y medio
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
      textMode,
      resmushQuality
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
    console.info(`- Calidad reSmush: ${resmushQuality}%`);
    console.info(`- WebAssembly: ${wasmSupported ? 'Disponible' : 'No disponible'}`);
    console.info(`- Modo de texto: ${textMode}`);
    console.info(`- Preservar calidad texto: ${preserveTextQuality}`);
    console.info(`- Alta calidad: ${useHighQualityFormat}`);
    console.info(`- Usando reSmush.it para nivel bajo y medio`);
    
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
      if (level === 'low') {
        // Aumentar la resolución del canvas para mejorar la nitidez
        const resolutionFactor = 3.0; // Aumentamos significativamente para nivel bajo
        canvas.width = width * scaleFactor * resolutionFactor;
        canvas.height = height * scaleFactor * resolutionFactor;
      } else if (level === 'medium') {
        // Para nivel medio, también aumentamos pero un poco menos
        const resolutionFactor = 2.5; // Valor intermedio para nivel medio
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
        level === 'low' ? scaleFactor * 3.0 : level === 'medium' ? scaleFactor * 2.5 : scaleFactor,
        useHighQualityFormat, 
        textMode as 'print' | 'display'
      );
      
      // Obtener imagen del canvas en alta calidad
      let imageDataUrl: string;
      let imageBytes: Uint8Array;
      
      // Para niveles bajo y medio, usar reSmush.it API con diferentes calidades
      if ((level === 'low' || level === 'medium') && totalPages <= 20) {
        try {
          // Usar la calidad específica de reSmush.it según el nivel de compresión
          console.info(`Usando reSmush.it para la página ${i+1}/${totalPages} con calidad ${resmushQuality}%`);
          
          // Obtener blob del canvas en alta calidad
          const canvasBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob(
              (blob) => resolve(blob!), 
              'image/jpeg', 
              level === 'low' ? 0.999 : 0.98
            );
          });
          
          // Comprimir con reSmush.it usando calidad diferenciada
          const compressedImageUrl = await compressImageWithResmush(canvasBlob, resmushQuality);
          imageBytes = await downloadCompressedImage(compressedImageUrl);
          
          console.info(`Página ${i+1} comprimida con reSmush.it correctamente`);
        } catch (error) {
          console.warn(`Error al usar reSmush.it para página ${i+1}, usando método JPEG estándar:`, error);
          
          // Fallback a método estándar
          const jpegQualityToUse = level === 'low' ? 0.95 : 0.90;
          imageDataUrl = canvas.toDataURL('image/jpeg', jpegQualityToUse);
          const base64 = imageDataUrl.split(',')[1];
          const binaryString = atob(base64);
          imageBytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            imageBytes[j] = binaryString.charCodeAt(j);
          }
        }
      } else {
        // Para nivel alto o documentos con muchas páginas, usar método estándar
        // Siempre usar JPEG para comprimir, con calidad adaptada
        const imageQualityToUse = level === 'low' ? 0.95 : level === 'medium' ? 0.85 : jpegQuality;
        imageDataUrl = canvas.toDataURL('image/jpeg', imageQualityToUse);
        
        // Extraer la base64 desde la URL de datos
        const base64 = imageDataUrl.split(',')[1];
        
        // Convertir base64 a Uint8Array utilizando optimizaciones nativas si están disponibles
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
      }
      
      // Insertar imagen en el PDF
      let pdfImage;
      
      try {
        pdfImage = await newPdfDoc.embedJpg(imageBytes);
      } catch (error) {
        console.error('Error al incrustar imagen, intentando con JPEG de baja calidad:', error);
        
        // Mejorar calidad de fallback para niveles bajo y medio
        const fallbackQuality = level === 'low' 
          ? 0.98
          : level === 'medium' 
            ? 0.95
            : 0.80;
          
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
      } else {
        // Para niveles bajo y medio, preservar dimensiones originales completamente
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
    let saveOptions: any = {
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100
    };
    
    // Para niveles de baja compresión, preservar la mayor calidad posible
    if (level === 'low') {
      saveOptions = {
        ...saveOptions,
        compress: false
      };
    }
    
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
