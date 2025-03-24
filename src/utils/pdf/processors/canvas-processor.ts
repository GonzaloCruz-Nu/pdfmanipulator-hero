
import { PDFDocument } from 'pdf-lib';
import { COMPRESSION_FACTORS } from '../compression-constants';
import { renderPageToCanvasWithOptions, loadPdfDocumentFromArray } from './render-utils';
import { compressCanvasImage, getArrayBufferFromImageUrl, checkReSmushAvailability } from './image-compression-utils';
import type { CompressionLevel } from '../compression-types';

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
    // Obtener configuración de compresión según nivel
    const {
      imageQuality,
      scaleFactor,
      useHighQualityFormat,
      preserveTextQuality,
      textMode,
      resmushQuality,
      jpegQuality
    } = COMPRESSION_FACTORS[compressionLevel];
    
    // Forzar calidad extrema para niveles bajo y medio
    const isHighQualityMode = compressionLevel === 'low' || compressionLevel === 'medium';
    
    // Reportar inicio de procesamiento
    progressCallback(5);
    console.info(`Iniciando compresión de PDF con nivel ${compressionLevel} - Archivo: ${file.name} (${Math.round(file.size/1024)} KB)`);
    
    // Verificar tamaño del archivo para procesos especiales
    const fileSize = file.size;
    const isLargeFile = fileSize > 10 * 1024 * 1024; // 10 MB
    
    // Cargar el archivo como ArrayBuffer
    const fileArrayBuffer = await file.arrayBuffer();
    
    // Cargar el documento PDF con configuración de alta calidad
    const pdfDoc = await loadPdfDocumentFromArray(fileArrayBuffer);
    const numPages = pdfDoc.numPages;
    
    console.info(`PDF cargado. Número de páginas: ${numPages}`);
    
    // Crear nuevo documento PDF con pdf-lib
    const newPdfDoc = await PDFDocument.create();
    
    // Verificar si debemos usar reSmush.it - ahora con más tiempo para conexión
    const resmushTimeout = isLargeFile ? 15000 : 10000; // Más tiempo para verificar conexión
    let resmushAvailable = false;
    
    // Varios intentos para conectar con reSmush
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        resmushAvailable = await checkReSmushAvailability(resmushTimeout);
        if (resmushAvailable) {
          console.info('✅ Conexión exitosa con la API de reSmush.it. Se usará para optimización de imágenes.');
          break;
        } else {
          console.warn(`⚠️ Intento ${attempt}/3: No se pudo conectar con la API de reSmush.it.`);
        }
      } catch (error) {
        console.warn(`⚠️ Intento ${attempt}/3: Error al conectar con reSmush.it: ${error}`);
      }
      
      // Pequeña pausa entre intentos
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!resmushAvailable) {
      console.warn('⚠️ No se pudo conectar con la API de reSmush.it después de varios intentos. Se usará compresión local de alta calidad.');
    }
    
    // Procesar cada página con máxima calidad de renderizado
    for (let i = 0; i < numPages; i++) {
      // Calcular y reportar progreso
      const pageProgress = 10 + Math.floor((i / numPages) * 80);
      progressCallback(pageProgress);
      
      console.info(`Procesando página ${i + 1}/${numPages} con configuración de ${isHighQualityMode ? 'extrema' : 'alta'} calidad`);
      
      // Obtener página actual
      const page = await pdfDoc.getPage(i + 1);
      
      // Crear canvas para renderizar la página
      const canvas = document.createElement('canvas');
      
      // Usar configuración de alta calidad para niveles bajo y medio, y también mejorada para nivel alto
      const useHighQuality = isHighQualityMode || preserveTextQuality;
      
      // Usar un factor de escala adicional para asegurar máxima nitidez en niveles bajo y medio
      const adjustedScaleFactor = isHighQualityMode ? 
                                 Math.max(scaleFactor, compressionLevel === 'low' ? 3.0 : 2.5) : 
                                 scaleFactor;
      
      // Renderizar página en el canvas con configuraciones de calidad optimizadas
      await renderPageToCanvasWithOptions(
        page,
        canvas,
        adjustedScaleFactor,
        useHighQuality, 
        preserveTextQuality ? 'print' : 'display'
      );
      
      // Determinar si debemos usar reSmush según disponibilidad y nivel de compresión
      // Para nivel bajo y medio intentar usar reSmush si está disponible, pero siempre con calidad ultra alta
      const useResmush = resmushAvailable && 
                        (compressionLevel === 'low' || compressionLevel === 'medium');
      
      // Comprimir imagen del canvas con la mejor calidad posible
      let compressedImageUrl;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          // Usar calidad extremadamente alta para niveles bajos y medios
          let adjustedResmushQuality;
          if (compressionLevel === 'low') {
            adjustedResmushQuality = 100; // Sin compresión para nivel bajo
          } else if (compressionLevel === 'medium') {
            adjustedResmushQuality = 98; // Compresión mínima para nivel medio
          } else {
            adjustedResmushQuality = resmushQuality;
          }
          
          // Usar calidad extrema para compresión local en niveles bajo y medio
          let adjustedLocalQuality;
          if (compressionLevel === 'low') {
            adjustedLocalQuality = 0.999; // Prácticamente sin pérdida para nivel bajo
          } else if (compressionLevel === 'medium') {
            adjustedLocalQuality = 0.995; // Calidad extrema para nivel medio
          } else {
            adjustedLocalQuality = jpegQuality;
          }
          
          // Para niveles bajo y medio, intentamos primero con compresión local de alta calidad
          if (isHighQualityMode && attempts === 0) {
            // Usar directamente toDataURL con máxima calidad para asegurar nitidez
            compressedImageUrl = canvas.toDataURL('image/jpeg', adjustedLocalQuality);
            break;
          } else {
            compressedImageUrl = await compressCanvasImage(
              canvas,
              i,
              useResmush && attempts === 0, // Intentar reSmush en el primer intento
              adjustedResmushQuality,
              adjustedLocalQuality
            );
          }
          
          // Si llegamos aquí, la compresión fue exitosa
          break;
        } catch (error) {
          console.warn(`Error al comprimir imagen de página ${i+1} (intento ${attempts+1}/${maxAttempts}): ${error}`);
          attempts++;
          
          // En el último intento, usar calidad extrema sin reSmush
          if (attempts === maxAttempts - 1) {
            if (isHighQualityMode) {
              compressedImageUrl = canvas.toDataURL('image/jpeg', 0.999); // Calidad prácticamente perfecta para niveles bajo/medio
            } else {
              compressedImageUrl = canvas.toDataURL('image/jpeg', 0.98); // Calidad muy alta para nivel alto
            }
          }
        }
      }
      
      // Si todos los intentos fallaron, usar la imagen original a calidad casi perfecta
      if (!compressedImageUrl) {
        console.warn(`Todos los intentos de compresión fallaron para la página ${i+1}. Usando imagen original de máxima calidad.`);
        compressedImageUrl = canvas.toDataURL('image/jpeg', 0.999);
      }
      
      // Convertir imagen comprimida a ArrayBuffer
      let compressedImageArrayBuffer;
      try {
        compressedImageArrayBuffer = await getArrayBufferFromImageUrl(compressedImageUrl);
      } catch (error) {
        console.warn(`Error al procesar imagen comprimida: ${error}. Usando imagen original de alta calidad.`);
        // Último fallback: usar la imagen a máxima calidad
        compressedImageUrl = canvas.toDataURL('image/jpeg', 0.999);
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
    
    // Guardar el documento comprimido con opciones optimizadas
    progressCallback(95);
    console.info("Guardando documento comprimido con opciones optimizadas...");
    
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
    
    // Reportar finalización y estadísticas
    progressCallback(100);
    const originalSize = (file.size / 1024).toFixed(2);
    const compressedSize = (compressedFile.size / 1024).toFixed(2);
    const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(2);
    
    console.info(`Compresión completada: ${originalSize} KB -> ${compressedSize} KB (${compressionRatio}% reducción)`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir PDF:', error);
    return null;
  }
}
