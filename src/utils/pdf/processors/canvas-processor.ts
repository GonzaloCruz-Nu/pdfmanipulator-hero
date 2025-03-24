
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
    
    // Guardar una copia del archivo original para casos de fallback
    const originalFileBuffer = await file.arrayBuffer();
    
    // Reportar inicio de procesamiento
    progressCallback(5);
    console.info(`Iniciando compresión de PDF con nivel ${compressionLevel} - Archivo: ${file.name} (${Math.round(file.size/1024)} KB)`);
    
    // Verificar que el archivo no esté vacío
    if (file.size === 0) {
      console.error('Archivo PDF vacío');
      throw new Error('Archivo PDF vacío');
    }
    
    try {
      // Cargar el documento PDF
      const pdfDoc = await loadPdfDocumentFromArray(originalFileBuffer);
      if (!pdfDoc) {
        throw new Error('No se pudo cargar el documento PDF');
      }
      
      const numPages = pdfDoc.numPages;
      if (numPages === 0) {
        throw new Error('El PDF no contiene páginas');
      }
      
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
            console.info(`Ajustando factor de escala a ${dynamicScaleFactor.toFixed(2)} para respetar dimensión máxima ${maximumDimension}`);
          }
          
          // Aseguramos que el canvas tenga dimensiones razonables
          if (width * dynamicScaleFactor < 10 || height * dynamicScaleFactor < 10) {
            console.warn('Dimensiones de canvas demasiado pequeñas, ajustando a mínimo');
            dynamicScaleFactor = Math.max(dynamicScaleFactor, 10 / Math.min(width, height));
          }
          
          // Aseguramos que textMode sea del tipo correcto ('print' | 'display')
          const renderTextMode = textMode === 'print' ? 'print' : 'display';
          
          // Renderizar página al canvas con las opciones configuradas
          await renderPageToCanvasWithOptions(
            page,
            canvas,
            dynamicScaleFactor,
            compressionLevel !== 'high', // Usar alta calidad solo para niveles bajo y medio
            renderTextMode
          );
          
          // Calcular calidad de JPEG según nivel de compresión y tamaño de página
          let adjustedJpegQuality = jpegQuality;
          
          // Ajustes de calidad según el nivel y tamaño
          if (compressionLevel === 'high') {
            // Para alta compresión, reducir más agresivamente según tamaño
            if (maxDimension > 1200) {
              adjustedJpegQuality = Math.max(0.40, jpegQuality - 0.10);
            } else if (maxDimension > 800) {
              adjustedJpegQuality = Math.max(0.45, jpegQuality - 0.05);
            }
          } else if (compressionLevel === 'medium') {
            // Para compresión media, reducir moderadamente según tamaño
            if (maxDimension > 1500) {
              adjustedJpegQuality = Math.max(0.60, jpegQuality - 0.10);
            } else if (maxDimension > 1000) {
              adjustedJpegQuality = Math.max(0.65, jpegQuality - 0.05);
            }
          } else {
            // Para compresión baja, reducir ligeramente solo para páginas muy grandes
            if (maxDimension > 2400) {
              adjustedJpegQuality = Math.max(0.85, jpegQuality - 0.05);
            }
          }
          
          console.info(`Usando calidad JPEG ${adjustedJpegQuality.toFixed(2)} para página ${i+1} (dimensión máx: ${maxDimension.toFixed(0)}px)`);
          
          // Verificar que el canvas tenga contenido
          if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas vacío después de renderizado');
          }
          
          // Obtener data URL del canvas
          let dataUrl;
          try {
            dataUrl = canvas.toDataURL('image/jpeg', adjustedJpegQuality);
            if (!dataUrl || dataUrl === 'data:,') {
              throw new Error('Data URL vacío después de canvas.toDataURL');
            }
          } catch (dataUrlError) {
            console.error(`Error al convertir canvas a data URL:`, dataUrlError);
            throw dataUrlError;
          }
          
          // Convertir data URL a ArrayBuffer
          let imageArrayBuffer;
          try {
            const response = await fetch(dataUrl);
            imageArrayBuffer = await response.arrayBuffer();
            if (!imageArrayBuffer || imageArrayBuffer.byteLength === 0) {
              throw new Error('ArrayBuffer vacío después de fetch');
            }
          } catch (fetchError) {
            console.error(`Error al obtener ArrayBuffer de data URL:`, fetchError);
            throw fetchError;
          }
          
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
            try {
              const fallbackQuality = compressionLevel === 'high' ? 0.35 : 
                                      compressionLevel === 'medium' ? 0.45 : 0.6;
              const fallbackDataUrl = canvas.toDataURL('image/jpeg', fallbackQuality);
              
              if (!fallbackDataUrl || fallbackDataUrl === 'data:,') {
                throw new Error('Fallback data URL vacío');
              }
              
              const fallbackResponse = await fetch(fallbackDataUrl);
              const fallbackImageBuffer = await fallbackResponse.arrayBuffer();
              
              if (!fallbackImageBuffer || fallbackImageBuffer.byteLength === 0) {
                throw new Error('Fallback buffer vacío');
              }
              
              // Incrustar con calidad reducida como último recurso
              const fallbackJpgImage = await newPdfDoc.embedJpg(new Uint8Array(fallbackImageBuffer));
              const newPage = newPdfDoc.addPage([width, height]);
              newPage.drawImage(fallbackJpgImage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
              });
            } catch (fallbackError) {
              console.error(`Error en fallback de incrustar imagen:`, fallbackError);
              // Continuar con la siguiente página
            }
          }
        } catch (pageError) {
          console.error(`Error procesando página ${i+1}:`, pageError);
          // Continuar con la siguiente página en caso de error
        }
      }
      
      // Si no se procesó ninguna página correctamente, devolver el archivo original
      if (newPdfDoc.getPageCount() === 0) {
        console.error("No se pudo procesar ninguna página correctamente");
        return new File(
          [originalFileBuffer],
          `${file.name.replace('.pdf', '')}_original.pdf`,
          { type: 'application/pdf' }
        );
      }
      
      // Guardar el documento comprimido con opciones optimizadas según nivel
      progressCallback(95);
      console.info("Guardando documento comprimido con opciones optimizadas...");
      
      // Ajustar opciones de guardado según nivel de compresión
      const saveOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        // Ajustar la cantidad de objetos por tick según nivel de compresión
        objectsPerTick: compressionLevel === 'high' ? 20 : 
                       compressionLevel === 'medium' ? 40 : 100
      };
      
      console.info(`Guardando con objectsPerTick: ${saveOptions.objectsPerTick} para nivel ${compressionLevel}`);
      
      let compressedPdfBytes;
      try {
        compressedPdfBytes = await newPdfDoc.save(saveOptions);
        
        // Verificar que el resultado no esté vacío
        if (!compressedPdfBytes || compressedPdfBytes.length === 0) {
          throw new Error('Documento PDF comprimido vacío');
        }
      } catch (saveError) {
        console.error('Error al guardar PDF comprimido:', saveError);
        throw saveError;
      }
      
      // Crear nuevo archivo con el PDF comprimido
      const compressedFileName = file.name.replace('.pdf', `_comprimido_${compressionLevel}.pdf`);
      const compressedFile = new File(
        [compressedPdfBytes], 
        compressedFileName, 
        {
          type: 'application/pdf',
          lastModified: new Date().getTime(),
        }
      );
      
      // Verificar que el archivo comprimido no esté vacío
      if (compressedFile.size === 0) {
        console.error('Archivo comprimido vacío después de guardar');
        return new File(
          [originalFileBuffer],
          `${file.name.replace('.pdf', '')}_original.pdf`,
          { type: 'application/pdf' }
        );
      }
      
      // Para nivel alto, verificar si el archivo es anormalmente grande
      if (compressionLevel === 'high' && compressedFile.size > file.size * 1.05) {
        console.warn(`Compresión alta produjo un archivo más grande (${(compressedFile.size/1024/1024).toFixed(2)} MB vs ${(file.size/1024/1024).toFixed(2)} MB). Intentando compresión extrema...`);
        
        // Intentamos escala mucho más reducida y menor calidad
        const extremeCompressionCanvas = document.createElement('canvas');
        const extremeScaleFactor = 0.35; // Factor de escala extremadamente reducido
        const extremeQuality = 0.30; // Calidad muy baja
        
        // Crear un nuevo documento PDF para la compresión extrema
        const extremeDoc = await PDFDocument.create();
        
        for (let i = 0; i < Math.min(numPages, 200); i++) { // Limitamos a 200 páginas para compresión extrema
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
            if (!extremeDataUrl || extremeDataUrl === 'data:,') {
              throw new Error('Data URL extremo vacío');
            }
            
            const extremeResponse = await fetch(extremeDataUrl);
            const extremeBuffer = await extremeResponse.arrayBuffer();
            if (!extremeBuffer || extremeBuffer.byteLength === 0) {
              throw new Error('Buffer extremo vacío');
            }
            
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
          }
        }
        
        // Guardar con compresión máxima
        if (extremeDoc.getPageCount() > 0) {
          try {
            const extremeBytes = await extremeDoc.save({
              useObjectStreams: true,
              addDefaultPage: false,
              objectsPerTick: 15 // Muy bajo para máxima compresión
            });
            
            if (extremeBytes && extremeBytes.length > 0) {
              const extremeFile = new File(
                [extremeBytes], 
                compressedFileName, 
                {
                  type: 'application/pdf',
                  lastModified: new Date().getTime(),
                }
              );
              
              // Si el archivo con compresión extrema es más pequeño, usarlo
              if (extremeFile.size > 0 && extremeFile.size < compressedFile.size && extremeFile.size < file.size) {
                console.info(`Compresión extrema exitosa: ${(extremeFile.size/1024/1024).toFixed(2)} MB (vs original ${(file.size/1024/1024).toFixed(2)} MB)`);
                return extremeFile;
              }
            }
          } catch (extremeError) {
            console.error('Error al guardar compresión extrema:', extremeError);
          }
        }
      }
      
      // Si el archivo es muy pequeño en comparación con el original (posible error)
      if (compressedFile.size < file.size * 0.01 && file.size > 50000) {
        console.warn(`Resultado sospechosamente pequeño (${compressedFile.size} bytes vs original ${file.size} bytes). Devolviendo original.`);
        return new File(
          [originalFileBuffer],
          `${file.name.replace('.pdf', '')}_original.pdf`,
          { type: 'application/pdf' }
        );
      }
      
      // Si es un nivel bajo o medio y el archivo es más grande, devolver el original
      if ((compressionLevel === 'low' || compressionLevel === 'medium') && compressedFile.size > file.size * 1.1) {
        console.warn(`Archivo comprimido (${compressionLevel}) es más grande que el original. Devolviendo el original.`);
        return new File(
          [originalFileBuffer],
          `${file.name.replace('.pdf', '')}_original.pdf`,
          { type: 'application/pdf' }
        );
      }
      
      // Reportar finalización y estadísticas
      progressCallback(100);
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(2);
      
      console.info(`Compresión ${compressionLevel} completada: ${originalSize} MB -> ${compressedSize} MB (${compressionRatio}% reducción)`);
      
      return compressedFile;
    } catch (pdfError) {
      console.error('Error al procesar el PDF:', pdfError);
      
      // FALLBACK DE EMERGENCIA: Si todo falló, devolver una copia del original
      return new File(
        [originalFileBuffer],
        `${file.name.replace('.pdf', '')}_original.pdf`,
        { type: 'application/pdf' }
      );
    }
  } catch (error) {
    console.error('Error general al comprimir PDF:', error);
    // Último intento: devolver null para que el nivel superior maneje el error
    return null;
  }
}
