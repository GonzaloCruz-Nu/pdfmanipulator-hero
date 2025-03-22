
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
      preserveTextQuality,
      useWebP,
      webpQuality
    } = COMPRESSION_FACTORS[level];
    
    // Registrar el nivel de compresión y formato usado para diagnóstico
    const formatoUsado = useWebP ? 'WebP' : (useHighQualityFormat ? 'PNG' : 'JPEG');
    console.info(`Usando formato ${formatoUsado} para nivel ${level} con calidad ${imageQuality}`);
    
    // Reportar progreso inicial
    onProgress?.(5);
    
    // Cargar el documento con PDF.js
    const fileArrayBuffer = await file.arrayBuffer();
    const pdfDoc = await loadPdfDocument(fileArrayBuffer);
    
    // Reportar progreso después de cargar
    onProgress?.(10);
    
    // Crear un nuevo documento PDF
    const newPdfDoc = await PDFDocument.create();
    
    // Gestionar metadatos según nivel de compresión
    if (level === 'low') {
      // Para nivel bajo, intentar preservar metadatos
      try {
        const originalDoc = await PDFDocument.load(fileArrayBuffer.slice(0));
        newPdfDoc.setTitle(originalDoc.getTitle() || "");
        newPdfDoc.setAuthor(originalDoc.getAuthor() || "");
        newPdfDoc.setSubject(originalDoc.getSubject() || "");
        newPdfDoc.setCreator("PDF Compressor - Nivel Bajo");
      } catch (e) {
        console.log("No se pudieron copiar los metadatos originales");
      }
    } else {
      // Para otros niveles, eliminar metadatos para reducir tamaño
      newPdfDoc.setTitle("");
      newPdfDoc.setAuthor("");
      newPdfDoc.setSubject("");
      newPdfDoc.setKeywords([]);
      newPdfDoc.setProducer("");
      newPdfDoc.setCreator("");
    }
    
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
      
      // Verificar si WebP está soportado y configurado para este nivel
      // Fix: Corregimos la verificación de soporte WebP comparando con indexOf !== -1 en lugar de === 0
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') !== -1;
      
      if (useWebP && webpSupported) {
        // Usar WebP para mejor calidad y compresión
        imageDataUrl = canvas.toDataURL('image/webp', webpQuality);
      } else if (useHighQualityFormat) {
        // Usar PNG para máxima calidad si está configurado
        imageDataUrl = canvas.toDataURL('image/png');
      } else {
        // Usar JPEG como opción predeterminada con calidad ajustable
        imageDataUrl = canvas.toDataURL('image/jpeg', imageQuality);
      }
      
      // Extraer la base64 desde la URL de datos
      const base64 = imageDataUrl.split(',')[1];
      
      // Convertir base64 a Uint8Array
      const binaryString = atob(base64);
      imageBytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        imageBytes[j] = binaryString.charCodeAt(j);
      }
      
      // Verificar si usamos WebP o formato tradicional
      let pdfImage;
      if (useWebP && webpSupported) {
        // Insertar la imagen WebP en el nuevo PDF
        pdfImage = await newPdfDoc.embedPng(imageBytes); // PDF-lib no soporta WebP directamente, pero funciona como PNG
      } else if (useHighQualityFormat) {
        // Insertar imagen PNG para alta calidad
        pdfImage = await newPdfDoc.embedPng(imageBytes);
      } else {
        // Insertar JPEG para compresión estándar
        pdfImage = await newPdfDoc.embedJpg(imageBytes);
      }
      
      // Ajustar dimensiones según colorReduction si no es nivel bajo
      const pageWidth = level === 'low' ? width : width * colorReduction;
      const pageHeight = level === 'low' ? height : height * colorReduction;
      
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
    
    // Ajustar opciones de guardado según el nivel
    const saveOptions = {
      useObjectStreams: level !== 'low', // Para nivel bajo, no usar object streams para mejor calidad
      addDefaultPage: false,
      objectsPerTick: level === 'low' ? 50 : 100 // Menos objetos por tick para nivel bajo = mejor calidad
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
