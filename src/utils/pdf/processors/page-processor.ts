
import { PDFPageProxy } from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { renderPageToCanvasWithOptions } from './render-utils';
import { adjustJpegQuality, calculateDynamicScaleFactor } from './canvas-config';
import { CompressionLevel } from '../compression-types';
import { COMPRESSION_FACTORS } from '../compression-constants';

/**
 * Procesa una página de PDF y la añade al nuevo documento
 * @param pdfDoc Documento PDF original
 * @param newPdfDoc Nuevo documento PDF
 * @param pageIndex Índice de la página
 * @param compressionLevel Nivel de compresión
 * @returns Booleano indicando si la página se procesó correctamente
 */
export async function processPage(
  pdfDoc: any,
  newPdfDoc: PDFDocument,
  pageIndex: number,
  compressionLevel: CompressionLevel
): Promise<boolean> {
  try {
    // Obtener configuración de compresión según nivel
    const {
      jpegQuality,
      scaleFactor,
      textMode,
      maximumDimension
    } = COMPRESSION_FACTORS[compressionLevel];

    // Obtener página actual
    const page = await pdfDoc.getPage(pageIndex + 1);
    
    // Crear canvas para renderizar la página
    const canvas = document.createElement('canvas');
    
    // Obtener dimensiones originales de la página
    const { width, height } = page.getViewport({ scale: 1.0 });
    
    // Calcular factor de escala dinámico
    const dynamicScaleFactor = calculateDynamicScaleFactor(
      width, 
      height, 
      scaleFactor, 
      maximumDimension
    );
    
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
    
    // Calcular calidad de JPEG según nivel y tamaño
    const maxDimension = Math.max(width, height);
    let adjustedJpegQuality = adjustJpegQuality(compressionLevel, jpegQuality, maxDimension);
    
    console.info(`Usando calidad JPEG ${adjustedJpegQuality.toFixed(2)} para página ${pageIndex+1} (dimensión máx: ${maxDimension.toFixed(0)}px)`);
    
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
      
      return true;
    } catch (embedError) {
      console.error(`Error incrustando imagen para página ${pageIndex+1}:`, embedError);
      
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
        
        return true;
      } catch (fallbackError) {
        console.error(`Error en fallback de incrustar imagen:`, fallbackError);
        return false;
      }
    }
  } catch (pageError) {
    console.error(`Error procesando página ${pageIndex+1}:`, pageError);
    return false;
  }
}
