
import { downloadCompressedImage, compressImageWithResmush, checkResmushAvailability } from '../resmush-service';

/**
 * Comprime una imagen de canvas utilizando reSmush.it o compresión local
 * @param canvas Canvas que contiene la imagen a comprimir
 * @param pageIndex Índice de la página
 * @param useResmush Si se debe usar reSmush.it para la compresión
 * @param resmushQuality Calidad para reSmush.it (1-100)
 * @param fallbackQuality Calidad para compresión local si reSmush falla
 * @returns URL de la imagen comprimida
 */
export async function compressCanvasImage(
  canvas: HTMLCanvasElement,
  pageIndex: number,
  useResmush: boolean = false, 
  resmushQuality: number = 85,
  fallbackQuality: number = 0.85
): Promise<string> {
  // Primero convertimos a JPEG con máxima calidad para preservar detalles
  const initialJpegUrl = canvas.toDataURL('image/jpeg', 1.0);
  
  console.info(`Procesando imagen de página ${pageIndex+1} (${canvas.width}x${canvas.height})`);
  
  if (useResmush) {
    try {
      console.info(`Intentando comprimir imagen con reSmush.it (calidad: ${resmushQuality})`);
      
      // Convertir data URL a blob para enviar a reSmush
      const fetchResponse = await fetch(initialJpegUrl);
      const blob = await fetchResponse.blob();
      
      // Enviar a reSmush para compresión optimizada
      const compressedImageUrl = await compressImageWithResmush(blob, {
        quality: resmushQuality,
        exif: false, // No necesitamos conservar metadatos EXIF
        timeout: 30000, // 30 segundos de timeout
        retries: 2 // 2 reintentos
      });
      
      console.info(`Compresión con reSmush.it exitosa para página ${pageIndex+1}`);
      return compressedImageUrl;
    } catch (error) {
      console.warn(`Error al usar reSmush.it para página ${pageIndex+1}: ${error}. Usando compresión local.`);
      // Fallback a compresión local con alta calidad si reSmush falla
      return canvas.toDataURL('image/jpeg', Math.max(fallbackQuality, 0.8));
    }
  } else {
    // Compresión local con calidad ajustada
    console.info(`Usando compresión local para página ${pageIndex+1} (calidad: ${fallbackQuality})`);
    return canvas.toDataURL('image/jpeg', fallbackQuality);
  }
}

/**
 * Convierte una URL de imagen a ArrayBuffer
 * @param imageUrl URL de la imagen
 * @returns ArrayBuffer con los datos de la imagen
 */
export async function getArrayBufferFromImageUrl(imageUrl: string): Promise<ArrayBuffer> {
  try {
    // Verificar si es una URL de objeto o una data URL
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      return await response.arrayBuffer();
    } else {
      // Si es una URL regular, descargar y convertir
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
          'Referer': window.location.origin || 'http://localhost'
        }
      });
      return await response.arrayBuffer();
    }
  } catch (error) {
    console.error('Error al convertir URL de imagen a ArrayBuffer:', error);
    throw error;
  }
}

/**
 * Verifica la disponibilidad del servicio reSmush.it con timeout
 * @param timeout Tiempo máximo de espera en ms
 * @returns Booleano indicando si el servicio está disponible
 */
export async function checkReSmushAvailability(timeout: number = 5000): Promise<boolean> {
  return await checkResmushAvailability(timeout);
}
