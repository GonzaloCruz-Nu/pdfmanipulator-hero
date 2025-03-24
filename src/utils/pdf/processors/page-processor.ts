
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
    const compressionFactors = COMPRESSION_FACTORS[compressionLevel];
    const jpegQuality = compressionFactors.jpegQuality;
    const scaleFactor = compressionFactors.scaleFactor;
    const textMode = compressionFactors.textMode as 'print' | 'display'; // Explicit casting
    const maximumDimension = compressionFactors.maximumDimension;
    
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
    
    // Renderizar página al canvas con las opciones configuradas
    await renderPageToCanvasWithOptions(
      page,
      canvas,
      dynamicScaleFactor,
      compressionLevel === 'low', // Usar alta calidad para nivel bajo
      textMode
    );
    
    // Calcular calidad de JPEG según nivel y tamaño
    const maxDimension = Math.max(width, height);
    let adjustedJpegQuality = jpegQuality;
    
    // Para nivel bajo, asegurarse de mantener una calidad mínima
    if (compressionLevel === 'low') {
      adjustedJpegQuality = Math.max(jpegQuality, 0.85);
    }
    
    console.info(`Usando calidad JPEG ${adjustedJpegQuality.toFixed(2)} para página ${pageIndex+1} (dimensión máx: ${maxDimension.toFixed(0)}px)`);
    
    // Verificar que el canvas tenga contenido
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas vacío después de renderizado');
    }
    
    // Obtener data URL del canvas con compresión ajustada según nivel
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
      
      // Determinar dimensiones de página según nivel de compresión
      let finalWidth = width;
      let finalHeight = height;
      
      // Ajustar dimensiones según nivel de compresión
      if (compressionLevel === 'medium') {
        finalWidth = width * 0.9;
        finalHeight = height * 0.9;
      } else if (compressionLevel === 'high') {
        finalWidth = width * 0.7;
        finalHeight = height * 0.7;
      } else if (compressionLevel === 'low') {
        // Para nivel bajo, mantener dimensiones muy cercanas al original
        finalWidth = width * 0.99;
        finalHeight = height * 0.99;
      }
      
      // Añadir nueva página con las dimensiones ajustadas
      const newPage = newPdfDoc.addPage([finalWidth, finalHeight]);
      
      // Dibujar la imagen comprimida en la nueva página
      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: finalWidth,
        height: finalHeight,
      });
      
      return true;
    } catch (embedError) {
      console.error(`Error incrustando imagen para página ${pageIndex+1}:`, embedError);
      
      // Si falla, intentar con calidad más baja como último recurso
      try {
        // Usar calidades más bajas según nivel para fallback
        const fallbackQuality = compressionLevel === 'high' ? 0.15 : 
                              compressionLevel === 'medium' ? 0.35 : 0.7;
        
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
        
        // Determinar dimensiones de página reducidas para fallback
        let fallbackWidth = width;
        let fallbackHeight = height;
        
        // Reducir dimensiones para último recurso
        if (compressionLevel === 'medium') {
          fallbackWidth = width * 0.85;
          fallbackHeight = height * 0.85;
        } else if (compressionLevel === 'high') {
          fallbackWidth = width * 0.65;
          fallbackHeight = height * 0.65;
        } else if (compressionLevel === 'low') {
          fallbackWidth = width * 0.95;
          fallbackHeight = height * 0.95;
        }
        
        const newPage = newPdfDoc.addPage([fallbackWidth, fallbackHeight]);
        newPage.drawImage(fallbackJpgImage, {
          x: 0,
          y: 0,
          width: fallbackWidth,
          height: fallbackHeight,
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
