
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
      jpegQuality,
      maximumDimension
    } = COMPRESSION_FACTORS[compressionLevel];
    
    // Reportar inicio de procesamiento
    progressCallback(5);
    console.info(`Iniciando compresión de PDF con nivel ${compressionLevel} - Archivo: ${file.name} (${Math.round(file.size/1024)} KB)`);
    
    // Cargar el archivo como ArrayBuffer
    const fileArrayBuffer = await file.arrayBuffer();
    
    try {
      // Cargar el documento PDF
      const pdfDoc = await loadPdfDocumentFromArray(fileArrayBuffer);
      const numPages = pdfDoc.numPages;
      
      console.info(`PDF cargado. Número de páginas: ${numPages}`);
      
      // Crear nuevo documento PDF con pdf-lib
      const newPdfDoc = await PDFDocument.create();
      
      // Procesar cada página aplicando el nivel de compresión correspondiente
      for (let i = 0; i < numPages; i++) {
        // Calcular y reportar progreso
        const pageProgress = 10 + Math.floor((i / numPages) * 80);
        progressCallback(pageProgress);
        
        console.info(`Procesando página ${i + 1}/${numPages} con nivel de compresión ${compressionLevel}`);
        
        try {
          // Obtener página actual
          const page = await pdfDoc.getPage(i + 1);
          
          // Crear canvas para renderizar la página
          const canvas = document.createElement('canvas');
          
          // Obtener dimensiones originales de la página
          const { width, height } = page.getViewport({ scale: 1.0 });
          
          // Calcular factor de escala basado en la dimensión máxima permitida
          let dynamicScaleFactor = scaleFactor;
          const maxDimension = Math.max(width, height);
          
          if (maxDimension * scaleFactor > maximumDimension) {
            dynamicScaleFactor = maximumDimension / maxDimension;
            console.info(`Ajustando factor de escala a ${dynamicScaleFactor} para respetar dimensión máxima ${maximumDimension}`);
          }
          
          // Aseguramos que textMode sea del tipo correcto ('print' | 'display')
          const renderTextMode = textMode === 'print' ? 'print' : 'display';
          
          await renderPageToCanvasWithOptions(
            page,
            canvas,
            dynamicScaleFactor,
            compressionLevel !== 'high', // Usar alta calidad solo para niveles bajo y medio
            renderTextMode
          );
          
          // Calcular calidad de JPEG según nivel de compresión
          // Aplicamos más reducción para páginas grandes
          let adjustedJpegQuality = jpegQuality;
          if (maxDimension > 1200 && compressionLevel === 'high') {
            adjustedJpegQuality = Math.max(0.50, jpegQuality - 0.15);
          } else if (maxDimension > 2000 && compressionLevel !== 'low') {
            adjustedJpegQuality = Math.max(0.60, jpegQuality - 0.10);
          }
          
          // Obtener data URL directamente del canvas 
          const dataUrl = canvas.toDataURL('image/jpeg', adjustedJpegQuality);
          
          // Convertir data URL a ArrayBuffer
          const response = await fetch(dataUrl);
          const imageArrayBuffer = await response.arrayBuffer();
          
          try {
            // Incrustar la imagen en el nuevo PDF
            const jpgImage = await newPdfDoc.embedJpg(new Uint8Array(imageArrayBuffer));
            
            // Añadir nueva página con las dimensiones originales
            const newPage = newPdfDoc.addPage([width, height]);
            
            // Dibujar la imagen comprimida en la nueva página
            newPage.drawImage(jpgImage, {
              x: 0,
              y: 0,
              width: width,
              height: height,
            });
          } catch (embedError) {
            console.error(`Error incrustando imagen para página ${i+1}:`, embedError);
            
            // Si falla, intentar con calidad más baja como último recurso
            const fallbackQuality = compressionLevel === 'high' ? 0.4 : 
                                   compressionLevel === 'medium' ? 0.5 : 0.6;
            const fallbackDataUrl = canvas.toDataURL('image/jpeg', fallbackQuality);
            const fallbackResponse = await fetch(fallbackDataUrl);
            const fallbackImageBuffer = await fallbackResponse.arrayBuffer();
            
            // Incrustar con calidad reducida como último recurso
            const fallbackJpgImage = await newPdfDoc.embedJpg(new Uint8Array(fallbackImageBuffer));
            const newPage = newPdfDoc.addPage([width, height]);
            newPage.drawImage(fallbackJpgImage, {
              x: 0,
              y: 0,
              width: width,
              height: height,
            });
          }
        } catch (pageError) {
          console.error(`Error procesando página ${i+1}:`, pageError);
          // Continuar con la siguiente página en caso de error
          continue;
        }
      }
      
      // Si no se procesó ninguna página correctamente, devolver null
      if (newPdfDoc.getPageCount() === 0) {
        console.error("No se pudo procesar ninguna página correctamente");
        return null;
      }
      
      // Guardar el documento comprimido con opciones optimizadas según nivel
      progressCallback(95);
      console.info("Guardando documento comprimido con opciones optimizadas...");
      
      const compressedPdfBytes = await newPdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        // Ajustar la cantidad de objetos por tick según nivel de compresión
        objectsPerTick: compressionLevel === 'high' ? 30 : 
                       compressionLevel === 'medium' ? 50 : 100
      });
      
      // Crear nuevo archivo con el PDF comprimido
      const compressedFileName = file.name.replace('.pdf', '_comprimido.pdf');
      const compressedFile = new File([compressedPdfBytes], compressedFileName, {
        type: 'application/pdf',
        lastModified: new Date().getTime(),
      });
      
      // Verificar que el archivo comprimido sea realmente más pequeño
      // Si con nivel "high" sigue siendo más grande, intentar con compresión extrema
      if (compressedFile.size > file.size * 1.05 && compressionLevel === 'high') {
        console.warn(`Compresión estándar resultó en un archivo más grande (${(compressedFile.size/1024/1024).toFixed(2)} MB vs ${(file.size/1024/1024).toFixed(2)} MB). Intentando compresión extrema...`);
        
        // Intentamos escala mucho más reducida y menor calidad
        const extremeCompressionCanvas = document.createElement('canvas');
        const extremeScaleFactor = 0.4; // Factor de escala extremadamente reducido
        const extremeQuality = 0.35; // Calidad muy baja
        
        // Crear un nuevo documento PDF para la compresión extrema
        const extremeDoc = await PDFDocument.create();
        
        for (let i = 0; i < numPages; i++) {
          try {
            const page = await pdfDoc.getPage(i + 1);
            const { width, height } = page.getViewport({ scale: 1.0 });
            
            await renderPageToCanvasWithOptions(
              page,
              extremeCompressionCanvas,
              extremeScaleFactor,
              false, // No usar alta calidad
              'display' // Modo display para mejor compresión
            );
            
            // Comprimir a JPEG con calidad muy baja
            const extremeDataUrl = extremeCompressionCanvas.toDataURL('image/jpeg', extremeQuality);
            const extremeResponse = await fetch(extremeDataUrl);
            const extremeBuffer = await extremeResponse.arrayBuffer();
            
            // Incrustar y añadir página
            const extremeJpg = await extremeDoc.embedJpg(new Uint8Array(extremeBuffer));
            const newPage = extremeDoc.addPage([width, height]);
            newPage.drawImage(extremeJpg, {
              x: 0,
              y: 0,
              width: width,
              height: height,
            });
          } catch (error) {
            console.error(`Error en compresión extrema página ${i+1}:`, error);
            continue;
          }
        }
        
        // Guardar con compresión máxima
        const extremeBytes = await extremeDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 20
        });
        
        const extremeFile = new File([extremeBytes], compressedFileName, {
          type: 'application/pdf',
          lastModified: new Date().getTime(),
        });
        
        // Si el archivo con compresión extrema es más pequeño, usarlo
        if (extremeFile.size < compressedFile.size) {
          console.info(`Compresión extrema exitosa: ${(extremeFile.size/1024/1024).toFixed(2)} MB (vs original ${(file.size/1024/1024).toFixed(2)} MB)`);
          return extremeFile;
        }
      }
      
      // Si el archivo sigue siendo significativamente más grande con cualquier nivel, advertir pero devolver el original
      if (compressionLevel === 'high' && compressedFile.size > file.size * 1.5) {
        console.warn(`¡ATENCIÓN! El archivo comprimido es MUCHO más grande que el original. Devolviendo el original.`);
        return new File(
          [fileArrayBuffer],
          `${file.name.replace('.pdf', '')}_original.pdf`,
          { type: 'application/pdf' }
        );
      }
      
      // Reportar finalización y estadísticas
      progressCallback(100);
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(2);
      
      console.info(`Compresión completada: ${originalSize} MB -> ${compressedSize} MB (${compressionRatio}% reducción)`);
      
      return compressedFile;
    } catch (pdfError) {
      console.error('Error al procesar el PDF:', pdfError);
      
      // FALLBACK DE EMERGENCIA: Si todo falló, devolver una copia del original
      return new File(
        [fileArrayBuffer],
        `${file.name.replace('.pdf', '')}_original.pdf`,
        { type: 'application/pdf' }
      );
    }
  } catch (error) {
    console.error('Error general al comprimir PDF:', error);
    return null;
  }
}
