
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { COMPRESSION_FACTORS } from './compression-constants';
import { renderPageToCanvas, loadPdfDocument } from './pdf-renderer';
import { 
  compressImageWithResmush, 
  downloadCompressedImage,
  compressImageLocally,
  ResmushOptions 
} from './resmush-service';

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
 * con reSmush.it para todos los niveles de compresión
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
    
    // Determinar si usar reSmush.it basado en nivel y número de páginas
    const useResmush = (level === 'low' || level === 'medium' || (level === 'high' && totalPages <= 10));
    
    if (useResmush) {
      console.info(`Usando API reSmush.it para compresión de imágenes (${totalPages} páginas)`);
    } else {
      console.info(`Usando compresión local para ${totalPages} páginas`);
    }
    
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
      
      // Ajustar resolución según nivel de compresión
      let resolutionFactor = 1.0;
      
      if (level === 'low') {
        resolutionFactor = 3.0; // Alta resolución para nivel bajo
      } else if (level === 'medium') {
        resolutionFactor = 2.0; // Resolución media para nivel medio
      } else {
        resolutionFactor = 1.5; // Resolución reducida para nivel alto
      }
      
      canvas.width = width * scaleFactor * resolutionFactor;
      canvas.height = height * scaleFactor * resolutionFactor;
      
      // Renderizar la página en el canvas con factor de escala y calidad adecuados
      await renderPageToCanvas(
        pdfPage, 
        canvas, 
        scaleFactor * resolutionFactor,
        useHighQualityFormat, 
        textMode as 'print' | 'display'
      );
      
      // Obtener imagen del canvas en alta calidad
      let imageBytes: Uint8Array;
      
      if (useResmush) {
        try {
          console.info(`Comprimiendo página ${i+1}/${totalPages} con reSmush.it (qlty=${resmushQuality}%)`);
          
          // Obtener blob del canvas en alta calidad
          const canvasBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob(
              (blob) => resolve(blob!), 
              'image/jpeg', 
              level === 'low' ? 0.98 : level === 'medium' ? 0.95 : 0.92
            );
          });
          
          // Opciones para reSmush.it
          const resmushOptions: ResmushOptions = {
            quality: resmushQuality,
            exif: true,
            timeout: 60000 // 60 segundos de timeout
          };
          
          // Comprimir con reSmush.it
          const compressedImageUrl = await compressImageWithResmush(canvasBlob, resmushOptions);
          imageBytes = await downloadCompressedImage(compressedImageUrl);
          
          console.info(`Página ${i+1} comprimida con reSmush.it correctamente`);
        } catch (error) {
          console.warn(`Error al usar reSmush.it para página ${i+1}, usando compresión local:`, error);
          
          // Fallback a compresión local
          const jpegQualityToUse = level === 'low' ? 0.9 : level === 'medium' ? 0.8 : 0.7;
          const compressedBlob = await compressImageLocally(canvas, jpegQualityToUse);
          imageBytes = new Uint8Array(await compressedBlob.arrayBuffer());
          
          console.info(`Página ${i+1} comprimida localmente con calidad ${jpegQualityToUse}`);
        }
      } else {
        // Para documentos con muchas páginas, usar método local
        const jpegQualityToUse = level === 'low' ? 0.9 : level === 'medium' ? 0.8 : 0.6;
        const compressedBlob = await compressImageLocally(canvas, jpegQualityToUse);
        imageBytes = new Uint8Array(await compressedBlob.arrayBuffer());
        
        console.info(`Página ${i+1} comprimida localmente con calidad ${jpegQualityToUse}`);
      }
      
      // Insertar imagen en el PDF
      let pdfImage;
      
      try {
        pdfImage = await newPdfDoc.embedJpg(imageBytes);
      } catch (error) {
        console.error('Error al incrustar imagen, intentando con JPEG de baja calidad:', error);
        
        // Fallback a calidad más baja
        const fallbackQuality = level === 'low' ? 0.85 : level === 'medium' ? 0.7 : 0.5;
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
        // Para niveles bajo y medio, preservar dimensiones originales
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
