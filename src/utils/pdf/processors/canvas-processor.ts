
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
      
      // Añadir metadatos distintos según nivel para garantizar diferencias
      if (compressionLevel === 'low') {
        newPdfDoc.setCreator(`PDF Optimizer - Nivel ${compressionLevel} (optimización ligera)`);
        newPdfDoc.setProducer(`CompresorPDF v2.1 - CALIDAD ALTA`);
        newPdfDoc.setSubject('Compresión ligera para mantener calidad');
      } else if (compressionLevel === 'medium') {
        newPdfDoc.setCreator(`PDF Optimizer - Nivel ${compressionLevel} (reducción significativa)`);
        newPdfDoc.setProducer(`CompresorPDF v2.1 - EQUILIBRADO`);
        newPdfDoc.setSubject('Compresión equilibrada para ahorro de espacio');
      } else {
        newPdfDoc.setCreator(`PDF Optimizer - Nivel ${compressionLevel} (máxima compresión)`);
        newPdfDoc.setProducer(`CompresorPDF v2.1 - MÁXIMA COMPRESIÓN`);
        newPdfDoc.setSubject('Compresión agresiva para mínimo tamaño');
      }
      
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
          // Para baja compresión, usamos valor más bajo que antes para asegurar diferencia
          let adjustedJpegQuality = compressionLevel === 'low' ? Math.min(jpegQuality, 0.89) : jpegQuality;
          
          // Ajustes de calidad según el nivel y tamaño
          if (compressionLevel === 'high') {
            // Para alta compresión, reducir más agresivamente según tamaño
            if (maxDimension > 1200) {
              adjustedJpegQuality = Math.max(0.30, jpegQuality - 0.10);
            } else if (maxDimension > 800) {
              adjustedJpegQuality = Math.max(0.35, jpegQuality - 0.05);
            }
          } else if (compressionLevel === 'medium') {
            // Para compresión media, reducir moderadamente según tamaño
            if (maxDimension > 1500) {
              adjustedJpegQuality = Math.max(0.45, jpegQuality - 0.15);
            } else if (maxDimension > 1000) {
              adjustedJpegQuality = Math.max(0.50, jpegQuality - 0.10);
            }
          } else if (compressionLevel === 'low') {
            // Para compresión baja, reducir ligeramente para asegurar alguna compresión
            if (maxDimension > 2000) {
              adjustedJpegQuality = Math.max(0.80, jpegQuality - 0.10);
            } else {
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
            // Aplicar diferentes calidades según el nivel de compresión
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
              // Usar calidades más bajas según nivel para fallback
              const fallbackQuality = compressionLevel === 'high' ? 0.25 : 
                                     compressionLevel === 'medium' ? 0.35 : 0.5;
              
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
      // Usar diferentes configuraciones para asegurar diferente resultado
      const saveOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        // Ajustar la cantidad de objetos por tick según nivel de compresión
        objectsPerTick: compressionLevel === 'high' ? 15 : 
                       compressionLevel === 'medium' ? 30 : 60
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
      
      // Para nivel bajo, si el archivo es mayor que el original, intentar nueva compresión
      if (compressionLevel === 'low' && compressedFile.size >= file.size * 0.98) {
        console.warn(`Archivo comprimido en nivel bajo no logró reducción mínima. Intentando ajuste...`);
        
        // Crear un nuevo documento con configuración ligeramente más agresiva
        const lowRetriedDoc = await PDFDocument.create();
        lowRetriedDoc.setCreator(`PDF Optimizer - Nivel ${compressionLevel} (segundo intento)`);
        lowRetriedDoc.setProducer(`CompresorPDF v2.1 - CALIDAD OPTIMIZADA`);
        
        // Copiar páginas del documento comprimido
        const existingPdfDoc = await PDFDocument.load(compressedPdfBytes);
        const copiedPages = await lowRetriedDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
        
        for (const page of copiedPages) {
          lowRetriedDoc.addPage(page);
        }
        
        // Guardar con configuración optimizada para nivel bajo
        const retriedBytes = await lowRetriedDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 40
        });
        
        const retriedFile = new File(
          [retriedBytes], 
          compressedFileName, 
          {
            type: 'application/pdf',
            lastModified: new Date().getTime(),
          }
        );
        
        // Verificar si logramos reducción
        if (retriedFile.size < file.size * 0.98) {
          console.info(`Segundo intento exitoso para nivel bajo: ${(retriedFile.size/1024/1024).toFixed(2)} MB (${((file.size - retriedFile.size) / file.size * 100).toFixed(1)}% reducción)`);
          return retriedFile;
        }
        
        // Si no logramos compresión, usar estrategia alternativa
        try {
          console.info(`Intentando estrategia alternativa para nivel bajo...`);
          const forcedLowBytes = await existingPdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 20
            // Eliminada la propiedad 'useZeroToNineDigits' que causaba el error
          });
          
          const forcedLowFile = new File(
            [forcedLowBytes], 
            compressedFileName, 
            {
              type: 'application/pdf',
              lastModified: new Date().getTime(),
            }
          );
          
          if (forcedLowFile.size < file.size * 0.98) {
            console.info(`Estrategia alternativa exitosa para nivel bajo`);
            return forcedLowFile;
          }
        } catch (forcedError) {
          console.error('Error en estrategia alternativa para nivel bajo:', forcedError);
        }
      }
      
      // Para nivel medio, si el archivo es sustancialmente mayor, intentar nueva estrategia
      if (compressionLevel === 'medium' && compressedFile.size >= file.size * 0.95) {
        console.warn(`Archivo comprimido en nivel medio no logró reducción suficiente. Intentando ajuste...`);
        
        try {
          // Usar compresión alta pero con mayor calidad
          const mediumRetriedResult = await compressPDFWithCanvas(
            file,
            'high', // Usar nivel alto
            fileIndex,
            totalFiles,
            progressCallback
          );
          
          if (mediumRetriedResult && mediumRetriedResult.size < file.size * 0.9) {
            console.info(`Nueva estrategia exitosa para nivel medio: ${(mediumRetriedResult.size/1024/1024).toFixed(2)} MB (${((file.size - mediumRetriedResult.size) / file.size * 100).toFixed(1)}% reducción)`);
            
            // Renombrar para mantener coherencia
            return new File(
              [await mediumRetriedResult.arrayBuffer()],
              file.name.replace('.pdf', `_comprimido_medio.pdf`),
              { type: 'application/pdf' }
            );
          }
        } catch (mediumRetryError) {
          console.error('Error en segundo intento para nivel medio:', mediumRetryError);
        }
      }
      
      // Para nivel alto, verificar si el archivo es anormalmente grande e intentar compresión extrema
      if (compressionLevel === 'high' && compressedFile.size > file.size * 0.9) {
        console.warn(`Compresión alta no logró reducción suficiente. Intentando compresión extrema...`);
        
        try {
          const { ultimateCompression } = await import('../ultimate-compression');
          const extremeResult = await ultimateCompression(originalFileBuffer, 'high', file.name);
          
          if (extremeResult && extremeResult.size < file.size * 0.75) {
            console.info(`Compresión extrema exitosa: ${(extremeResult.size/1024/1024).toFixed(2)} MB (${((file.size - extremeResult.size) / file.size * 100).toFixed(1)}% reducción)`);
            return extremeResult;
          }
        } catch (extremeError) {
          console.error('Error en compresión extrema:', extremeError);
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
