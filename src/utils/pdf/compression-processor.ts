
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { COMPRESSION_FACTORS } from './compression-constants';
import { renderPageToCanvas, loadPdfDocument } from './pdf-renderer';

// Tipos de compresión
export type CompressionLevel = 'low' | 'medium' | 'high';

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
      preserveTextQuality
    } = COMPRESSION_FACTORS[level];
    
    // Reportar progreso inicial
    onProgress?.(5);
    
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
      
      // Determinar el formato de imagen a utilizar según configuración
      let imageDataUrl: string;
      let imageBytes: Uint8Array;
      
      // Elección clara del formato de imagen según nivel
      if (level === 'high') {
        // Para nivel alto, usar JPEG para máxima compresión
        imageDataUrl = canvas.toDataURL('image/jpeg', imageQuality);
        console.info(`Usando formato JPEG para nivel alto con calidad ${imageQuality}`);
      } else {
        // Para niveles bajo y medio, intentar primero con JPEG de alta calidad
        // para mejor compromiso entre calidad y compresión
        imageDataUrl = canvas.toDataURL('image/jpeg', imageQuality);
        console.info(`Usando formato JPEG para nivel ${level} con calidad ${imageQuality}`);
      }
      
      // Extraer la base64 desde la URL de datos
      const base64 = imageDataUrl.split(',')[1];
      
      // Convertir base64 a Uint8Array
      const binaryString = atob(base64);
      imageBytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        imageBytes[j] = binaryString.charCodeAt(j);
      }
      
      // Insertar imagen en el PDF según formato
      let pdfImage;
      try {
        // Usar siempre JPEG para mejor compresión en todos los niveles
        pdfImage = await newPdfDoc.embedJpg(imageBytes);
      } catch (error) {
        console.error('Error al incrustar JPEG, intentando con calidad reducida:', error);
        // Si falla, intentar con JPEG de calidad más baja como plan B
        const fallbackQuality = level === 'high' ? 0.5 : 0.7;
        imageDataUrl = canvas.toDataURL('image/jpeg', fallbackQuality);
        const base64Fallback = imageDataUrl.split(',')[1];
        const binaryStringFallback = atob(base64Fallback);
        const imageBytesFallback = new Uint8Array(binaryStringFallback.length);
        for (let j = 0; j < binaryStringFallback.length; j++) {
          imageBytesFallback[j] = binaryStringFallback.charCodeAt(j);
        }
        pdfImage = await newPdfDoc.embedJpg(imageBytesFallback);
      }
      
      // Aplicar reducción de dimensiones según nivel de compresión
      const pageWidth = width * (level === 'low' ? 1 : colorReduction);
      const pageHeight = height * (level === 'low' ? 1 : colorReduction);
      
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
    
    // Ajustar opciones de guardado para optimizar compresión
    const saveOptions = {
      useObjectStreams: true, // Usar object streams para mejor compresión
      addDefaultPage: false,
      objectsPerTick: 100
    };
    
    // Guardar el documento comprimido con opciones óptimas
    const compressedBytes = await newPdfDoc.save(saveOptions);
    
    // Progreso casi completo después de guardar
    onProgress?.(95);
    
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
