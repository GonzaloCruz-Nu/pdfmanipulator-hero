
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
      jpegQuality
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
          
          // Aplicar la configuración del nivel de compresión
          const adjustedScaleFactor = compressionLevel === 'high' ? scaleFactor : 
                                      compressionLevel === 'medium' ? scaleFactor * 1.2 : 
                                      scaleFactor * 1.4;
          
          // Renderizar página en el canvas con configuraciones según nivel
          await renderPageToCanvasWithOptions(
            page,
            canvas,
            adjustedScaleFactor,
            compressionLevel !== 'high', // Usar alta calidad solo para niveles bajo y medio
            textMode
          );
          
          // Usar calidad de JPEG según nivel de compresión
          const quality = compressionLevel === 'low' ? jpegQuality : 
                          compressionLevel === 'medium' ? jpegQuality : 
                          jpegQuality;
          
          // Obtener data URL directamente del canvas 
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Convertir data URL a ArrayBuffer
          const response = await fetch(dataUrl);
          const imageArrayBuffer = await response.arrayBuffer();
          
          // Obtener dimensiones originales de la página
          const { width, height } = page.getViewport({ scale: 1.0 });
          
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
            const fallbackQuality = compressionLevel === 'high' ? 0.5 : 0.7;
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
        objectsPerTick: compressionLevel === 'high' ? 50 : 100
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
