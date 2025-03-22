
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { COMPRESSION_FACTORS } from './compression-constants';
import { renderPageToCanvas, loadPdfDocument } from './pdf-renderer';

// Tipos de compresión
export type CompressionLevel = 'low' | 'medium' | 'high';

// Verificar compatibilidad con WebP
const isWebPSupported = (): boolean => {
  const canvas = document.createElement('canvas');
  if (canvas && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
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
      useWebP,
      webpQuality
    } = COMPRESSION_FACTORS[level];
    
    // Comprobar soporte WebP
    const webpSupported = isWebPSupported() && useWebP;
    
    // Reportar progreso inicial
    onProgress?.(5);
    
    console.info(`Iniciando compresión con nivel ${level}:`);
    console.info(`- Factor de escala: ${scaleFactor}`);
    console.info(`- Calidad de imagen: ${imageQuality}`);
    console.info(`- Formato: ${webpSupported ? 'WebP' : (useJpegFormat ? 'JPEG' : 'PNG')}`);
    console.info(`- Calidad JPEG/WebP: ${webpSupported ? webpQuality : jpegQuality}`);
    
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
      await renderPageToCanvas(pdfPage, canvas, scaleFactor, preserveTextQuality);
      
      // Seleccionar formato según configuración y soporte
      let imageDataUrl: string;
      
      if (webpSupported) {
        // Usar WebP para mejor compresión cuando esté disponible y configurado
        imageDataUrl = canvas.toDataURL('image/webp', webpQuality);
        console.info(`Usando formato WebP para nivel ${level} con calidad ${webpQuality}`);
      } else if (useJpegFormat) {
        // Usar JPEG como formato preferido para compresión
        imageDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        console.info(`Usando formato JPEG para nivel ${level} con calidad ${jpegQuality}`);
      } else {
        // Fallback a PNG si se requiere (aunque generalmente no se usará)
        imageDataUrl = canvas.toDataURL('image/png');
        console.info(`Usando formato PNG para nivel ${level}`);
      }
      
      // Extraer la base64 desde la URL de datos
      const base64 = imageDataUrl.split(',')[1];
      
      // Convertir base64 a Uint8Array
      const binaryString = atob(base64);
      const imageBytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        imageBytes[j] = binaryString.charCodeAt(j);
      }
      
      // Insertar imagen en el PDF según formato
      let pdfImage;
      
      try {
        if (webpSupported || useJpegFormat) {
          pdfImage = await newPdfDoc.embedJpg(imageBytes);
        } else {
          pdfImage = await newPdfDoc.embedPng(imageBytes);
        }
      } catch (error) {
        console.error('Error al incrustar imagen, intentando con JPEG de baja calidad:', error);
        // Si falla, intentar con JPEG de calidad más baja como último recurso
        const fallbackQuality = 0.5;
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
    let saveOptions;
    
    if (level === 'high') {
      // Máxima compresión para nivel alto
      saveOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100,
        // Comprimir más agresivamente
        compress: true
      };
    } else {
      // Balance para niveles bajo y medio
      saveOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100
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
