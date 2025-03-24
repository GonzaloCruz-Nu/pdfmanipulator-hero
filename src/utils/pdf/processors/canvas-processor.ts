
import { PDFDocument } from 'pdf-lib';
import { COMPRESSION_FACTORS } from '../compression-constants';
import { renderPageToCanvasWithOptions, loadPdfDocumentFromArray } from './render-utils';
import { compressCanvasImage, getArrayBufferFromImageUrl, checkReSmushAvailability } from './image-compression-utils';
import type { CompressionLevel } from '../compression-types';

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
    
    // Cargar el documento PDF
    const pdfDoc = await loadPdfDocumentFromArray(fileArrayBuffer);
    const numPages = pdfDoc.numPages;
    
    // Crear nuevo documento PDF con pdf-lib
    const newPdfDoc = await PDFDocument.create();
    
    // Verificar la conexión con la API de reSmush.it
    const resmushAvailable = await checkReSmushAvailability(5000);
    if (resmushAvailable) {
      console.info('Conexión exitosa con la API de reSmush.it. Se usará para optimización de imágenes.');
    } else {
      console.warn('No se pudo conectar con la API de reSmush.it. Se usará compresión local.');
    }
    
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
      await renderPageToCanvasWithOptions(
        page,
        canvas,
        scaleFactor,
        useHighQualityFormat,
        preserveTextQuality ? 'print' : 'display'
      );
      
      // Comprimir la imagen del canvas
      let compressedImageUrl;
      
      // Determinar si debemos usar reSmush según disponibilidad y nivel de compresión
      const useResmush = resmushAvailable && compressionLevel !== 'low';
      
      // Comprimir imagen del canvas
      try {
        compressedImageUrl = await compressCanvasImage(
          canvas,
          i,
          useResmush,
          resmushQuality,
          imageQuality
        );
      } catch (error) {
        console.warn(`Error al comprimir imagen de página ${i+1}: ${error}. Usando imagen original.`);
        // Fallback a compresión local básica si todo falla
        compressedImageUrl = canvas.toDataURL('image/jpeg', imageQuality);
      }
      
      // Convertir imagen comprimida a ArrayBuffer
      let compressedImageArrayBuffer;
      try {
        compressedImageArrayBuffer = await getArrayBufferFromImageUrl(compressedImageUrl);
      } catch (error) {
        console.warn(`Error al procesar imagen comprimida: ${error}. Usando imagen original.`);
        // Último fallback: usar la imagen sin comprimir
        compressedImageUrl = canvas.toDataURL('image/jpeg', imageQuality);
        const base64 = compressedImageUrl.split(',')[1];
        compressedImageArrayBuffer = Buffer.from(base64, 'base64');
      }
      
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
    const compressedPdfBytes = await newPdfDoc.save({
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
    console.info(`Compresión completada: ${file.size} bytes -> ${compressedFile.size} bytes`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir PDF:', error);
    return null;
  }
}
