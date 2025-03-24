
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { COMPRESSION_FACTORS } from '../compression-constants';
import { compressImageWithResmush } from '../resmush-service';
import { renderPageToCanvas } from '../pdf-renderer';
import { CompressionLevel } from '../compression-types';

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
    
    // Cargar el documento PDF con pdf.js
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(fileArrayBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.8.162/cmaps/',
      cMapPacked: true,
      useSystemFonts: true,
      useWorkerFetch: true,
      disableFontFace: false,
      isEvalSupported: true,
    });
    
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    
    // Crear nuevo documento PDF con pdf-lib
    const newPdfDoc = await PDFDocument.create();
    
    // Verificar la conexión con la API de reSmush.it
    let resmushAvailable = false;
    try {
      const testConnectionResult = await fetch('https://api.resmush.it/ping', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 segundos de timeout
      });
      resmushAvailable = testConnectionResult.ok;
      if (resmushAvailable) {
        console.info('Conexión exitosa con la API de reSmush.it');
      } else {
        console.warn('No se pudo conectar con la API de reSmush.it. Se usará compresión local.');
      }
    } catch (error) {
      console.warn('Error al conectar con reSmush.it API:', error);
      resmushAvailable = false;
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
      await renderPageToCanvas(
        page,
        canvas,
        scaleFactor,
        useHighQualityFormat,
        preserveTextQuality ? 'print' : 'display'
      );
      
      // Comprimir la imagen del canvas
      let compressedImageUrl;
      
      // Solo intentar usar reSmush.it si está disponible
      if (resmushAvailable && compressionLevel !== 'low') {
        try {
          // Convertir canvas a Blob con alta calidad
          const canvasBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob || new Blob([]));
            }, 'image/jpeg', imageQuality);
          });
          
          // Usar la API para comprimir
          compressedImageUrl = await compressImageWithResmush(
            canvasBlob,
            { quality: resmushQuality, timeout: 15000 }
          );
          
          console.info(`Página ${i+1} comprimida exitosamente con reSmush.it API`);
        } catch (error) {
          console.warn(`Error al usar reSmush.it API: ${error}. Usando compresión local.`);
          // Fallback: usar compresión local si la API falla
          compressedImageUrl = canvas.toDataURL('image/jpeg', imageQuality);
        }
      } else {
        // Compresión local con alta calidad para nivel bajo o si reSmush no está disponible
        compressedImageUrl = canvas.toDataURL('image/jpeg', imageQuality);
        console.info(`Usando compresión local para página ${i+1} con calidad ${imageQuality}`);
      }
      
      // Cargar la imagen comprimida
      let compressedImageArrayBuffer;
      
      if (compressedImageUrl.startsWith('data:')) {
        // Es un data URL (compresión local)
        const base64 = compressedImageUrl.split(',')[1];
        compressedImageArrayBuffer = Buffer.from(base64, 'base64');
      } else {
        // Es una URL (reSmush.it API)
        try {
          const compressedImageResponse = await fetch(compressedImageUrl, {
            signal: AbortSignal.timeout(15000) // 15 segundos de timeout
          });
          if (!compressedImageResponse.ok) {
            throw new Error(`Error al descargar imagen comprimida: ${compressedImageResponse.status}`);
          }
          const compressedImageBlob = await compressedImageResponse.blob();
          compressedImageArrayBuffer = await compressedImageBlob.arrayBuffer();
        } catch (error) {
          console.warn(`Error al descargar imagen comprimida: ${error}. Usando original.`);
          // Si falla la descarga, usar la imagen original
          compressedImageUrl = canvas.toDataURL('image/jpeg', imageQuality);
          const base64 = compressedImageUrl.split(',')[1];
          compressedImageArrayBuffer = Buffer.from(base64, 'base64');
        }
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
